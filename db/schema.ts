import { pgTable, uuid, text, timestamp, integer, boolean, index } from 'drizzle-orm/pg-core'

// Organizations (optional layer above teams)
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  inviteCode: text('invite_code').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const orgMembers = pgTable('org_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: text('role', { enum: ['org_admin', 'org_viewer'] }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  pin: text('pin').notNull(),
  orgId: uuid('org_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id).notNull(),
  name: text('name').notNull(),
  email: text('email'),
  role: text('role', { enum: ['rep', 'manager'] }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const activityTypes = pgTable('activity_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id).notNull(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  icon: text('icon').notNull(),
  sortOrder: integer('sort_order').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
})

export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  teamId: uuid('team_id').references(() => teams.id).notNull(),
  activityTypeId: uuid('activity_type_id').references(() => activityTypes.id).notNull(),
  notes: text('notes'),
  outcome: text('outcome', { enum: ['won', 'lost', 'pending'] }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_activity_logs_team_created').on(table.teamId, table.createdAt),
  index('idx_activity_logs_user_created').on(table.userId, table.createdAt),
])

// Leagues (inter-team competition within an org)
export const leagues = pgTable('leagues', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  scoringMode: text('scoring_mode', { enum: ['total', 'per_rep_avg'] }).default('total').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const leagueTeams = pgTable('league_teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  leagueId: uuid('league_id').references(() => leagues.id).notNull(),
  teamId: uuid('team_id').references(() => teams.id).notNull(),
})
