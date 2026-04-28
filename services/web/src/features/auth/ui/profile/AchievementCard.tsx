import type { AchievementInfo } from "@/features/auth/utils/intraDataParser";
import { Trophy } from "lucide-react";

function AchievementIcon() {
  return (
    <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center border border-inherit">
      <Trophy className="w-5 h-5 text-yellow-400" />
    </div>
  );
}

export default function AchievementCard({ achievements }: { achievements?: AchievementInfo[] }) {
  const hasData = achievements && achievements.length > 0;

  return (
    <div className="card bg-base-100 shadow-md rounded-xl p-4 flex flex-col md:flex-row items-center gap-5">
      <div className="w-full">
        <h2 className="text-lg font-bold text-slate-900">Achievements</h2>
        
        {hasData && (
          <div className="max-h-64 overflow-y-auto pr-1 space-y-2 w-full mt-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center bg-white border border-base-300 rounded-md p-2 gap-3"
              >
                <figure className="shrink-0 drop-shadow-sm">
                  {achievement.image ? (
                    <img
                      src={`https://cdn.intra.42.fr${achievement.image}`}
                      alt={achievement.name}
                      className="w-10 h-10 object-contain border border-inherit rounded-md pr-1"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <div className={achievement.image ? "hidden" : ""}>
                    <AchievementIcon />
                  </div>
                </figure>
                <div className="flex flex-col p-1 gap-0.5">
                  <span className="text-sm font-semibold text-base-content leading-tight">
                    {achievement.name}
                  </span>
                  {achievement.description && (
                    <p className="text-xs text-base-content/60 leading-snug">
                      {achievement.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}