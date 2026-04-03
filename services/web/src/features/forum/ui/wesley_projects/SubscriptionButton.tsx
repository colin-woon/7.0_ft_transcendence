'use client';

import { useEffect, useState } from 'react';
import {
  getProjectSubscriptionStatus,
  subscribeToProject,
  unsubscribeFromProject,
} from '../../api/subcription';

interface SubscriptionButtonProps {
  projectId: number;
}

export default function SubscriptionButton({ projectId }: SubscriptionButtonProps) {
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
        console.error('Failed to load subscription status:', error);
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
    } catch (error) {
      console.error('Failed to toggle subscription:', error);
      alert('Unable to update subscription right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (subscribed === null) {
    return (
      <button
        type="button"
        disabled
        className="rounded-full bg-slate-300 px-4 py-2 text-sm font-semibold text-white opacity-70"
      >
        Loading...
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggleSubscription}
      disabled={isSubmitting}
      className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-70 ${
        subscribed
          ? 'bg-red-600 hover:bg-red-700'
          : 'bg-emerald-600 hover:bg-emerald-700'
      }`}
    >
      {isSubmitting ? 'Saving...' : subscribed ? 'Unsubscribe' : 'Subscribe'}
    </button>
  );
}
