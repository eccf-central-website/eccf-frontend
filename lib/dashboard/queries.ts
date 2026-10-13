/**
 * GROQ queries — Exco Dashboard (protected reads only).
 *
 * Kept apart from lib/queries.ts so public pages never import these.
 * Run only from lib/dashboard/data after an RBAC check.
 *
 * ⚠️ PII: no projection here may select `phoneNumber` or `roomNumber`.
 * ⚠️ Naming: `team` — never `unit`. Worker.team is a teamUnit reference on
 *    the current backend branches and a plain string on older data, so it
 *    is always resolved with coalesce(team->name, team).
 */

// ---------------------------------------------------------------------------
// Worker CRM
// ---------------------------------------------------------------------------

/** $hall: null for all halls; $team: null for all teams */
export const DASHBOARD_WORKERS_QUERY = `
  *[_type == "worker" && ($hall == null || hall == $hall) && ($team == null || team->name == $team || team == $team || $team in teams[]->name || $team in teams)] | order(fullName asc) {
    _id,
    fullName,
    "team": coalesce(team->name, team),
    "teams": coalesce(teams[]->name, teams, [coalesce(team->name, team)]),
    hall,
    role,
    excoPosition,
    birthDate,
    profileImageUrl,
    createdAt,
    updatedAt,
    updateLog
  }
`

/** Hall of the signed-in worker — the JWT carries {id, role, team} only */
export const WORKER_HALL_BY_ID_QUERY = `
  *[_type == "worker" && _id == $id][0].hall
`

// ---------------------------------------------------------------------------
// Ledgers
// ---------------------------------------------------------------------------

export const DASHBOARD_ATTENDANCE_QUERY = `
  *[_type == "attendanceLedger" && ($team == null || team->name == $team || team == $team)] | order(date desc) {
    _id,
    date,
    serviceType,
    meetingTitle,
    "teamName": coalesce(team->name, team),
    totalCount,
    "attendeeCount": count(coalesce(attendees, [])),
    "attendees": attendees[]->{ _id, fullName, "team": coalesce(team->name, team), "teams": coalesce(teams[]->name, teams, [coalesce(team->name, team)]) },
    "loggedBy": loggedBy->{ _id, fullName, excoPosition, role }
  }
`

export const DASHBOARD_FINANCE_QUERY = `
  *[_type == "financeLedger"] | order(transactionDate desc) {
    _id,
    transactionDate,
    type,
    amount,
    category,
    description,
    flutterwaveRef
  }
`

// ---------------------------------------------------------------------------
// Intake feeds
// ---------------------------------------------------------------------------

export const DASHBOARD_FIRST_TIMERS_QUERY = `
  *[_type == "firstTimer"] | order(dateVisited desc, _createdAt desc) {
    _id,
    _type,
    fullName,
    hall,
    department,
    level,
    dateVisited,
    createdAt
  }
`

export const DASHBOARD_WELFARE_QUERY = `
  *[_type == "welfareRequest"] | order(dateSubmitted desc) {
    _id,
    _type,
    name,
    requestDetails,
    status,
    dateSubmitted
  }
`

export const DASHBOARD_PRAYER_REQUESTS_QUERY = `
  *[_type == "prayerRequest"] | order(coalesce(dateSubmitted, _createdAt) desc) {
    _id,
    _type,
    name,
    request,
    "dateSubmitted": coalesce(dateSubmitted, _createdAt)
  }
`

// ---------------------------------------------------------------------------
// Overview stats — split by permission so a role never receives numbers it
// isn't allowed to see. $monthStart / $weekStart are YYYY-MM-DD strings.
// ---------------------------------------------------------------------------

export const PEOPLE_STATS_QUERY = `{
  "firstTimersThisMonth": count(*[_type == "firstTimer" && dateVisited >= $monthStart]),
  "pendingWelfare": count(*[_type == "welfareRequest" && status == "Pending"]),
  "prayerRequestsThisWeek": count(*[_type == "prayerRequest" && coalesce(dateSubmitted, _createdAt) >= $weekStart]),
  "workers": count(*[_type == "worker" && ($hall == null || hall == $hall) && ($team == null || team->name == $team || team == $team)]),
  "lastService": *[_type == "attendanceLedger" && ($team == null || team->name == $team || team == $team)] | order(date desc)[0] { date, serviceType, meetingTitle, totalCount }
}`

export const FINANCE_STATS_QUERY = `{
  "incomeThisMonth": coalesce(math::sum(*[_type == "financeLedger" && type == "Income" && transactionDate >= $monthStart].amount), 0),
  "expenseThisMonth": coalesce(math::sum(*[_type == "financeLedger" && type == "Expense" && transactionDate >= $monthStart].amount), 0)
}`
