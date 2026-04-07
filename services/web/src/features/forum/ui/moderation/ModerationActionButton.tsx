'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ModerationActionVariant = 'neutral' | 'danger';

interface ModerationActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  variant?: ModerationActionVariant;
}

export default function ModerationActionButton({
  icon,
  label,
  variant = 'neutral',
  className,
  ...buttonProps
}: ModerationActionButtonProps) {
  const baseClassName =
    variant === 'danger'
      ? 'inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50'
      : 'inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={className ? `${baseClassName} ${className}` : baseClassName}
      {...buttonProps}
    >
      {icon}
    </button>
  );
}
