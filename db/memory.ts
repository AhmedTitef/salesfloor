// In-memory storage for local development (no DB required)
import { randomUUID } from 'crypto'

interface Team { id: string; name: string; pin: string; plainPin: string; dailyGoal: number; webhookUrl: string | null; playbook: PlaybookItem[]; workStartHour: number; workEndHour: number; orgId: string | null; createdAt: Date }
interface User { id: string; teamId: string; name: string; email: string | null; role: 'rep' | 'manager'; personalGoal: number | null; createdAt: Date }
interface ActivityType { id: string; teamId: string; name: string; color: string; icon: string; sortOrder: number; isActive: boolean }
interface ActivityLog { id: string; userId: string; teamId: string; activityTypeId: string; notes: string | null; outcome: 'won' | 'lost' | 'pending' | null; contactName: string | null; createdAt: Date }
interface Challenge { id: string; teamId: string; name: string; endsAt: Date; createdAt: Date }
interface Broadcast { id: string; teamId: string; message: string; createdAt: Date; expiresAt: Date }
interface PlaybookItem { activityTypeName: string; target: number }
interface AuditEntry { id: string; teamId: string; userId: string; userName: string; action: string; detail: string; createdAt: Date }
interface Organization { id: string; name: string; inviteCode: string; createdAt: Date }
interface OrgMember { id: string; orgId: string; userId: string; role: 'org_admin' | 'org_viewer'; createdAt: Date }
interface League { id: string; orgId: string; name: string; startsAt: Date; endsAt: Date; scoringMode: 'total' | 'per_rep_avg'; isActive: boolean; createdAt: Date }
interface LeagueTeam { id: string; leagueId: string; teamId: string }

// Use globalThis to share data across all module instances (RSC, API routes, server actions)
const g = globalThis as typeof globalThis & {
  __sf_teams?: Team[]
  __sf_users?: User[]
  __sf_activityTypes?: ActivityType[]
  __sf_activityLogs?: ActivityLog[]
  __sf_challenges?: Challenge[]
  __sf_broadcasts?: Broadcast[]
  __sf_audit?: AuditEntry[]
  __sf_orgs?: Organization[]
  __sf_orgMembers?: OrgMember[]
  __sf_leagues?: League[]
  __sf_leagueTeams?: LeagueTeam[]
}
g.__sf_teams ??= []
g.__sf_users ??= []
g.__sf_activityTypes ??= []
g.__sf_activityLogs ??= []
g.__sf_challenges ??= []
g.__sf_broadcasts ??= []
g.__sf_audit ??= []
g.__sf_orgs ??= []
g.__sf_orgMembers ??= []
g.__sf_leagues ??= []
g.__sf_leagueTeams ??= []

const teams = g.__sf_teams
const users = g.__sf_users
const activityTypes = g.__sf_activityTypes
const activityLogs = g.__sf_activityLogs
const challenges = g.__sf_challenges
const broadcasts = g.__sf_broadcasts
const auditLog = g.__sf_audit
const orgs = g.__sf_orgs
const orgMembers = g.__sf_orgMembers
const leaguesList = g.__sf_leagues
const leagueTeamsList = g.__sf_leagueTeams

export const memoryDb = {
  teams, users, activityTypes, activityLogs,

  // Team operations
  createTeam(data: { name: string; pin: string; plainPin: string }): Team {
    const team: Team = { id: randomUUID(), ...data, dailyGoal: 50, webhookUrl: null, playbook: [], workStartHour: 8, workEndHour: 17, orgId: null, createdAt: new Date() }
    teams.push(team)
    return team
  },

  updateTeam(id: string, data: Partial<Pick<Team, 'name' | 'dailyGoal' | 'webhookUrl' | 'playbook' | 'workStartHour' | 'workEndHour'>>): Team | undefined {
    const team = teams.find(t => t.id === id)
    if (!team) return undefined
    Object.assign(team, data)
    return team
  },

  findTeamById(id: string): Team | undefined {
    return teams.find(t => t.id === id)
  },

  getAllTeams(): Team[] {
    return teams
  },

  // User operations
  createUser(data: { teamId: string; name: string; email?: string | null; role: 'rep' | 'manager' }): User {
    const user: User = { id: randomUUID(), ...data, email: data.email ?? null, personalGoal: null, createdAt: new Date() }
    users.push(user)
    return user
  },

  updateUser(id: string, data: Partial<Pick<User, 'personalGoal'>>): User | undefined {
    const user = users.find(u => u.id === id)
    if (!user) return undefined
    Object.assign(user, data)
    return user
  },

  findUserById(id: string): User | undefined {
    return users.find(u => u.id === id)
  },

  getUsersByTeam(teamId: string): User[] {
    return users.filter(u => u.teamId === teamId)
  },

  // Activity type operations
  createActivityType(data: { teamId: string; name: string; color: string; icon: string; sortOrder: number }): ActivityType {
    const at: ActivityType = { id: randomUUID(), ...data, isActive: true }
    activityTypes.push(at)
    return at
  },

  getActivityTypesByTeam(teamId: string): ActivityType[] {
    return activityTypes.filter(at => at.teamId === teamId).sort((a, b) => a.sortOrder - b.sortOrder)
  },

  findActivityTypeById(id: string): ActivityType | undefined {
    return activityTypes.find(at => at.id === id)
  },

  updateActivityType(id: string, data: Partial<Pick<ActivityType, 'name' | 'color' | 'icon' | 'isActive' | 'sortOrder'>>): ActivityType | undefined {
    const at = activityTypes.find(a => a.id === id)
    if (!at) return undefined
    Object.assign(at, data)
    return at
  },

  // Activity log operations
  createActivityLog(data: { userId: string; teamId: string; activityTypeId: string; notes?: string | null; contactName?: string | null }): ActivityLog {
    const log: ActivityLog = { id: randomUUID(), ...data, notes: data.notes ?? null, outcome: null, contactName: data.contactName ?? null, createdAt: new Date() }
    activityLogs.push(log)
    return log
  },

  updateActivityLog(id: string, userId: string, data: { outcome?: 'won' | 'lost' | 'pending' | null; notes?: string | null; contactName?: string | null }): ActivityLog | undefined {
    const log = activityLogs.find(l => l.id === id && l.userId === userId)
    if (!log) return undefined
    Object.assign(log, data)
    return log
  },

  deleteActivityLog(id: string, userId: string): boolean {
    const idx = activityLogs.findIndex(l => l.id === id && l.userId === userId)
    if (idx === -1) return false
    activityLogs.splice(idx, 1)
    return true
  },

  getActivityLogs(teamId: string, opts?: { start?: Date; end?: Date; limit?: number }): Array<ActivityLog & { userName: string; activityTypeName: string; activityTypeColor: string; activityTypeIcon: string }> {
    let logs = activityLogs.filter(l => l.teamId === teamId)
    if (opts?.start) logs = logs.filter(l => l.createdAt >= opts.start!)
    if (opts?.end) logs = logs.filter(l => l.createdAt <= opts.end!)
    logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    if (opts?.limit) logs = logs.slice(0, opts.limit)

    return logs.map(l => {
      const user = users.find(u => u.id === l.userId)
      const at = activityTypes.find(a => a.id === l.activityTypeId)
      return {
        ...l,
        userName: user?.name ?? 'Unknown',
        activityTypeName: at?.name ?? 'Unknown',
        activityTypeColor: at?.color ?? '#888',
        activityTypeIcon: at?.icon ?? 'star',
      }
    })
  },

  // Stats
  getStats(teamId: string, start: Date, end: Date) {
    const logs = activityLogs.filter(l => l.teamId === teamId && l.createdAt >= start && l.createdAt <= end)
    const teamUsers = users.filter(u => u.teamId === teamId)
    const teamTypes = activityTypes.filter(at => at.teamId === teamId)

    // Team totals by type
    const teamStats: Record<string, number> = {}
    for (const at of teamTypes) {
      teamStats[at.name] = logs.filter(l => l.activityTypeId === at.id).length
    }

    // Per-rep stats (exclude managers from leaderboard)
    const reps = teamUsers.filter(u => u.role === 'rep')
    const repStats = reps.map(u => {
      const userLogs = logs.filter(l => l.userId === u.id)
      const counts: Record<string, number> = {}
      for (const at of teamTypes) {
        counts[at.name] = userLogs.filter(l => l.activityTypeId === at.id).length
      }
      return { name: u.name, counts, total: userLogs.length }
    })

    // Leaderboard
    const leaderboard = repStats
      .map(r => ({ name: r.name, total: r.total }))
      .sort((a, b) => b.total - a.total)

    return { teamStats, repStats, leaderboard }
  },

  // Streak: consecutive days (including today) with at least 1 log
  getUserStreak(userId: string, teamId: string): number {
    const userLogs = activityLogs.filter(l => l.userId === userId && l.teamId === teamId)
    if (userLogs.length === 0) return 0

    // Get unique days with activity (as YYYY-MM-DD strings)
    const days = new Set(userLogs.map(l => {
      const d = new Date(l.createdAt)
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    }))

    let streak = 0
    const now = new Date()
    const check = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    while (true) {
      const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`
      if (days.has(key)) {
        streak++
        check.setDate(check.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  },

  // Personal best: max activities in a single day
  getUserPersonalBest(userId: string, teamId: string): { best: number; isNewBest: boolean } {
    const userLogs = activityLogs.filter(l => l.userId === userId && l.teamId === teamId)
    if (userLogs.length === 0) return { best: 0, isNewBest: false }

    // Group by day
    const byDay: Record<string, number> = {}
    for (const l of userLogs) {
      const d = new Date(l.createdAt)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      byDay[key] = (byDay[key] || 0) + 1
    }

    const now = new Date()
    const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
    const todayCount = byDay[todayKey] || 0

    // Best across all days
    const allBest = Math.max(...Object.values(byDay))

    // Best excluding today
    const prevBest = Math.max(0, ...Object.entries(byDay)
      .filter(([k]) => k !== todayKey)
      .map(([, v]) => v))

    return { best: allBest, isNewBest: todayCount > 0 && todayCount > prevBest && prevBest > 0 }
  },

  // Challenges
  createChallenge(data: { teamId: string; name: string; durationMinutes: number }): Challenge {
    const c: Challenge = {
      id: randomUUID(),
      teamId: data.teamId,
      name: data.name,
      endsAt: new Date(Date.now() + data.durationMinutes * 60 * 1000),
      createdAt: new Date(),
    }
    challenges.push(c)
    return c
  },

  getActiveChallenge(teamId: string): Challenge | undefined {
    return challenges.find(c => c.teamId === teamId && c.endsAt > new Date())
  },

  getChallengeLeaderboard(teamId: string, challengeId: string) {
    const challenge = challenges.find(c => c.id === challengeId)
    if (!challenge) return []
    const logs = activityLogs.filter(l => l.teamId === teamId && l.createdAt >= challenge.createdAt && l.createdAt <= challenge.endsAt)
    const counts: Record<string, { name: string; total: number }> = {}
    for (const l of logs) {
      const user = users.find(u => u.id === l.userId)
      if (!user || user.role === 'manager') continue
      if (!counts[l.userId]) counts[l.userId] = { name: user.name, total: 0 }
      counts[l.userId].total++
    }
    return Object.values(counts).sort((a, b) => b.total - a.total)
  },

  // Broadcasts
  createBroadcast(data: { teamId: string; message: string; durationMinutes?: number }): Broadcast {
    const b: Broadcast = {
      id: randomUUID(),
      teamId: data.teamId,
      message: data.message,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (data.durationMinutes || 60) * 60 * 1000),
    }
    broadcasts.push(b)
    return b
  },

  getActiveBroadcast(teamId: string): Broadcast | undefined {
    return broadcasts.find(b => b.teamId === teamId && b.expiresAt > new Date())
  },

  // All-time activity count for a user
  getUserAllTimeCount(userId: string, teamId: string): number {
    return activityLogs.filter(l => l.userId === userId && l.teamId === teamId).length
  },

  // Contact history — group activities by contact name
  getContactHistory(userId: string, teamId: string): Array<{ contactName: string; activities: number; lastActivity: Date; types: Record<string, number> }> {
    const logs = activityLogs.filter(l => l.userId === userId && l.teamId === teamId && l.contactName)
    const contacts: Record<string, { activities: number; lastActivity: Date; types: Record<string, number> }> = {}
    for (const l of logs) {
      const name = l.contactName!
      if (!contacts[name]) contacts[name] = { activities: 0, lastActivity: l.createdAt, types: {} }
      contacts[name].activities++
      if (l.createdAt > contacts[name].lastActivity) contacts[name].lastActivity = l.createdAt
      const at = activityTypes.find(a => a.id === l.activityTypeId)
      if (at) contacts[name].types[at.name] = (contacts[name].types[at.name] || 0) + 1
    }
    return Object.entries(contacts)
      .map(([name, data]) => ({ contactName: name, ...data }))
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
  },

  // Activity heatmap data: daily counts for a user
  getUserHeatmap(userId: string, teamId: string, days: number = 84): Record<string, number> {
    const result: Record<string, number> = {}
    const userLogs = activityLogs.filter(l => l.userId === userId && l.teamId === teamId)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    for (const l of userLogs) {
      if (l.createdAt < cutoff) continue
      const key = l.createdAt.toISOString().split('T')[0]
      result[key] = (result[key] || 0) + 1
    }
    return result
  },

  // Weekly MVP
  getWeeklyMVP(teamId: string): { name: string; total: number } | null {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() - 7)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const logs = activityLogs.filter(l => l.teamId === teamId && l.createdAt >= weekStart && l.createdAt < weekEnd)
    const counts: Record<string, { name: string; total: number }> = {}
    for (const l of logs) {
      const user = users.find(u => u.id === l.userId)
      if (!user || user.role === 'manager') continue
      if (!counts[l.userId]) counts[l.userId] = { name: user.name, total: 0 }
      counts[l.userId].total++
    }
    const sorted = Object.values(counts).sort((a, b) => b.total - a.total)
    return sorted[0] || null
  },

  // Team records
  getTeamRecords(teamId: string): { bestDay: { date: string; count: number } | null; bestRep: { name: string; date: string; count: number } | null } {
    const logs = activityLogs.filter(l => l.teamId === teamId)
    if (logs.length === 0) return { bestDay: null, bestRep: null }

    // Best team day
    const byDay: Record<string, number> = {}
    for (const l of logs) {
      const key = l.createdAt.toISOString().split('T')[0]
      byDay[key] = (byDay[key] || 0) + 1
    }
    const bestDayEntry = Object.entries(byDay).sort(([, a], [, b]) => b - a)[0]
    const bestDay = bestDayEntry ? { date: bestDayEntry[0], count: bestDayEntry[1] } : null

    // Best individual day
    const byUserDay: Record<string, { name: string; date: string; count: number }> = {}
    for (const l of logs) {
      const user = users.find(u => u.id === l.userId)
      if (!user) continue
      const key = `${l.userId}:${l.createdAt.toISOString().split('T')[0]}`
      if (!byUserDay[key]) byUserDay[key] = { name: user.name, date: l.createdAt.toISOString().split('T')[0], count: 0 }
      byUserDay[key].count++
    }
    const bestRepEntry = Object.values(byUserDay).sort((a, b) => b.count - a.count)[0]
    const bestRep = bestRepEntry || null

    return { bestDay, bestRep }
  },

  // Audit log
  addAuditEntry(data: { teamId: string; userId: string; userName: string; action: string; detail: string }) {
    const entry: AuditEntry = { id: randomUUID(), ...data, createdAt: new Date() }
    auditLog.push(entry)
    return entry
  },

  getAuditLog(teamId: string, limit: number = 50): AuditEntry[] {
    return auditLog
      .filter(e => e.teamId === teamId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  },

  // ========== Organizations ==========

  createOrg(data: { name: string }): Organization {
    const org: Organization = { id: randomUUID(), name: data.name, inviteCode: randomUUID().slice(0, 8), createdAt: new Date() }
    orgs.push(org)
    return org
  },

  findOrgById(id: string): Organization | undefined {
    return orgs.find(o => o.id === id)
  },

  findOrgByInviteCode(code: string): Organization | undefined {
    return orgs.find(o => o.inviteCode === code)
  },

  getOrgTeams(orgId: string): Team[] {
    return teams.filter(t => t.orgId === orgId)
  },

  addTeamToOrg(teamId: string, orgId: string): Team | undefined {
    const team = teams.find(t => t.id === teamId)
    if (!team) return undefined
    team.orgId = orgId
    return team
  },

  removeTeamFromOrg(teamId: string): Team | undefined {
    const team = teams.find(t => t.id === teamId)
    if (!team) return undefined
    team.orgId = null
    return team
  },

  createOrgMember(data: { orgId: string; userId: string; role: 'org_admin' | 'org_viewer' }): OrgMember {
    const m: OrgMember = { id: randomUUID(), ...data, createdAt: new Date() }
    orgMembers.push(m)
    return m
  },

  getOrgMembers(orgId: string): OrgMember[] {
    return orgMembers.filter(m => m.orgId === orgId)
  },

  isOrgAdmin(userId: string, orgId: string): boolean {
    return orgMembers.some(m => m.orgId === orgId && m.userId === userId && m.role === 'org_admin')
  },

  getOrgForUser(userId: string): { org: Organization; role: string } | null {
    const membership = orgMembers.find(m => m.userId === userId)
    if (!membership) return null
    const org = orgs.find(o => o.id === membership.orgId)
    if (!org) return null
    return { org, role: membership.role }
  },

  getOrgStats(orgId: string, start: Date, end: Date) {
    const orgTeams = teams.filter(t => t.orgId === orgId)
    const teamIds = new Set(orgTeams.map(t => t.id))
    const logs = activityLogs.filter(l => teamIds.has(l.teamId) && l.createdAt >= start && l.createdAt <= end)

    // Per-team breakdown
    const perTeam = orgTeams.map(t => {
      const teamLogs = logs.filter(l => l.teamId === t.id)
      return { teamId: t.id, teamName: t.name, total: teamLogs.length }
    }).sort((a, b) => b.total - a.total)

    // Cross-team individual leaderboard
    const repCounts: Record<string, { name: string; teamName: string; total: number }> = {}
    for (const l of logs) {
      const user = users.find(u => u.id === l.userId)
      if (!user || user.role === 'manager') continue
      const team = orgTeams.find(t => t.id === l.teamId)
      if (!repCounts[l.userId]) repCounts[l.userId] = { name: user.name, teamName: team?.name || '', total: 0 }
      repCounts[l.userId].total++
    }
    const topReps = Object.values(repCounts).sort((a, b) => b.total - a.total).slice(0, 10)

    return { perTeam, topReps, totalActivities: logs.length, teamCount: orgTeams.length }
  },

  // ========== Leagues ==========

  createLeague(data: { orgId: string; name: string; startsAt: Date; endsAt: Date; scoringMode: 'total' | 'per_rep_avg' }): League {
    const league: League = { id: randomUUID(), ...data, isActive: true, createdAt: new Date() }
    leaguesList.push(league)
    return league
  },

  findLeagueById(id: string): League | undefined {
    return leaguesList.find(l => l.id === id)
  },

  getLeaguesByOrg(orgId: string): League[] {
    return leaguesList.filter(l => l.orgId === orgId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  },

  getActiveLeaguesForTeam(teamId: string): League[] {
    const now = new Date()
    const teamLeagueIds = leagueTeamsList.filter(lt => lt.teamId === teamId).map(lt => lt.leagueId)
    return leaguesList.filter(l => teamLeagueIds.includes(l.id) && l.isActive && l.endsAt > now)
  },

  addTeamToLeague(leagueId: string, teamId: string): LeagueTeam {
    const lt: LeagueTeam = { id: randomUUID(), leagueId, teamId }
    leagueTeamsList.push(lt)
    return lt
  },

  removeTeamFromLeague(leagueId: string, teamId: string): boolean {
    const idx = leagueTeamsList.findIndex(lt => lt.leagueId === leagueId && lt.teamId === teamId)
    if (idx === -1) return false
    leagueTeamsList.splice(idx, 1)
    return true
  },

  getLeagueTeams(leagueId: string): Team[] {
    const teamIds = leagueTeamsList.filter(lt => lt.leagueId === leagueId).map(lt => lt.teamId)
    return teams.filter(t => teamIds.includes(t.id))
  },

  getLeagueStandings(leagueId: string): Array<{ teamId: string; teamName: string; score: number; totalActivities: number; repCount: number; rank: number }> {
    const league = leaguesList.find(l => l.id === leagueId)
    if (!league) return []

    const leagueTeamIds = leagueTeamsList.filter(lt => lt.leagueId === leagueId).map(lt => lt.teamId)
    const standings = leagueTeamIds.map(teamId => {
      const team = teams.find(t => t.id === teamId)
      const totalActivities = activityLogs.filter(l => l.teamId === teamId && l.createdAt >= league.startsAt && l.createdAt <= league.endsAt).length
      const repCount = users.filter(u => u.teamId === teamId && u.role === 'rep').length
      const score = league.scoringMode === 'per_rep_avg' && repCount > 0
        ? Math.round((totalActivities / repCount) * 10) / 10
        : totalActivities
      return { teamId, teamName: team?.name || 'Unknown', score, totalActivities, repCount, rank: 0 }
    })

    standings.sort((a, b) => b.score - a.score)
    standings.forEach((s, i) => { s.rank = i + 1 })
    return standings
  },
}
