import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { Trophy } from "lucide-react";

const achievements = [
  { icon: "🔥", name: "First Flame", desc: "100 day streak" },
  { icon: "⭐", name: "Rising Star", desc: "1k followers" },
  { icon: "🛠️", name: "Builder", desc: "10 projects shipped" },
  { icon: "💬", name: "Orator", desc: "500 comments" },
  { icon: "🏆", name: "Top Contributor", desc: "Weekly #1" },
  { icon: "🎯", name: "Sharpshooter", desc: "50 accepted answers" },
];

const ProfileAchievements = () => {
  return (
    <Card className="border-base-300 bg-base-100">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-lg flex items-center gap-2">
          <Trophy className="h-4 w-4 text-accent" /> Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {achievements.map((a) => (
            <div key={a.name} className="flex flex-col items-center text-center p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer">
              <span className="text-2xl mb-1">{a.icon}</span>
              <span className="font-heading text-[11px] font-medium leading-tight text-base-content">{a.name}</span>
              <span className="text-base-content/50 text-[10px] mt-0.5">{a.desc}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileAchievements;
