'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createForumProject } from '@/features/forum/api/moderation';
import AdminVisibilityGate from './AdminVisibilityGate';

function toSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function AdminProjectCreateButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [objectivesInput, setObjectivesInput] = useState('');
  const [solo, setSolo] = useState(true);
  const [estimateTime, setEstimateTime] = useState('');
  const [xp, setXp] = useState('0');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setSlug('');
    setObjectivesInput('');
    setSolo(true);
    setEstimateTime('');
    setXp('0');
    setDescription('');
    setError(null);
  };

  const handleCreate = async () => {
    const projectName = name.trim();
    const projectSlug = (slug.trim() || toSlug(projectName)).trim();
    const objectives = objectivesInput
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!projectName || !projectSlug) {
      setError('Project name and slug are required.');
      return;
    }

    const parsedXp = Number.parseInt(xp.trim() || '0', 10);
    if (Number.isNaN(parsedXp) || parsedXp < 0) {
      setError('XP must be a non-negative integer.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createForumProject({
        name: projectName,
        slug: projectSlug,
        objectives: objectives.length > 0 ? objectives : undefined,
        solo,
        estimate_time: estimateTime.trim() || undefined,
        xp: parsedXp,
        description: description.trim() || undefined,
      });
      setIsOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminVisibilityGate>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-[#0f6f6b] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0c5d5a]"
      >
        <Plus size={14} />
        Create project
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">Create project</h3>
            <p className="mt-1 text-sm text-slate-600">Create a new forum project category for posts.</p>

            <div className="mt-4 grid gap-3">
              <input
                value={name}
                onChange={(event) => {
                  const nextName = event.target.value;
                  setName(nextName);
                  if (!slug.trim()) {
                    setSlug(toSlug(nextName));
                  }
                }}
                placeholder="Project name"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/70"
              />
              <input
                value={slug}
                onChange={(event) => setSlug(toSlug(event.target.value))}
                placeholder="project-slug"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/70"
              />
              <textarea
                value={objectivesInput}
                onChange={(event) => setObjectivesInput(event.target.value)}
                placeholder="Objectives (comma or newline separated)"
                rows={3}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/70"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select
                  value={solo ? 'solo' : 'group'}
                  onChange={(event) => setSolo(event.target.value === 'solo')}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/70"
                >
                  <option value="solo">Solo</option>
                  <option value="group">Group</option>
                </select>
              </div>
              <input
                value={estimateTime}
                onChange={(event) => setEstimateTime(event.target.value)}
                placeholder="Estimate time (e.g. 2 weeks)"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/70"
              />
              <input
                type="number"
                min={0}
                value={xp}
                onChange={(event) => setXp(event.target.value)}
                placeholder="XP (e.g. 462)"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/70"
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Description (optional)"
                rows={4}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/70"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  reset();
                }}
                disabled={isSubmitting}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={isSubmitting}
                className="rounded-md bg-[#0f6f6b] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0c5d5a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminVisibilityGate>
  );
}
