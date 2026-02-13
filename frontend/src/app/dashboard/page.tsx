"use client"

import { Monitor, Star, Coins } from "lucide-react"
import { Sidebar, TopBar } from "@/components/dashboard/sidebar"
import { ProfileCard } from "@/components/dashboard/profile-card"
import { MilestoneCard } from "@/components/dashboard/milestone-card"
import { HoursChart } from "@/components/dashboard/hours-chart"
import { ContactCard } from "@/components/dashboard/contact-card"
import { MilestoneTimeline } from "@/components/dashboard/milestone-timeline"
import { LogtimeHeatmap } from "@/components/dashboard/logtime-heatmap"
import { AchievementsCard } from "@/components/dashboard/achievements-card"
import { ProjectsCard } from "@/components/dashboard/projects-card"
import { AgendaCard } from "@/components/dashboard/agenda-card"
import { EvaluationsCard } from "@/components/dashboard/evaluations-card"

// Mock data
const userData = {
  name: "Ryan Teoh",
  username: "rteoh",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  level: 8,
  levelProgress: 58,
  cursus: "Cadet at 42cursus",
  coalitionPoints: 140,
  rank: 13,
  score: 1300,
  evaluationPoints: 6,
  available: false,
}

const milestoneData = {
  pace: 22,
  deadline: "09/02/2026",
  daysElapsed: 23,
  daysTotal: 36,
}

const hoursData = [
  { week: "W-4", hours: 12 },
  { week: "W-3", hours: 28 },
  { week: "W-2", hours: 35 },
  { week: "W-1", hours: 18 },
  { week: "Last week", hours: 42 },
]

const contactData = {
  phone: "01128250651",
  email: "rteoh@student.42kl.edu.my",
  location: "Kuala Lumpur",
  date: "23/01/2029",
}

const milestones = [
  { id: 1, name: "Milestone 1", completed: true, months: ["Oct", "Nov", "Dec"] },
  { id: 2, name: "Milestone 2", completed: true, months: ["Jan", "Feb", "Mar"] },
  { id: 3, name: "Milestone 3", completed: true, months: ["Apr", "May", "Jun"] },
  { id: 4, name: "Milestone 4", completed: true, months: ["Jul", "Aug", "Sep"] },
  { id: 5, name: "Milestone 5", completed: true, months: ["Oct", "Nov", "Dec"] },
  { id: 6, name: "Milestone 6", completed: false, months: ["Jan", "Feb"] },
]

const logtimeData = [
  {
    month: "Oct",
    year: 2025,
    days: [
      { day: 6, active: true, intensity: 0.5 },
      { day: 7, active: true, intensity: 0.8 },
      { day: 8, active: true, intensity: 0.6 },
      { day: 10, active: true, intensity: 1 },
      { day: 11, active: true, intensity: 0.4 },
      { day: 13, active: true, intensity: 0.7 },
      { day: 14, active: true, intensity: 0.9 },
      { day: 20, active: true, intensity: 0.5 },
      { day: 21, active: true, intensity: 0.8 },
      { day: 22, active: true, intensity: 1 },
      { day: 24, active: true, intensity: 0.6 },
      { day: 25, active: true, intensity: 0.7 },
      { day: 28, active: true, intensity: 0.5 },
      { day: 30, active: true, intensity: 1 },
      { day: 31, active: true, intensity: 0.4 },
    ],
  },
  {
    month: "Nov",
    year: 2025,
    days: [
      { day: 3, active: true, intensity: 0.8 },
      { day: 4, active: true, intensity: 0.6 },
      { day: 7, active: true, intensity: 0.9 },
      { day: 10, active: true, intensity: 0.5 },
      { day: 11, active: true, intensity: 0.7 },
      { day: 12, active: true, intensity: 0.8 },
      { day: 14, active: true, intensity: 1 },
      { day: 18, active: true, intensity: 0.6 },
      { day: 23, active: true, intensity: 0.5 },
    ],
  },
  {
    month: "Dec",
    year: 2025,
    days: [
      { day: 4, active: true, intensity: 1 },
    ],
  },
  {
    month: "Jan",
    year: 2026,
    days: [
      { day: 1, active: true, intensity: 0.7 },
      { day: 3, active: true, intensity: 1 },
      { day: 4, active: true, intensity: 0.8 },
      { day: 11, active: true, intensity: 0.6 },
    ],
  },
]

const achievements = [
  {
    id: "1",
    name: "Code Explorer",
    description: "Validated 21 projects.",
    icon: Monitor,
    color: "#a78bfa",
  },
  {
    id: "2",
    name: "Bonus Hunter",
    description: "Validated 10 projects with the maximum score.",
    icon: Star,
    color: "#a78bfa",
  },
  {
    id: "3",
    name: "It's a rich man's world",
    description: "Collected 100 wallet points.",
    icon: Coins,
    color: "#fbbf24",
  },
]

const projects = [
  {
    id: "1",
    name: "Python for Data Science",
    status: "in-progress" as const,
    children: [
      { id: "1-1", name: "Python - 0 - Starting", status: "completed" as const, score: 100 },
      { id: "1-2", name: "Python - 1 - Array", status: "completed" as const, score: 100 },
      { id: "1-3", name: "Python - 2 - DataTable", status: "completed" as const, score: 100 },
      { id: "1-4", name: "Python - 3 - OOP", status: "in-progress" as const },
      { id: "1-5", name: "Python - 4 - Dod", status: "in-progress" as const },
    ],
  },
  {
    id: "2",
    name: "ft_transcendence",
    status: "completed" as const,
    score: 100,
  },
  {
    id: "3",
    name: "ft_irc",
    status: "completed" as const,
    score: 125,
  },
  {
    id: "4",
    name: "webserv",
    status: "completed" as const,
    score: 110,
  },
]

const events = [
  {
    id: "1",
    title: "Rush - Piscine Object",
    date: "Feb 1, 2026",
    time: "09:00",
    location: "42KL Campus",
    type: "rush" as const,
  },
]

const evaluations = [
  {
    id: "1",
    project: "Python - 3 - OOP",
    date: "Jan 28, 2026",
    time: "14:00",
    type: "corrector" as const,
  },
]

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar username={userData.username} avatar={userData.avatar} />

      <main className="ml-16 pt-14">
        <div className="p-6">
          {/* Top row - Profile, Milestone, Hours, Contact */}
          <div className="mb-6 grid gap-6 lg:grid-cols-4">
            <ProfileCard {...userData} />
            <MilestoneCard {...milestoneData} />
            <HoursChart data={hoursData} />
            <ContactCard {...contactData} />
          </div>

          {/* Timeline */}
          <div className="mb-6">
            <MilestoneTimeline
              milestones={milestones}
              currentMilestone={5}
              eta="09/02/2026"
            />
          </div>

          {/* Middle row - Logtime and Achievements */}
          <div className="mb-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <LogtimeHeatmap data={logtimeData} />
            </div>
            <AchievementsCard achievements={achievements} />
          </div>

          {/* Bottom row - Projects, Agenda, Evaluations */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ProjectsCard projects={projects} />
            <div className="space-y-6">
              <AgendaCard events={events} />
              <EvaluationsCard evaluations={evaluations} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
