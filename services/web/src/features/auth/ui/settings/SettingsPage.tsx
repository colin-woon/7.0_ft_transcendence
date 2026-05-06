'use client';

import Image from 'next/image';
import intraIcon from '@/components/ui/imgs/42_icon.png';
import PasswordForm from '@/features/auth/ui/settings/components/DropdownPassword';
import CreateUserDialog from '@/features/auth/ui/settings/components/CreateUserDialog';
import AdminToolsCard from '@/features/auth/ui/settings/components/AdminToolsCard';
import {
	AlertCircle,
	ChartNoAxesColumn,
	Calendar,
	Zap,
	LayoutDashboard,
	Link as LinkIcon,
	Loader2,
	LogOut,
	RefreshCcw,
	SquarePen,
	Trash2,
	Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
	CreateUserPayload,
	SessionInfo,
	User,
} from '@/features/auth/api/authService';
import { useAdminUsers } from '@/features/auth/hooks/useAdminUsers';
import { useAuthActions } from '@/features/auth/hooks/useAuthActions';
import { useProfileEdit } from '@/features/auth/hooks/useProfileEdit';
import { useSessions } from '@/features/auth/hooks/useSessions';
import { useUserProfile } from '@/features/auth/hooks/useUserProfile';
import { useAuth } from '@/features/auth/models/AuthContext';
import ConfirmActionDialog from '@/features/auth/ui/settings/components/ConfirmActionDialog';
import EditUserDialog, {
	type EditUserDraft,
} from '@/features/auth/ui/settings/components/EditUserDialog';
import {
	fileToDataUrl,
	validateAvatarFile,
} from '@/features/auth/utils/avatarFile';
import {
	createUserSchema,
	passwordChangeSchema,
	type PasswordChangeFormValues,
	updateProfileSchema,
	type UpdateProfileFormValues,
} from '@/features/auth/validation/authSchemas';


interface SettingsPageProps {
  initialProfile?: User | null;
  initialProfileError?: string | null;
  initialProfileErrorStatus?: number | null;
  initialSessions?: SessionInfo[];
  routeMessage?: string | null;
  isRouteMessageError?: boolean;
}

type SettingsTab = {
	key: 'profile' | 'security' | 'sessions' | 'admin';
	label: string;
	href: string;
	adminOnly?: boolean;
};

type ConfirmAction =
	| { kind: 'delete-account' }
	| { kind: 'logout' }
	| { kind: 'logout-all' }
	| { kind: 'end-session'; sessionId: string };

const SETTINGS_TABS: readonly SettingsTab[] = [
	{ key: 'profile', label: 'Profile', href: '/settings/profile' },
	{ key: 'security', label: 'Security', href: '/settings/security' },
	{ key: 'sessions', label: 'Sessions', href: '/settings/sessions' },
	{ key: 'admin', label: 'Admin', href: '/settings/admin', adminOnly: true },
];

/**
 * Returns copy and tone for confirmation modal from selected action.
 */
function getConfirmConfig(action: ConfirmAction | null): {
	title: string;
	message: string;
	confirmLabel: string;
	tone: 'warning' | 'danger';
} {
	if (!action) {
		return {
			title: 'Confirm action',
			message: 'Please confirm this action.',
			confirmLabel: 'Confirm',
			tone: 'warning',
		};
	}

  switch (action.kind) {
    case 'delete-account':
      return {
        title: "Delete account",
        message: "This permanently removes your account and cannot be undone.",
        confirmLabel: "Delete",
        tone: "danger",
      };
    case 'logout':
      return {
        title: "Logout",
        message: "You will be signed out from your current session.",
        confirmLabel: "Logout",
        tone: "warning",
      };
    case 'logout-all':
      return {
        title: "Logout all sessions",
        message:
          "This signs you out from every device, including your current one.",
        confirmLabel: "Logout all",
        tone: "warning",
      };
    case "end-session":
      return {
        title: "End session",
        message: "This session will be revoked immediately.",
        confirmLabel: "End session",
        tone: "warning",
      };
    default:
      return {
        title: "Confirm action",
        message: "Please confirm this action.",
        confirmLabel: "Confirm",
        tone: "warning",
      };
  }
}

const XIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

export default function SettingsPage({
  initialProfile,
  initialProfileError,
  initialProfileErrorStatus,
  initialSessions,
  routeMessage,
  isRouteMessageError,
}: SettingsPageProps) {
	const router = useRouter();
	const pathname = usePathname();

  const {
    user,
    isLoading: authLoading,
    hasRole,
    updatePassword,
    clearError,
    error: authError,
  } = useAuth();

  const {
    loginWith,
    linkWith,
    logoutNow,
    refreshNow,
    actionLoading,
    actionError,
    clearActionError,
  } = useAuthActions();

	const {
		profile,
		loading: profileLoading,
		error: profileError,
		clearError: clearProfileError,
		refetch,
	} = useUserProfile(undefined, {
		skip: !user,
		initialProfile,
		initialError: initialProfileError,
		initialErrorStatus: initialProfileErrorStatus,
	});

	const {
		sessions,
		loading: sessionsLoading,
		error: sessionsError,
		clearError: clearSessionsError,
		endingSessionId,
		endingAll,
		refresh: refreshSessions,
		endSession,
		endAllSessions,
	} = useSessions({ initialSessions });

	const {
		saveProfile,
		deleteProfile,
		saving: profileSaving,
		deleting: profileDeleting,
		error: profileEditError,
		clearError: clearProfileEditError,
	} = useProfileEdit();

	const {
		createUser: adminCreateUser,
		loading: adminLoading,
		error: adminHookError,
		clearError: clearAdminHookError,
	} = useAdminUsers();

	const [editModalOpen, setEditModalOpen] = useState(false);
	const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
		null
	);
	const lastConfirmAction = useRef<ConfirmAction | null>(null);

  if (confirmAction) {
  lastConfirmAction.current = confirmAction;
  }
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [adminActionSuccess, setAdminActionSuccess] = useState<string | null>(
    null,
  );
  const [routeMessageState, setRouteMessageState] = useState<string | null>(
    routeMessage ?? null,
  );
  const [isRouteMessageErrorState, setIsRouteMessageErrorState] = useState<boolean>(
    isRouteMessageError ?? false,
  );
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [createUserSubmitAttempted, setCreateUserSubmitAttempted] = useState(
    false,
  );
  const [createUserDialogError, setCreateUserDialogError] = useState<
    string | null
  >(null);

	const [editDraft, setEditDraft] = useState<EditUserDraft>({
		username: '',
		fullName: '',
		bio: '',
	});

  const [passwordForm, setPasswordForm] = useState<PasswordChangeFormValues>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<
    Partial<Record<keyof PasswordChangeFormValues, string>>
  >({});
  const [passwordFormError, setPasswordFormError] = useState<string | null>(
    null,
  );
  const [passwordFormSuccess, setPasswordFormSuccess] = useState<string | null>(
    null,
  );
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

  const [newUserForm, setNewUserForm] = useState<CreateUserPayload>({
    username: "",
    fullName: "",
    overflowEmail: "",
    bio: "",
    role: "STUDENT",
    isBanned: false,
  });

	const isAdmin = hasRole('ADMIN');
	const activeProfile = profile ?? user;
	const requestedTab = pathname?.split('/')[2] ?? 'profile';
	const activeTab = useMemo(() => {
		const candidate = requestedTab as SettingsTab['key'];
		const isKnown = SETTINGS_TABS.some((tab) => tab.key === candidate);
		return isKnown ? candidate : 'profile';
	}, [requestedTab]);
	const lastTabRef = useRef<string | null>(null);

	const visibleTabs = useMemo(
		() => SETTINGS_TABS.filter((tab) => !tab.adminOnly || isAdmin),
		[isAdmin]
	);

  const editValidation = useMemo(
    () =>
      updateProfileSchema.safeParse({
        username: editDraft.username,
        fullName: editDraft.fullName,
        bio: editDraft.bio,
        avatarFile: pendingAvatarFile ? "placeholder" : "",
      }),
    [editDraft.bio, editDraft.fullName, editDraft.username, pendingAvatarFile],
  );
  const editValidationMessage = editValidation.success
    ? null
    : editValidation.error.issues[0]?.message || "Invalid input";
	const createUserValidation = useMemo(
		() =>
			createUserSchema.safeParse({
				username: newUserForm.username,
				fullName: newUserForm.fullName,
				email: newUserForm.overflowEmail,
				bio: newUserForm.bio ?? '',
				role: newUserForm.role,
				isBanned: newUserForm.isBanned,
			}),
		[
			newUserForm.bio,
			newUserForm.overflowEmail,
			newUserForm.fullName,
			newUserForm.isBanned,
			newUserForm.role,
			newUserForm.username,
		]
	);
	const createUserValidationMessage = !createUserValidation.success
		? createUserValidation.error.issues[0]?.message || 'Invalid input'
		: null;
	const createUserDisplayMessage = createUserSubmitAttempted
		? createUserValidationMessage
		: null;

	useEffect(() => {
		if (!activeProfile) return;
		setEditDraft({
			username: activeProfile.username,
			fullName: activeProfile.fullName,
			bio: activeProfile.bio ?? '',
		});
	}, [activeProfile]);

	useEffect(() => {
		if (authLoading || !user) return;

		if (requestedTab !== activeTab) {
			router.replace(`/settings/${activeTab}`);
			return;
		}

		if (activeTab === 'admin' && !isAdmin) {
			router.replace('/settings/profile');
		}
	}, [activeTab, authLoading, isAdmin, requestedTab, router, user]);

	useEffect(() => {
		if (!authLoading && !user) {
			router.replace('/login');
		}
	}, [authLoading, user, router]);

	useEffect(() => {
		if (!user) {
			lastTabRef.current = activeTab;
			return;
		}

		if (activeTab === 'sessions' && lastTabRef.current !== 'sessions') {
			void refreshSessions();
		}

    lastTabRef.current = activeTab;
  }, [activeTab, refreshSessions, user]);

  useEffect(() => {
    if (!createUserModalOpen) {
      setCreateUserSubmitAttempted(false);
      setCreateUserDialogError(null);
    }
  }, [createUserModalOpen]);

  useEffect(() => {
    if (routeMessageState == null) return;
    const timer = setTimeout(() => {
      setRouteMessageState(null);
      setIsRouteMessageErrorState(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [routeMessageState]);

  useEffect(() => {
    if (routeMessage == null) return;
    setRouteMessageState(routeMessage);
    setIsRouteMessageErrorState(Boolean(isRouteMessageError));
  }, [routeMessage, isRouteMessageError]);

  const pageError =
    (isRouteMessageErrorState ? routeMessageState : null) ??
    authError ??
    profileError ??
    profileEditError ??
    (activeTab === "sessions" ? sessionsError : null) ??
    adminActionError ??
    actionError ??
    (activeTab === "admin" ? adminHookError : null);

	const updateNewUserForm = (key: string, value: any) => {
		setNewUserForm((prev) => ({ ...prev, [key]: value }));
	};

	/**
	 * Persists profile edits for the currently authenticated user.
	 */
	const handleSaveOwnProfile = async () => {
		if (pendingAvatarFile) {
			const validationError = validateAvatarFile(pendingAvatarFile);
			if (validationError) {
				setAdminActionError(validationError);
				return;
			}
		}

		let avatarFilePayload: string | undefined;
		if (pendingAvatarFile) {
			avatarFilePayload = await fileToDataUrl(pendingAvatarFile);
		}

    const parsed = updateProfileSchema.safeParse({
      username: editDraft.username,
      fullName: editDraft.fullName,
      bio: editDraft.bio,
      avatarFile: avatarFilePayload ?? "",
    });

    if (!parsed.success) {
      setAdminActionError(parsed.error.issues[0]?.message || "Invalid input");
      return;
    }

		const updated = await saveProfile({
			username: editDraft.username.trim() || undefined,
			fullName: editDraft.fullName.trim() || undefined,
			bio: editDraft.bio.trim() || undefined,
			avatarFile: avatarFilePayload,
		});

		if (!updated) return;

		setPendingAvatarFile(null);
		setEditModalOpen(false);
		await refetch();
		setAdminActionSuccess('Profile updated successfully.');
	};

	/**
	 * Applies password update flow with schema-level validation.
	 */
	const handlePasswordUpdate = async (
		event: React.FormEvent<HTMLFormElement>
	) => {
		event.preventDefault();
		setPasswordFormError(null);
		setPasswordFormSuccess(null);

		const parsed = passwordChangeSchema.safeParse(passwordForm);
		if (!parsed.success) {
			const nextErrors: Partial<
				Record<keyof PasswordChangeFormValues, string>
			> = {};
			for (const issue of parsed.error.issues) {
				const field = issue.path[0] as
					| keyof PasswordChangeFormValues
					| undefined;
				if (field && !nextErrors[field]) {
					nextErrors[field] = issue.message;
				}
			}
			setPasswordErrors(nextErrors);
			return;
		}

		const hasExistingPassword = Boolean(activeProfile?.hasPassword);
		const currentPassword = parsed.data.currentPassword;
		if (
			hasExistingPassword &&
			(!currentPassword || currentPassword.length === 0)
		) {
			setPasswordErrors({
				currentPassword:
					'Current password is required to change your password',
			});
			return;
		}

    setPasswordErrors({});
    setPasswordSaving(true);
    try {
      await updatePassword({
        currentPassword: currentPassword || undefined,
        newPassword: parsed.data.newPassword,
        confirmPassword: parsed.data.confirmPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordFormSuccess(
        hasExistingPassword
          ? "Password changed successfully."
          : "Password created successfully.",
      );
      await refetch();
    } catch (err) {
      setPasswordFormError(
        err instanceof Error ? err.message : "Failed to update password",
      );
    } finally {
      setPasswordSaving(false);
    }
  };

	/**
	 * Creates a user as admin using the fuller UserInfoDTO-aligned fields.
	 */
	const handleAdminCreateUser = async (
		event: React.FormEvent<HTMLFormElement>
	) => {
		event.preventDefault();
		setCreateUserSubmitAttempted(true);
    setCreateUserDialogError(null);
		setAdminActionSuccess(null);


	const parsed = createUserSchema.safeParse(newUserForm);
	if (!parsed.success) {
		return;
	}
	const { username, fullName, overflowEmail, bio, role, isBanned } = parsed.data;


    if (!username || !fullName || !overflowEmail) {
      setAdminActionError("Username, full name, and email are required.");
      return;
    }

		const created = await adminCreateUser({
			username,
			fullName,
			overflowEmail,
			bio: bio?.trim() || undefined,
			role,
			isBanned,
		});

		if (!created) {
			setCreateUserDialogError('Failed to create user');
			return;
		}

		setNewUserForm({
			username: '',
			fullName: '',
			overflowEmail: '',
			bio: '',
			role: 'STUDENT',
			isBanned: false,
		});
    setCreateUserDialogError(null);
		setAdminActionSuccess(
			`User "${created.username}" created successfully (ID: ${created.id})`
		);
	};

	/**
	 * Executes the currently-selected destructive/security action.
	 */
	const runConfirmedAction = async () => {
		if (!confirmAction) return;
		setConfirmLoading(true);
		try {
			if (confirmAction.kind === 'delete-account') {
				const deleted = await deleteProfile();
				if (deleted) {
					router.push('/login');
				}
			}

			if (confirmAction.kind === 'logout') {
				await logoutNow();
			}

			if (confirmAction.kind === 'logout-all') {
				await endAllSessions();
			}

			if (confirmAction.kind === 'end-session') {
				await endSession(confirmAction.sessionId);
			}
		} finally {
			setConfirmLoading(false);
			setConfirmAction(null);
		}
	};

  const clearAllErrors = () => {
    clearError();
    clearProfileError();
    clearProfileEditError();
    clearSessionsError();
    clearActionError();
    clearAdminHookError();
    setRouteMessageState(null);
    setIsRouteMessageErrorState(false);
    setAdminActionError(null);
    setCreateUserDialogError(null);
  };

	if (authLoading || profileLoading) {
		return (
			<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
				<div className="inline-flex items-center gap-2 text-sm text-base-content/70">
					<Loader2 size={16} className="animate-spin" />
					Loading settings...
				</div>
			</div>
		);
	}

	if (!user || !activeProfile) {
		return (
			<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
				<div className="inline-flex items-center gap-2 text-sm text-base-content/70">
					<Loader2 size={16} className="animate-spin" />
					Redirecting to login...
				</div>
			</div>
		);
	}

	const confirmConfig = getConfirmConfig(
		confirmAction || lastConfirmAction.current
	);
  const alertTextStyle = {
    fontSize: 12.5,
    fontWeight: 500,
    letterSpacing: "0.01em",
  } as const;
  const dismissButtonStyle = {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 18,
    height: 18,
    borderRadius: 4,
    opacity: 0.45,
    color: "inherit",
    padding: 0,
    transition: "opacity 0.15s",
  } as const;
  const errorNoticeStyle = {
    background: "rgba(255, 241, 241, 0.84)",
    border: "1px solid rgba(210, 155, 155, 0.9)",
    color: "#6B2323",
    boxShadow: "0 10px 24px rgba(107, 35, 35, 0.08)",
    animation: "slideDownFade 0.2s ease-out",
    backdropFilter: "blur(6px)",
  } as const;
  const successNoticeStyle = {
    background: "rgba(236, 251, 241, 0.86)",
    border: "1px solid rgba(152, 197, 142, 0.9)",
    color: "#2A4F24",
    boxShadow: "0 10px 24px rgba(42, 79, 36, 0.08)",
    animation: "slideDownFade 0.2s ease-out",
    backdropFilter: "blur(6px)",
  } as const;

	return (
		<div className="max-w-4xl mx-auto px-4 py-8">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-base-content">
					Settings
				</h1>
				<p className="text-sm text-base-content/60 mt-1">
					Manage profile, account security, sessions, and admin
					controls.
				</p>
			</div>

      {pageError && (
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 mb-3 rounded-lg"
          style={errorNoticeStyle}
        >
          <style>{`@keyframes slideDownFade { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }`}</style>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.65 }}>
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.1"/>
            <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <circle cx="8" cy="11" r="0.65" fill="currentColor"/>
          </svg>
          <p className="flex-1 m-0" style={alertTextStyle}>{pageError}</p>
          <button
            onClick={clearAllErrors}
            type="button"
            aria-label="Dismiss"
            style={dismissButtonStyle}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={e => e.currentTarget.style.opacity = "0.45"}
          >
            <XIcon />
          </button>
        </div>
      )}

      {routeMessageState && !isRouteMessageErrorState && (
        <div className="alert alert-success mb-4">
          <span className="text-sm">{routeMessageState}</span>
          <button
            type="button"
            className="btn btn-xs btn-ghost ml-auto"
            onClick={() => {
              setRouteMessageState(null);
              setIsRouteMessageErrorState(false);
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {adminActionSuccess && (
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 mb-3 rounded-lg"
          style={successNoticeStyle}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.65 }}>
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.1"/>
            <path d="M5.5 8l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="flex-1 m-0" style={alertTextStyle}>{adminActionSuccess}</p>
          <button
            onClick={() => setAdminActionSuccess(null)}
            type="button"
            aria-label="Dismiss"
            style={dismissButtonStyle}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={e => e.currentTarget.style.opacity = "0.45"}
          >
            <XIcon />
          </button>
        </div>
      )}

			<div
				role="tablist"
				className="tabs tabs-bordered w-full overflow-x-auto flex-nowrap"
			>
				{visibleTabs.map((tab) => {
					const isActive =
						pathname === tab.href ||
						(pathname === '/settings' && tab.key === 'profile');
					return (
						<Link
							key={tab.href}
							href={tab.href}
							role="tab"
							className={`tab whitespace-nowrap ${isActive ? 'tab-active' : ''}`}
						>
							{tab.label}
						</Link>
					);
				})}
			</div>

      <div className="card bg-base-100 border border-base-200 shadow-sm mt-0 rounded-t-none">
        <div className="card-body">
          {activeTab === "profile" && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-base-content">
                  Public Profile
                </h2>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost btn-square"
                    onClick={() => setEditModalOpen(true)}
                    title="Edit profile"
                  >
                    <SquarePen size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div className="rounded-xl border border-base-200 p-3">
                  <div className="text-xs text-base-content/60 mb-1">
                    Username
                  </div>
                  <div className="font-medium">@{activeProfile.username}</div>
                </div>
                <div className="rounded-xl border border-base-200 p-3">
                  <div className="text-xs text-base-content/60 mb-1">
                    Full Name
                  </div>
                  <div className="font-medium">{activeProfile.fullName}</div>
                </div>
                <div className="rounded-xl border border-base-200 p-3 md:col-span-2">
                  <div className="text-xs text-base-content/60 mb-1">Email</div>
                  {activeProfile?.overflowEmail ? (
                    <div className="font-medium">{activeProfile.overflowEmail}</div>
                  ) : null}
                  {activeProfile?.intraEmail ? (
                    <div className="font-medium">{activeProfile.intraEmail}</div>
                  ) : null}
                  {activeProfile?.googleEmail ? (
                    <div className="font-medium">{activeProfile.googleEmail}</div>
                  ) : null}
                </div>
                <div className="rounded-xl border border-base-200 p-3 md:col-span-2">
                  <div className="text-xs text-base-content/60 mb-1">Bio</div>
                  <div className="text-sm">
                    {activeProfile.bio || "No bio yet"}
                  </div>
                </div>
              </div>

              <h2 className="text-base font-bold text-base-content mt-8">
                Account Connections
              </h2>
              <div className="mt-2 divide-y divide-base-200 rounded-xl border border-base-200 overflow-hidden">
              
                {/* Google */}
                <div className="flex items-center justify-between px-4 py-3.5 gap-4">
                  <div className="flex items-center gap-3">
                    <svg className="size-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-base-content">Google</p>
                      <p className="text-xs text-base-content/50">Connect to log in with your Google account</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`btn btn-sm rounded-full px-4 font-semibold normal-case shrink-0 ${activeProfile.linkedWithGoogle ? "btn-outline" : "btn-neutral"}`}
                    onClick={() => !activeProfile.linkedWithGoogle && linkWith("google")}
                    disabled={activeProfile.linkedWithGoogle}
                  >
                    {activeProfile.linkedWithGoogle ? "Linked" : "Connect"}
                  </button>
                </div>
              
                {/* 42 Intra */}
                <div className="flex items-center justify-between px-4 py-3.5 gap-4">
                  <div className="flex items-center gap-3">
                    <Image 
                      src={intraIcon} 
                      alt="42 Intra" 
                      className="size-5 shrink-0 object-contain" 
                    />
                    <div>
                      <p className="text-sm font-medium text-base-content">42 Intra</p>
                      <p className="text-xs text-base-content/50">Connect to log in with your 42 account</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`btn btn-sm rounded-full px-4 font-semibold normal-case shrink-0 ${activeProfile.linkedWithIntra ? "btn-outline" : "btn-neutral"}`}
                    onClick={() => !activeProfile.linkedWithIntra && linkWith("42")}
                    disabled={activeProfile.linkedWithIntra}
                  >
                    {activeProfile.linkedWithIntra ? "Linked" : "Connect"}
                  </button>
                </div>
              
              </div>
            </>
          )}

					{activeTab === 'security' && (
						<>
							<h2 className="text-base font-bold text-base-content mt-2">
								Account security
							</h2>
							{/* Password */}
							<div className="rounded-xl border border-base-200 overflow-hidden">
								{/* Header row — always visible */}
								<div className="flex items-center justify-between px-4 py-3.5 gap-4">
									<div>
										<p className="text-sm font-medium text-base-content">
											Password
										</p>
										<p className="text-xs text-base-content/50">
											{activeProfile.hasPassword
												? 'Change your existing password'
												: 'Set a password to log in'}
										</p>
									</div>
									{!passwordOpen && (
										<button
											type="button"
											className="btn btn-sm rounded-full px-4 font-semibold normal-case shrink-0 btn-neutral"
											onClick={() =>
												setPasswordOpen(true)
											}
										>
											{activeProfile.hasPassword
												? 'Change password'
												: 'Set password'}
										</button>
									)}
								</div>

								{/* Animated form — drops down inside the card */}
								<PasswordForm
									passwordOpen={passwordOpen}
									setPasswordOpen={setPasswordOpen}
									passwordForm={passwordForm}
									setPasswordForm={setPasswordForm}
									passwordErrors={passwordErrors}
									passwordFormError={passwordFormError}
									passwordFormSuccess={passwordFormSuccess}
									passwordSaving={passwordSaving}
									handlePasswordUpdate={handlePasswordUpdate}
									activeProfile={activeProfile}
								/>
							</div>

							{/* Danger zone */}
							<h2 className="text-base font-bold text-base-content mt-8">
								Danger Zone
							</h2>
							<div className="mt-2 divide-y divide-base-200 rounded-xl border border-base-200 overflow-hidden">
								<div className="flex items-center justify-between px-4 py-3.5 gap-4">
									<div>
										<p className="text-sm font-medium text-base-content">
											Delete account
										</p>
										<p className="text-xs text-base-content/50">
											Permanently removes your profile and
											all account data
										</p>
									</div>
									<button
										type="button"
										className="btn btn-sm btn-error rounded-full px-4 font-semibold normal-case shrink-0"
										onClick={() =>
											setConfirmAction({
												kind: 'delete-account',
											})
										}
									>
										<Trash2 size={14} />
										Delete
									</button>
								</div>
							</div>
						</>
					)}

					{activeTab === 'sessions' && (
						<>
							<div className="flex items-center justify-between">
								<h2 className="text-base font-bold text-base-content">
									Active Sessions
								</h2>
								<button
									type="button"
									className="btn btn-ghost btn-xs"
									onClick={refreshSessions}
								>
									<RefreshCcw
										size={13}
										className={
											sessionsLoading
												? 'animate-spin'
												: ''
										}
									/>
									Refresh
								</button>
							</div>

							<div className="space-y-2 mt-3">
								{sessionsLoading ? (
									<div className="inline-flex items-center gap-2 text-sm text-base-content/60">
										<Loader2
											size={14}
											className="animate-spin"
										/>
										Loading sessions...
									</div>
								) : sessions.length === 0 ? (
									<p className="text-sm text-base-content/60">
										No active sessions found.
									</p>
								) : (
									sessions.map((session) => (
										<div
											key={session.sessionId}
											className="rounded-xl border border-base-200 p-3 flex items-center justify-between gap-3"
										>
											<div>
												<p className="text-sm font-medium">
													{session.browser ||
														'Unknown browser'}{' '}
													·{' '}
													{session.os || 'Unknown OS'}
												</p>
												<p className="text-xs text-base-content/60 mt-1">
													IP:{' '}
													{session.ipAddress || 'N/A'}
												</p>
												<p className="text-xs text-base-content/50 mt-1 inline-flex items-center gap-1">
													<Calendar size={11} />
													Expires{' '}
													{new Date(
														session.expiresAt
													).toLocaleString()}
												</p>
											</div>

											<div className="flex items-center gap-2">
												{session.isCurrent ? (
													<span className="badge badge-outline badge-success">
														Current
													</span>
												) : null}
												<button
													type="button"
													className="btn btn-xs btn-outline"
													onClick={() => {
														if (session.isCurrent) {
															setConfirmAction({
																kind: 'logout',
															});
															return;
														}
														setConfirmAction({
															kind: 'end-session',
															sessionId:
																session.sessionId,
														});
													}}
													disabled={
														endingSessionId ===
															session.sessionId ||
														(session.isCurrent &&
															actionLoading ===
																'logout')
													}
												>
													<LogOut size={12} />
													{session.isCurrent
														? 'Logout'
														: 'End'}
												</button>
											</div>
										</div>
									))
								)}
							</div>

							<div className="mt-5 pt-4 border-t border-base-200 flex flex-wrap gap-2">
								<button
									type="button"
									className="btn btn-sm btn-outline"
									onClick={() =>
										setConfirmAction({ kind: 'logout' })
									}
									disabled={
										actionLoading === 'logout' || endingAll
									}
								>
									<LogOut size={14} />
									{actionLoading === 'logout'
										? 'Logging out...'
										: 'Logout'}
								</button>
								<button
									type="button"
									className="btn btn-sm btn-outline btn-error"
									onClick={() =>
										setConfirmAction({ kind: 'logout-all' })
									}
									disabled={
										endingAll || actionLoading === 'logout'
									}
								>
									<Users size={14} />
									{endingAll
										? 'Signing out all...'
										: 'Logout all sessions'}
								</button>
								{isAdmin && (
									<button
										type="button"
										className="btn btn-sm btn-ghost"
										onClick={refreshNow}
										disabled={
											actionLoading === 'refresh' ||
											actionLoading === 'logout'
										}
									>
										<RefreshCcw
											size={14}
											className={
												actionLoading === 'refresh'
													? 'animate-spin'
													: ''
											}
										/>
										{actionLoading === 'refresh'
											? 'Refreshing...'
											: 'Auth refresh'}
									</button>
								)}
							</div>
						</>
					)}
					{/* admin tab */}
					{activeTab === 'admin' && isAdmin && (
						<div className="space-y-4">
							<div className="flex items-center gap-3 my-4">
								<div>
									<h2 className="text-base font-bold text-base-content">
										Admin Controls
									</h2>
									<p className="text-sm text-base-content/60 mt-1">
										Create a local account with role,
										profile details, and initial status.
									</p>
								</div>
								<button
									type="button"
									className="btn btn-neutral btn-sm ml-auto"
									onClick={() => setCreateUserModalOpen(true)}
								>
									Create user
								</button>
							</div>

							<div className="divider" />

							<div className="">
								<div className="flex items-start gap-3">
									<div className="min-w-0 flex-1">
										<h2 className="text-base font-bold text-base-content">
											Admin Tools
										</h2>
										<p className="mt-1 max-w-2xl text-sm text-base-content/60">
											Open internal dashboards and test
											utilities for inspection,
											verification, and route stress
											checks.
										</p>
									</div>
								</div>

								<div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
									<AdminToolsCard
										type="Tools"
										title="Lab"
										desc="Route stress test and mock data."
										icon={Zap}
										link="/lab"
									/>
									<AdminToolsCard
										type="Metrics"
										title="Prometheus"
										desc="View application metrics data."
										icon={ChartNoAxesColumn}
										link="/api/admin/prometheus"
									/>
									<AdminToolsCard
										type="Dashboard"
										title="Grafana"
										desc="View application metrics dashboards."
										icon={LayoutDashboard}
										link="/api/admin/grafana"
									/>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			<EditUserDialog
				open={editModalOpen}
				title="Edit Profile"
				draft={editDraft}
				showAvatarUpload={true}
				saving={profileSaving}
				error={profileEditError}
        validationMessage={editValidationMessage}
        submitDisabled={!editValidation.success}
				avatarFileName={pendingAvatarFile?.name ?? null}
				onChange={(next) =>
					setEditDraft((prev) => ({ ...prev, ...next }))
				}
				onAvatarFileChange={setPendingAvatarFile}
				onClose={() => setEditModalOpen(false)}
				onSubmit={handleSaveOwnProfile}
			/>

			<ConfirmActionDialog
				open={Boolean(confirmAction)}
				title={confirmConfig.title}
				message={confirmConfig.message}
				confirmLabel={confirmConfig.confirmLabel}
				tone={confirmConfig.tone}
				loading={confirmLoading || profileDeleting}
				onClose={() => setConfirmAction(null)}
				onConfirm={runConfirmedAction}
			/>

			<CreateUserDialog
				open={createUserModalOpen}
				onClose={() => setCreateUserModalOpen(false)}
				onSubmit={handleAdminCreateUser}
				draft={{
					...newUserForm,
					role: newUserForm.role ?? 'STUDENT',
					isBanned: newUserForm.isBanned ?? false, // ensure boolean
				}}
				onChange={updateNewUserForm}
				loading={adminLoading}
				error={createUserDialogError}
        validationMessage={createUserDisplayMessage}
			/>
		</div>
	);
}
