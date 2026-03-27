import type { ForumSort, ForumViewMode } from '../../../models';

interface PostListControlsProps {
  activeSort: ForumSort;
  onSortChange: (value: ForumSort) => void;
  sortOptions: readonly ForumSort[];
  viewMode: ForumViewMode;
  setViewMode: (value: ForumViewMode) => void;
  activeCategory: string;
  setActiveCategory: (value: string) => void;
  categories: readonly string[];
}

export default function PostListControls({
  activeSort,
  onSortChange,
  sortOptions,
  viewMode,
  setViewMode,
  activeCategory,
  setActiveCategory,
  categories,
}: PostListControlsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <span className="text-slate-500">Sort by</span>
          <select
            value={activeSort}
            onChange={(e) => onSortChange(e.target.value as ForumSort)}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60"
          >
            {sortOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">View</span>
          <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`px-3 py-1.5 text-sm transition ${
                viewMode === 'card'
                  ? 'bg-[#8EE7E3]/20 text-[#0f6f6b]'
                  : 'bg-white text-slate-700 hover:bg-gray-50'
              }`}
            >
              Card
            </button>
            <button
              type="button"
              onClick={() => setViewMode('compact')}
              className={`px-3 py-1.5 text-sm transition ${
                viewMode === 'compact'
                  ? 'bg-[#8EE7E3]/20 text-[#0f6f6b]'
                  : 'bg-white text-slate-700 hover:bg-gray-50'
              }`}
            >
              Compact
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              category === activeCategory
                ? 'bg-[#0f6f6b] text-white'
                : 'bg-gray-100 text-slate-700 hover:bg-[#8EE7E3]/30'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
