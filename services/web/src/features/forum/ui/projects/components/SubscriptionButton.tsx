"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff } from "lucide-react";
import {
  getProjectSubscriptionStatus,
  subscribeToProject,
  unsubscribeFromProject,
} from "../../../api/subcription";

interface SubscriptionButtonProps {
  projectId: number;
  compact?: boolean;
  className?: string;
}

export default function SubscriptionButton({
  projectId,
  compact = false,
  className = "",
}: SubscriptionButtonProps) {
  const router = useRouter();
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadStatus = async () => {
      try {
        const status = await getProjectSubscriptionStatus(projectId);
        if (isMounted) {
          setSubscribed(status.subscribed);
        }
      } catch (error) {
        console.error("Failed to load subscription status:", error);
        if (isMounted) {
          setSubscribed(false);
        }
      }
    };

    loadStatus();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const handleToggleSubscription = async () => {
    if (subscribed === null || isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (subscribed) {
        await unsubscribeFromProject(projectId);
        setSubscribed(false);
      } else {
        await subscribeToProject(projectId);
        setSubscribed(true);
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to toggle subscription:", error);
      alert("Unable to update subscription right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (subscribed === null) {
    const loadingClasses = compact
      ? "inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-300 text-white opacity-70"
      : "rounded-full bg-slate-300 px-4 py-2 text-sm font-semibold text-white opacity-70";

    return (
      <button
        type="button"
        disabled
        className={`${loadingClasses} ${className}`.trim()}
        aria-label="Loading subscription status"
      >
        {compact ? <Bell className="h-4 w-4" /> : "Loading..."}
      </button>
    );
  }

  const defaultClasses = compact
    ? "inline-flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors disabled:opacity-70"
    : "text-sm font-medium px-4 py-2 rounded-lg w-full text-white transition-colors disabled:opacity-70";

  const stateClasses = subscribed
    ? "bg-red-600 hover:bg-red-700"
    : "bg-emerald-600 hover:bg-emerald-700";

  const buttonLabel = isSubmitting
    ? "Saving..."
    : subscribed
      ? "Unsubscribe"
      : "Subscribe";

  return (
    <button
      type="button"
      onClick={handleToggleSubscription}
      disabled={isSubmitting}
      aria-label={buttonLabel}
      title={buttonLabel}
      className={`${defaultClasses} ${stateClasses} ${className}`.trim()}
    >
      {compact ? (
        subscribed ? (
          <BellOff className="h-4 w-4" />
        ) : (
          <Bell className="h-4 w-4" />
        )
      ) : (
        buttonLabel
      )}
    </button>
  );
}
