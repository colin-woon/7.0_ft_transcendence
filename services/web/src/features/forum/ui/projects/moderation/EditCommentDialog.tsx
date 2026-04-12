'use client';

import { useEffect, useState } from 'react';

interface EditCommentDialogProps {
  isOpen: boolean;
  initialContent: string;
  isSubmitting?: boolean;
  error?: string | null;
  onCancel: () => void;
  onSubmit: (payload: { content: string }) => Promise<void> | void;
}

export default function EditCommentDialog({
  isOpen,
  initialContent,
  isSubmitting = false,
  error = null,
  onCancel,
  onSubmit,
}: EditCommentDialogProps) {
  const [content, setContent] = useState(initialContent);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setLocalError(null);
    }
  }, [isOpen, initialContent]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setLocalError('Comment content is required.');
      return;
    }

    await onSubmit({ content: trimmedContent });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold text-slate-900">Edit comment</h3>
        <p className="mt-1 text-sm text-slate-600">Update comment text.</p>

        <div className="mt-4 grid gap-3">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={5}
            placeholder="Comment content"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/70"
          />
          {(localError || error) && (
            <p className="text-sm text-red-600">{localError ?? error}</p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-md bg-[#0f6f6b] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0c5d5a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
