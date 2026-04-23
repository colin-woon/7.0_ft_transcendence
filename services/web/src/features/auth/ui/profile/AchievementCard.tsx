import type { AchievementInfo } from "@/features/auth/utils/intraDataParser";

export default function AchievementCard({ achievements }: { achievements?: AchievementInfo[] }) {
  if (!achievements || achievements.length === 0) {
    return (
      <p className="text-sm text-base-content/50">No achievements available.</p>
    );
  }

  return (
    <div className="card bg-base-100 shadow-md rounded-xl p-4 flex flex-col md:flex-row items-center gap-5">
      <div className="w-full">
        <h2 className="text-lg font-bold mb-3 text-slate-900">Achievements</h2>
        <div className="max-h-64 overflow-y-auto pr-1 space-y-2 w-full">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className="card card-side bg-white shadow-none border border-base-300"
            >
              <figure className="pl-4 py-3 shrink-0">
                {achievement.image ? (
                  <img
                    src={`https://api.intra.42.fr${achievement.image}`}
                    alt={achievement.name}
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center text-base-content/30 text-lg">
                    ?
                  </div>
                )}
              </figure>

              <div className="card-body p-3 gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-base-content leading-tight">
                    {achievement.name}
                  </span>
                </div>
                {achievement.description && (
                  <p className="text-xs text-base-content/60 leading-snug">
                    {achievement.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}