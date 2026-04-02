import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { Folder, Star, GitFork } from "lucide-react";

const projects = [
  { name: "NeuralCanvas", desc: "AI-powered generative art tool", stars: 342, forks: 28, tag: "Active" },
  { name: "DevPulse", desc: "Real-time developer analytics", stars: 128, forks: 12, tag: "Active" },
  { name: "SynthWave CLI", desc: "Terminal-based music synthesizer", stars: 89, forks: 5, tag: "Archived" },
];

const ProfileProjects = () => {
  return (
    <Card className="border-base-300 bg-base-100">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-lg flex items-center gap-2">
          <Folder className="h-4 w-4 text-primary" /> Current Projects
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {projects.map((p) => (
          <div key={p.name} className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer border border-transparent hover:border-base-300">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-heading font-medium text-sm text-base-content">{p.name}</h3>
                <p className="text-base-content/50 text-xs mt-0.5">{p.desc}</p>
              </div>
              <span className={`badge ${p.tag === "Active" ? "badge-primary" : "badge-secondary"} text-[10px] font-heading`}>
                {p.tag}
              </span>
            </div>
            <div className="flex gap-3 mt-2 text-xs text-base-content/50">
              <span className="flex items-center gap-1"><Star className="h-3 w-3" />{p.stars}</span>
              <span className="flex items-center gap-1"><GitFork className="h-3 w-3" />{p.forks}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ProfileProjects;
