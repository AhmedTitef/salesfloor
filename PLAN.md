# SalesFloor Improvement Plan

## Phase 1: Quick Wins (Now → 2 weeks) ✅ COMPLETE
- [x] PWA manifest + "Add to Home Screen" prompt
- [x] Undo last log (5-second toast)
- [x] Pace indicator on /log ("X more per hour to hit goal")
- [x] Sound/haptic feedback on activity tap
- [x] QR code join (alternative to PIN typing)
- [x] "Hot Streak" mode (visual glow after 5 activities in 10 minutes)
- [x] Larger tap targets (56x56 min) + bottom-zone activity buttons
- [x] Empty states + first-time onboarding tooltips
- [x] Rate limiting on /api/team/join (PIN brute-force protection)
- [x] Remove dual logging endpoints (pick one)
- [x] In-memory mode warning banner

## Phase 2: Core v1.1 (Weeks 3-6) ✅ COMPLETE
- [x] Offline queue (localStorage/IndexedDB + background sync)
- [x] Outcome tagging (Won/Lost/Pending on activities)
- [x] Streak badges (bronze 5d, silver 10d, gold 30d) on leaderboard
- [x] Daily recap page/card (auto-generated at EOD)
- [x] SSE live leaderboard updates
- [x] Rep coaching view (manager clicks rep → breakdown, trends, consistency)
- [x] Data export (CSV with filters)
- [x] Optional user identity (email/phone for account recovery)
- [x] Session rotation (daily token refresh)
- [x] DB indexes on activityLogs (teamId+createdAt, userId+createdAt)
- [x] Optimistic UI updates on log tap

## Phase 3: Growth Features (Weeks 7-12) ✅ COMPLETE
- [x] Team challenges (time-boxed sprints set by manager)
- [ ] Scheduled reports (daily/weekly email/PDF to manager) — skipped, needs email infra
- [x] TV dashboard mode (/tv route with live SSE feed)
- [x] Activity heatmap (GitHub-style contribution grid)
- [x] Individual rep goals (not just team-wide)
- [x] Webhook/Zapier integration
- [ ] Weekly recap push/email — skipped, needs email infra
- [x] Weekly MVP auto-award
- [x] Week-over-week comparison arrows
- [x] Manager broadcast (banner messages on /log)
- [x] Audit log (who logged what, edit/delete tracking)
- [x] Dark mode — already default (dark class on html)
- [x] Pull-to-refresh
- [x] Rep-to-rep head-to-head comparison view

## Phase 4: Vision Features (Quarter 2) ✅ COMPLETE
- [x] AI Activity Coach (rule-based insights: best days, peak hours, slowdowns, mix analysis, streaks, conversion)
- [x] CRM-Lite (contactName on logs, /contacts page with per-contact history)
- [x] Multi-team orgs (organizations table, org_admin role, org dashboard, org settings, add teams by PIN)
- [x] Inter-team leagues (create leagues, team enrollment, standings with total/per-rep-avg scoring, dashboard widget)
- [x] Manager playbook ("perfect day" template + checklist on /log)
- [x] Embeddable leaderboard widget (/embed/leaderboard?team=ID)
- [x] Rank tiers (Rookie → Starter → Grinder → Closer → Crusher → Legend)
- [x] Personal + team records wall (on /recap page)
- [x] Variable reward surprises (milestones at 10, 25, 50, 100, 500, 1000)
- [x] Real-time activity feed (SSE via LiveUpdates component)
- [ ] Voice notes — deferred (needs speech API + transcription backend)
- [x] Configurable work hours (workStartHour/workEndHour on team, dynamic pace indicator)

## Principles
- Always test while building
- Preserve single-tap logging simplicity
- Mobile-first (reps are in the field)
- Keep PIN-based zero-friction onboarding
- Optimistic UI everywhere — taps must feel instant
