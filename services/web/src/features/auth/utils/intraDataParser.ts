import type { IntraInfo } from '@/features/auth/api/authService'

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.toLowerCase() === 'true'
  return fallback
}

export interface CursusInfo {
  id: number
  name: string
  level: number
  grade: string | null
  blackholedAt: string | null
  progressPercentage: number
}

export function extractLevel(intraInfo: IntraInfo | null | undefined): number {
  if (!intraInfo?.cursusUsers || !Array.isArray(intraInfo.cursusUsers)) return 0
  const mainCursus = intraInfo.cursusUsers.find((c: any) => c.cursus?.name === '42cursus')
  return toNumber((mainCursus as any)?.level, 0)
}

export function extractLevelProgress(intraInfo: IntraInfo | null | undefined): number {
  if (!intraInfo?.cursusUsers || !Array.isArray(intraInfo.cursusUsers)) return 0
  const mainCursus = intraInfo.cursusUsers.find((c: any) => c.cursus?.name === '42cursus') as any
  if (!mainCursus) return 0

  const rawGrade = mainCursus.grade ?? '0'
  const parsed = Number.parseFloat(String(rawGrade).replace('%', ''))
  return Number.isFinite(parsed) ? Math.round(parsed) : 0
}

export function extractCursusInfo(intraInfo: IntraInfo | null | undefined): CursusInfo[] {
  if (!intraInfo?.cursusUsers || !Array.isArray(intraInfo.cursusUsers)) return []

  return intraInfo.cursusUsers
    .map((cursusUser: any) => {
      const cursus = cursusUser.cursus ?? {}
      const progress = Number.parseFloat(String(cursusUser.grade ?? '0').replace('%', ''))

      return {
        id: cursusUser.cursus_id ?? 0,
        name: cursus.name ?? 'Unknown',
        level: toNumber(cursusUser.level, 0),
        grade: cursusUser.grade ?? null,
        blackholedAt: cursusUser.blackholed_at ?? null,
        progressPercentage: Number.isFinite(progress) ? progress : 0,
      }
    })
    .sort((a, b) => b.level - a.level)
}

export interface ProjectInfo {
  id: number
  name: string
  status: 'finished' | 'in_progress' | 'failed' | 'waiting'
  score: number | null
  validated: boolean
  markedAt: string | null
  finalMark: number | null
}

export function extractCompletedProjectsCount(intraInfo: IntraInfo | null | undefined): number {
  if (!intraInfo?.projectsUsers || !Array.isArray(intraInfo.projectsUsers)) return 0
  return intraInfo.projectsUsers.filter((p: any) => p.status === 'finished' || p.validated === true).length
}

export function extractProjects(intraInfo: IntraInfo | null | undefined): ProjectInfo[] {
  if (!intraInfo?.projectsUsers || !Array.isArray(intraInfo.projectsUsers)) return []

  return intraInfo.projectsUsers.map((projectUser: any) => ({
    id: projectUser.id ?? projectUser.project?.id ?? 0,
    name: projectUser.project?.name ?? projectUser.name ?? 'Unknown',
    status: projectUser.status ?? 'waiting',
    score: projectUser.final_mark ?? projectUser.score ?? null,
    validated: projectUser.validated ?? false,
    markedAt: projectUser.marked_at ?? null,
    finalMark: projectUser.final_mark ?? null,
  }))
}

export interface AchievementInfo {
  id: number
  name: string
  description: string
  achievementTier: string | null
}

export function extractAchievements(intraInfo: IntraInfo | null | undefined): AchievementInfo[] {
  if (!intraInfo?.achievements || !Array.isArray(intraInfo.achievements)) return []

  return intraInfo.achievements.map((ach: any) => ({
    id: ach.id ?? 0,
    name: ach.name ?? 'Unknown',
    description: ach.description ?? '',
    achievementTier: ach.achievement_tier?.name ?? null,
  }))
}

export interface SkillInfo {
  id: number
  name: string
  level: number
}

export function extractSkills(intraInfo: IntraInfo | null | undefined): SkillInfo[] {
  if (!intraInfo?.expertisesUsers || !Array.isArray(intraInfo.expertisesUsers)) return []

  return intraInfo.expertisesUsers
    .map((skill: any) => ({
      id: skill.id ?? 0,
      name: skill.expertise?.name ?? skill.name ?? 'Unknown',
      level: toNumber(skill.level, 0),
    }))
    .sort((a, b) => b.level - a.level)
    .slice(0, 5)
}

export interface GroupInfo {
  id: number
  name: string
}

export function extractCampus(intraInfo: IntraInfo | null | undefined): GroupInfo | null {
  if (!intraInfo?.campusUsers || !Array.isArray(intraInfo.campusUsers)) return null
  const campus = intraInfo.campusUsers[0] as any
  if (!campus?.campus) return null

  return {
    id: campus.campus.id ?? 0,
    name: campus.campus.name ?? 'Unknown',
  }
}

export interface IntraSummary {
  level: number
  levelProgress: number
  activeCursus: string
  location: string | null
  campus: GroupInfo | null
  completedProjects: number
  totalProjects: number
  correctionPoints: number
  wallet: number
  isAlumni: boolean
  isActive: boolean
  phone: string | null
}

export function extractIntraSummary(intraInfo: IntraInfo | null | undefined): IntraSummary {
  const completedProjects = extractCompletedProjectsCount(intraInfo)
  const allProjects = extractProjects(intraInfo)
  const cursusInfo = extractCursusInfo(intraInfo)

  return {
    level: extractLevel(intraInfo),
    levelProgress: extractLevelProgress(intraInfo),
    activeCursus: cursusInfo[0]?.name ?? 'Unknown',
    location: intraInfo?.location ? String(intraInfo.location) : null,
    campus: extractCampus(intraInfo),
    completedProjects,
    totalProjects: allProjects.length,
    correctionPoints: toNumber(intraInfo?.correctionPoints, 0),
    wallet: toNumber(intraInfo?.wallet, 0),
    isAlumni: toBoolean(intraInfo?.isAlumni, false),
    isActive: toBoolean(intraInfo?.isActive, false),
    phone: intraInfo?.phone ? String(intraInfo.phone) : null,
  }
}
