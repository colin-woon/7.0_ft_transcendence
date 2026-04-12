'use client';

import Link from 'next/link';

interface ForumTrailItem {
  label: string;
  href?: string;
}

interface ForumTrailButtonsProps {
  items: ForumTrailItem[];
  className?: string;
}

export default function ForumTrailButtons({ items, className }: ForumTrailButtonsProps) {
  return (
    <nav aria-label="Forum breadcrumb" className={className}>
      <div className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          const baseClasses =
            'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide uppercase transition-colors';

          return (
            <div key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isCurrent ? (
                <Link
                  href={item.href}
                  className={`${baseClasses} border border-teal-200 bg-white text-teal-700 hover:border-teal-300 hover:bg-teal-50`}
                >
                  {(item.label).slice(0, 20) + "..."}
                </Link>
              ) : (
                <span
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`${baseClasses} border border-slate-200 bg-slate-100 text-slate-600`}
                >
                  {(item.label).slice(0, 20) + "..."}
                </span>
              )}

              {index < items.length - 1 && <span className="text-xs text-slate-400">&gt;</span>}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
