/**
 * Utility functions to extract and parse 42 (Intra) student data
 *
 * 42 API returns complex nested JSONB structures. This module provides
 * helper functions to safely extract commonly-used fields.
 *
 * IMPORTANT NOTE ON 42 DATA STORAGE:
 * ──────────────────────────────────
 * Currently, 42 data is stored as JSONB arrays of raw objects from the 42 API.
 * This is flexible but unstructured. For production, consider storing:
 *
 * 1. BETTER APPROACH - Normalize into separate tables:
 *    - cursus table: user_cursus_id, cursus_name, level, grade, blackholed_at
 *    - projects table: project_id, name, status, score, validated_at
 *    - achievements table: achievement_id, name, description, tier, earned_at
 *    - languages table: language_name, level
 *    - This allows querying, filtering, and calculating stats efficiently
 *
 * 2. INTERMEDIATE - Use composite JSONB columns:
 *    - PRIMARY cursus_data: Only the active cursus (42cursus, cursus_bootstrap, etc.)
 *    - archived_cursus: Old cursus for reference
 *    - Currently storing everything makes queries complex
 *
 * 3. CURRENT - Keep JSONB but add computed columns:
 *    - Add materialized views or computed columns for common queries
 *    - Level, ranking, achievements count, etc.
 *    - Reduces need to parse JSONB on every request
 */

import type { IntraInfo } from '@/features/auth/api/authService'

// ── Type Guards & Conversions ──────────────────────────────────────────────

/**
 * Safely convert any value to a number, defaulting to fallback if invalid
 */
function toNumber(value: any, fallback: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return !isNaN(parsed) ? parsed : fallback
  }
  return fallback
}

/**
 * Safely convert any value to a boolean
 */
function toBoolean(value: any, fallback: boolean = false): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.toLowerCase() === 'true'
  return fallback
}

// ── Cursus / Level Extraction ──────────────────────────────────────────────

export interface CursusInfo {
  id: number
  name: string
  level: number
  grade: string | null
  blackholedAt: string | null
  progressPercentage: number
}

/**
 * Extract the user's level from cursus_users array
 * Finds the active 42cursus and returns the level
 */
export function extractLevel(intraInfo: IntraInfo | null | undefined): number {
  if (!intraInfo?.cursusUsers || !Array.isArray(intraInfo.cursusUsers)) {
    return 0
  }

  // Find "42cursus" entry (the main cursus)
  const mainCursus = intraInfo.cursusUsers.find(
    (c: any) => c.cursus?.name === '42cursus'
  )

  return toNumber(mainCursus?.level, 0)
}

/**
 * Extract progression percentage within current level
 */
export function extractLevelProgress(intraInfo: IntraInfo | null | undefined): number {
  if (!intraInfo?.cursusUsers || !Array.isArray(intraInfo.cursusUsers)) {
    return 0
  }

  const mainCursus = intraInfo.cursusUsers.find(
    (c: any) => c.cursus?.name === '42cursus'
  )

  if (!mainCursus) return 0

  // Grade is stored as percentage string like "50.5%"
  const grade = mainCursus.grade ?? '0'
  const parsed = parseFloat(String(grade).replace('%', ''))
  return isNaN(parsed) ? 0 : Math.round(parsed)
}

/**
 * Extract all cursus progression
 */
export function extractCursusInfo(intraInfo: IntraInfo | null | undefined): CursusInfo[] {
  if (!intraInfo?.cursusUsers || !Array.isArray(intraInfo.cursusUsers)) {
    return []
  }

  return intraInfo.cursusUsers
    .map((cursusUser: any) => {
      const cursus = cursusUser.cursus ?? {}
      const grade = cursusUser.grade ?? '0'
      const progress = parseFloat(String(grade).replace('%', ''))

      return {
        id: cursusUser.cursus_id ?? 0,
        name: cursus.name ?? 'Unknown',
        level: cursusUser.level ?? 0,
        grade: cursusUser.grade,
        blackholedAt: cursusUser.blackholed_at,
        progressPercentage: isNaN(progress) ? 0 : progress,
      }
    })
    .sort((a, b) => b.level - a.level)
}

// ── Projects Extraction ────────────────────────────────────────────────────

export interface ProjectInfo {
  id: number
  name: string
  status: 'finished' | 'in_progress' | 'failed' | 'waiting'
  score: number | null
  validated: boolean
  markedAt: string | null
  finalMark: number | null
}

/**
 * Extract completed projects count
 */
export function extractCompletedProjectsCount(intraInfo: IntraInfo | null | undefined): number {
  if (!intraInfo?.projectsUsers || !Array.isArray(intraInfo.projectsUsers)) {
    return 0
  }

  const count = intraInfo.projectsUsers.filter(
    (p: any) => p.status === 'finished' || p.validated === true
  ).length
  
  return typeof count === 'number' ? count : 0
}

/**
 * Extract all projects with details
 */
export function extractProjects(intraInfo: IntraInfo | null | undefined): ProjectInfo[] {
  if (!intraInfo?.projectsUsers || !Array.isArray(intraInfo.projectsUsers)) {
    return []
  }

  return intraInfo.projectsUsers.map((projectUser: any) => ({
    id: projectUser.id ?? projectUser.project?.id ?? 0,
    name: projectUser.project?.name ?? projectUser.name ?? 'Unknown',
    status: projectUser.status ?? 'waiting',
    score: projectUser.final_mark ?? projectUser.score ?? null,
    validated: projectUser.validated ?? false,
    markedAt: projectUser.marked_at,
    finalMark: projectUser.final_mark ?? null,
  }))
}

// ── Achievements & Titles Extraction ───────────────────────────────────────

export interface AchievementInfo {
  id: number
  name: string
  description: string
  achievementTier: string | null
}

/**
 * Extract achievements
 */
export function extractAchievements(intraInfo: IntraInfo | null | undefined): AchievementInfo[] {
  if (!intraInfo?.achievements || !Array.isArray(intraInfo.achievements)) {
    return []
  }

  return (intraInfo.achievements as any[]).map((ach: any) => ({
    id: ach.id ?? 0,
    name: ach.name ?? 'Unknown',
    description: ach.description ?? '',
    achievementTier: ach.achievement_tier?.name ?? null,
  }))
}

/**
 * Extract titles count
 */
export function extractTitlesCount(intraInfo: IntraInfo | null | undefined): number {
  if (!intraInfo?.titles || !Array.isArray(intraInfo.titles)) {
    return 0
  }
  return intraInfo.titles.length
}

// ── Skills & Expertise Extraction ──────────────────────────────────────────

export interface SkillInfo {
  id: number
  name: string
  level: number
}

/**
 * Extract user skills
 */
export function extractSkills(intraInfo: IntraInfo | null | undefined): SkillInfo[] {
  if (!intraInfo?.expertisesUsers || !Array.isArray(intraInfo.expertisesUsers)) {
    return []
  }

  return (intraInfo.expertisesUsers as any[])
    .map((skill: any) => ({
      id: skill.id ?? 0,
      name: skill.expertise?.name ?? skill.name ?? 'Unknown',
      level: skill.level ?? 0,
    }))
    .sort((a, b) => b.level - a.level)
    .slice(0, 5) // Top 5 skills
}

// ── Campus & Groups Extraction ─────────────────────────────────────────────

export interface GroupInfo {
  id: number
  name: string
}

/**
 * Extract campus information
 */
export function extractCampus(intraInfo: IntraInfo | null | undefined): GroupInfo | null {
  if (!intraInfo?.campusUsers || !Array.isArray(intraInfo.campusUsers)) {
    return null
  }

  const campus = (intraInfo.campusUsers as any[])[0]
  if (!campus?.campus) return null

  return {
    id: campus.campus.id ?? 0,
    name: campus.campus.name ?? 'Unknown',
  }
}

/**
 * Extract study groups
 */
export function extractGroups(intraInfo: IntraInfo | null | undefined): GroupInfo[] {
  if (!intraInfo?.groups || !Array.isArray(intraInfo.groups)) {
    return []
  }

  return (intraInfo.groups as any[]).map((group: any) => ({
    id: group.id ?? 0,
    name: group.name ?? 'Unknown',
  }))
}

// ── Languages Extraction ───────────────────────────────────────────────────

/**
 * Extract languages known by user
 */
export function extractLanguages(intraInfo: IntraInfo | null | undefined): string[] {
  if (!intraInfo?.languagesUsers || !Array.isArray(intraInfo.languagesUsers)) {
    return []
  }

  return (intraInfo.languagesUsers as any[])
    .map((lang: any) => lang.language?.name ?? lang.name)
    .filter((name): name is string => !!name)
}

// ── Family / Connections Extraction ────────────────────────────────────────

export interface RelationInfo {
  id: number
  login: string
  name: string
}

/**
 * Extract patroning (godparent)
 */
export function extractPatroning(intraInfo: IntraInfo | null | undefined): RelationInfo | null {
  if (!intraInfo?.patroning || !Array.isArray(intraInfo.patroning)) {
    return null
  }

  const godparent = (intraInfo.patroning as any[])[0]
  if (!godparent?.godparent) return null

  return {
    id: godparent.godparent.id ?? 0,
    login: godparent.godparent.login ?? 'Unknown',
    name: godparent.godparent.first_name ?? 'Unknown',
  }
}

/**
 * Extract patroned (godchildren)
 */
export function extractPatroned(intraInfo: IntraInfo | null | undefined): RelationInfo[] {
  if (!intraInfo?.patroned || !Array.isArray(intraInfo.patroned)) {
    return []
  }

  return (intraInfo.patroned as any[])
    .map((relation: any) => ({
      id: relation.godchild?.id ?? 0,
      login: relation.godchild?.login ?? 'Unknown',
      name: relation.godchild?.first_name ?? 'Unknown',
    }))
    .slice(0, 5) // Limit to 5
}

// ── Summary Statistics ─────────────────────────────────────────────────────

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

/**
 * Get a quick summary of important 42 user stats
 */
export function extractIntraSummary(
  intraInfo: IntraInfo | null | undefined,
): IntraSummary {
  const completedProjects = extractCompletedProjectsCount(intraInfo)
  const allProjects = extractProjects(intraInfo)
  const cursusInfo = extractCursusInfo(intraInfo)

  return {
    level: extractLevel(intraInfo),
    levelProgress: extractLevelProgress(intraInfo),
    activeCursus: cursusInfo[0]?.name ?? 'Unknown',
    location: intraInfo?.location ? String(intraInfo.location) : null,
    campus: extractCampus(intraInfo),
    completedProjects: toNumber(completedProjects, completedProjects),
    totalProjects: toNumber(allProjects.length, allProjects.length),
    correctionPoints: toNumber(intraInfo?.correctionPoints, 0),
    wallet: toNumber(intraInfo?.wallet, 0),
    isAlumni: toBoolean(intraInfo?.isAlumni, false),
    isActive: toBoolean(intraInfo?.isActive, false),
    phone: intraInfo?.phone ? String(intraInfo.phone) : null,
  }
}
