// ProfilePage.tsx
// Stack: React + Tailwind + DaisyUI
// Font: Sora + Space Mono — add to your index.html or globals.css:
//   @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Sora:wght@300;400;500;600&display=swap');
// Then in tailwind.config: fontFamily: { sora: ['Sora','sans-serif'], mono: ['Space Mono','monospace'] }

import { CheckIcon } from "lucide-react";
import ProfileHeader from "./ProfileHeader";
import Achievements from "./Achievements";
import Bio from "./Bio";
import Projects from "./Projects";
import TopPosts from "./TopPosts";
import Awards from "./Awards";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Project {
  name: string;
  pct: number;
  color: string;
}

interface Achievement {
  icon: string;
  name: string;
  sub: string;
}

interface TimelineNode {
  label: string;
  sublabel: string;
  status: "done" | "now" | "next";
}

interface Post {
  title: string;
  upvotes: number;
  comments: number;
}

interface Award {
  icon: string;
  name: string;
  from: string;
  bg: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const projects: Project[] = [
  { name: "ft_printf",     pct: 68, color: "#1D9E75" },
  { name: "Born2beroot",   pct: 92, color: "#378ADD" },
  { name: "get_next_line", pct: 41, color: "#EF9F27" },
];

const achievements: Achievement[] = [
  { icon: "🔥", name: "30-day streak",  sub: "Every day logged"   },
  { icon: "🛠",  name: "First push",     sub: "Project submitted"  },
  { icon: "⭐", name: "Top 10%",        sub: "This month"         },
];

const timeline: TimelineNode[] = [
  { label: "libft",        sublabel: "validated",   status: "done" },
  { label: "get_next_line",sublabel: "validated",   status: "done" },
  { label: "Born2beroot",  sublabel: "validated",   status: "done" },
  { label: "ft_printf",    sublabel: "in progress", status: "now"  },
  { label: "push_swap",    sublabel: "upcoming",    status: "next" },
  { label: "minishell",    sublabel: "upcoming",    status: "next" },
];

const posts: Post[] = [
  { title: "Why ft_printf nearly broke me",       upvotes: 342, comments: 28 },
  { title: "Born2beroot setup guide",             upvotes: 215, comments: 14 },
  { title: "Norminette tips that saved my grade", upvotes: 189, comments:  9 },
];

const awards: Award[] = [
  { icon: "🏅", name: "Peer Award",   from: "from xXl33tXx",    bg: "#EEEDFE" },
  { icon: "🌟", name: "Top Helper",   from: "Community vote",   bg: "#FAEEDA" },
  { icon: "🚀", name: "Fast Learner", from: "Staff pick",       bg: "#E1F5EE" },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-base-content/40 mb-3">
      {children}
    </p>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-base-100 border border-base-300 rounded-[14px] p-4 ${className}`}>
      {children}
    </div>
  );
}

// ─── Timeline node ───────────────────────────────────────────────────────────

function TLNode({ node }: { node: TimelineNode }) {
  const isDone = node.status === "done";
  const isNow  = node.status === "now";

  const ringClass = isDone
    ? "bg-[#085041] border-[#085041]"
    : isNow
    ? "bg-base-100 border-2 border-[#0F6E56]"
    : "bg-base-200 border border-base-300";

  return (
    <div className="flex flex-col items-center gap-[7px] w-[72px]">
      <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 border ${ringClass}`}>
        {isDone && (
          <CheckIcon className="w-3 h-3 text-[#9FE1CB]" strokeWidth={2.2} />
        )}
        {isNow && (
          <span className="w-[10px] h-[10px] rounded-full bg-[#0F6E56] block" />
        )}
        {node.status === "next" && (
          <span className="w-[8px] h-[8px] rounded-full border border-base-content/20 block" />
        )}
      </div>
      <span
        className={`font-sora text-[10px] text-center leading-tight ${
          isDone ? "text-base-content/60" :
          isNow  ? "text-[#0F6E56] font-medium" :
                   "text-base-content/30"
        }`}
      >
        {node.label}
      </span>
      <span
        className={`font-mono text-[8px] text-center ${
          isNow ? "text-[#1D9E75]" : "text-base-content/30"
        }`}
      >
        {node.sublabel}
      </span>
    </div>
  );
}

function TLLine({ done }: { done: boolean }) {
  return (
    <div
      className="w-7 flex-shrink-0 mt-[14px] self-start"
      style={{ height: "1.5px", background: done ? "#085041" : "oklch(var(--bc)/0.1)" }}
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  return (
    <div className="min-h-screen h-screen flex flex-col bg-base-200 font-sora">
      <div className="flex flex-1 flex-col w-full h-full">
        <div className="flex flex-col gap-4 w-full px-4 py-8 overflow-y-auto items-center flex-1 mt-11">
          {/* ── Header ── */}
          <Card className="flex items-center gap-4 w-full max-w-4xl">
            <div className="relative flex-shrink-0">
              <div className="avatar">
                <div className="w-14 h-14 rounded-full ring-1 ring-base-300">
                  <img
                    src="https://img.daisyui.com/images/profile/demo/yellingcat@192.webp"
                    alt="avatar"
                  />
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-1.5 bg-[#085041] text-[#9FE1CB] font-mono text-[8px] font-bold px-1.5 py-0.5 rounded-[5px] border-2 border-base-100 tracking-[0.03em]">
                LVL 7
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-mono text-[13px] font-bold text-base-content">ItsHotCoCoa</p>
              <p className="text-[10px] text-base-content/40 font-light mt-0.5 tracking-[0.01em]">
                cadet &nbsp;·&nbsp; active 2h ago
              </p>
              <div className="flex gap-[18px] mt-2.5">
                {[
                  { v: "2.4k", l: "Followers" },
                  { v: "318",  l: "Following" },
                  { v: "156",  l: "Posts"     },
                  { v: "8.7k", l: "Karma"     },
                ].map((s) => (
                  <div key={s.l} className="flex flex-col gap-px">
                    <span className="font-mono text-[12px] font-bold text-base-content">{s.v}</span>
                    <span className="text-[9px] uppercase tracking-[0.08em] text-base-content/40">{s.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* ── Bio ── */}
          <Card className="flex items-center gap-3 w-full max-w-4xl">
            <Bio />
          </Card>

          {/* ── Projects + Achievements ── */}
          <div className="flex flex-row gap-4 w-full max-w-4xl flex-wrap md:flex-nowrap">
            <Card className="flex-1 min-w-[220px]">
              <SectionTitle>Current Projects</SectionTitle>
              <Projects projects={projects} />
            </Card>

            <Card className="flex-1 min-w-[180px]">
              <SectionTitle>Achievements</SectionTitle>
              <div className="flex flex-col divide-y divide-base-300">
                {achievements.map((a) => (
                  <div key={a.name} className="flex items-center gap-2.5 py-1.5 first:pt-0 last:pb-0">
                    <div className="w-6 h-6 rounded-[6px] bg-base-200 flex items-center justify-center flex-shrink-0 text-xs">
                      {a.icon}
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-base-content">{a.name}</p>
                      <p className="text-[9px] text-base-content/40 font-light mt-px">{a.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── Timeline ── */}
          <Card className="w-full max-w-4xl">
            <SectionTitle>Timeline</SectionTitle>
            <div className="overflow-x-auto scrollbar-none pb-1">
              <div className="flex items-start min-w-max">
                {timeline.map((node, i) => (
                  <div key={node.label} className="flex items-start">
                    <TLNode node={node} />
                    {i < timeline.length - 1 && (
                      <TLLine done={node.status === "done" && timeline[i + 1].status !== "next"} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* ── Top Posts + Awards ── */}
          <div className="flex flex-row gap-4 w-full max-w-4xl flex-wrap md:flex-nowrap">
            <Card className="flex-1 min-w-[180px]">
              <SectionTitle>Top Posts</SectionTitle>
              <TopPosts posts={posts} />
            </Card>

            <Card className="flex-1 min-w-[180px]">
              <SectionTitle>Awards</SectionTitle>
              <Awards awards={awards} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}