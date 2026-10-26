/**
 * GROQ queries — Exco Dashboard (protected reads only).
 *
 * Kept apart from lib/queries.ts so public pages never import these.
 * Run only from lib/dashboard/data after an RBAC check.
 *
 * PII: no projection here may select `phoneNumber` or `roomNumber`.
 * Naming: `team` — never `unit`. Worker.team is a teamUnit reference on
 *    the current backend branches and a plain string on older data, so it
 *    is always resolved with coalesce(team->name, team).
 */

// ---------------------------------------------------------------------------
// Worker CRM
// ---------------------------------------------------------------------------

/** $hall: null for all halls; $team: null for all teams; $cleanTeam: normalized team prefix/keyword */
export const DASHBOARD_WORKERS_QUERY = `
  *[_type == "worker" && (
    $hall == null || hall == $hall || lower(hall) == lower($hall)
  ) && (
    $team == null ||
    $team in memberships[].team->name ||
    count(memberships[team->name match $team || lower(team->name) == lower($team)]) > 0 ||
    team->name == $team ||
    team == $team ||
    lower(team->name) == lower($team) ||
    lower(team) == lower($team) ||
    team->name match $team ||
    team match $team ||
    $team in teams[]->name ||
    $team in teams ||
    count((teams[]->name)[@ match $team || lower(@) == lower($team)]) > 0 ||
    count(teams[@ match $team || lower(@) == lower($team)]) > 0 ||
    ($cleanTeam != null && (
      $cleanTeam in memberships[].team->name ||
      count(memberships[team->name match $cleanTeam || lower(team->name) == lower($cleanTeam)]) > 0 ||
      team->name match $cleanTeam ||
      team match $cleanTeam ||
      lower(team->name) == lower($cleanTeam) ||
      lower(team) == lower($cleanTeam) ||
      $cleanTeam in teams[]->name ||
      $cleanTeam in teams ||
      count((teams[]->name)[@ match $cleanTeam || lower(@) == lower($cleanTeam)]) > 0 ||
      count(teams[@ match $cleanTeam || lower(@) == lower($cleanTeam)]) > 0
    ))
  )] | order(fullName asc) {
    _id,
    fullName,
    email,
    "team": coalesce(memberships[0].team->name, team->name, team),
    "teams": coalesce(memberships[].team->name, teams[]->name, teams, [coalesce(team->name, team)])[@ != null],
    "hall": coalesce(hallRef->name, hall),
    "role": coalesce(
      select(
        count(positions[kind == "csgb" && status == "approved"]) > 0 => "admin",
        count(positions[kind == "hall" && status == "approved"]) > 0 => "hall_rep",
        count(positions[kind == "team" && status == "approved"]) > 0 => "team_lead",
        role
      ),
      "worker"
    ),
    "excoPosition": coalesce(
      positions[status == "approved"][0].csgbRole->title,
      positions[status == "approved"][0].office,
      select(
        positions[status == "approved"][0].kind == "hall" => coalesce(positions[status == "approved"][0].hallRef->name, positions[status == "approved"][0].hall) + " Pastor",
        positions[status == "approved"][0].kind == "team" => positions[status == "approved"][0].team->name + " Lead",
        excoPosition
      )
    ),
    "isExcoApproved": coalesce(count(positions[status == "approved"]) > 0, isExcoApproved, false),
    requestedRole,
    "verificationStatus": coalesce(
      select(
        count(memberships[status == "pending"]) > 0 => "pending",
        count(memberships[status == "verified"]) > 0 => "verified",
        count(memberships[status == "rejected"]) > 0 => "rejected",
        "verified"
      ),
      verificationStatus,
      "verified"
    ),
    verifiedAt,
    verifiedBy,
    "leadingTeam": coalesce(leadingTeam->name, leadingTeam),
    birthDate,
    profileImageUrl,
    "positions": positions[]{
      _key,
      kind,
      "office": coalesce(csgbRole->title, office),
      "csgbRoleId": coalesce(csgbRole._ref, csgbRole->_id),
      "csgbRoleKey": coalesce(csgbRole->slug.current, csgbRole->key),
      "canApproveExecutives": coalesce(csgbRole->canApproveExecutives, false),
      "hall": coalesce(hallRef->name, hall),
      rank,
      status,
      "teamId": coalesce(team._ref, team->_id),
      "teamKey": coalesce(team->key, team->slug.current),
      "teamName": team->name,
      decidedBy,
      decidedAt
    },
    "memberships": memberships[]{
      _key,
      status,
      "teamId": coalesce(team._ref, team->_id),
      "teamKey": coalesce(team->key, team->slug.current),
      "teamName": team->name,
      decidedBy,
      decidedAt
    },
    createdAt,
    updatedAt,
    updateLog
  }
`

export const DASHBOARD_PENDING_EXECUTIVE_POSITIONS_QUERY = `
  *[_type == "worker" && count(positions[status == "pending"]) > 0] | order(_createdAt desc) {
    _id,
    fullName,
    email,
    "hall": coalesce(hallRef->name, hall),
    profileImageUrl,
    createdAt,
    _createdAt,
    "positions": positions[status == "pending"]{
      _key,
      kind,
      "office": coalesce(csgbRole->title, office),
      "csgbRoleId": coalesce(csgbRole._ref, csgbRole->_id),
      "csgbRoleKey": coalesce(csgbRole->slug.current, csgbRole->key),
      "canApproveExecutives": coalesce(csgbRole->canApproveExecutives, false),
      "hall": coalesce(hallRef->name, hall),
      rank,
      status,
      "teamId": coalesce(team._ref, team->_id),
      "teamKey": coalesce(team->key, team->slug.current),
      "teamName": team->name,
      decidedAt
    }
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
    menCount,
    womenCount,
    childrenCount,
    firstTimersCount,
    notes,
    "attendeeCount": count(coalesce(attendees, [])),
    "attendees": attendees[]->{ _id, fullName, "team": coalesce(team->name, team), "teams": coalesce(teams[]->name, teams, [coalesce(team->name, team)])[@ != null] },
    "loggedBy": {
      "_id": coalesce(loggedBy->_id, loggedBy._ref, ""),
      "fullName": coalesce(loggedBy->fullName, loggedByName, loggedBy.fullName, "Fellowship Admin"),
      "excoPosition": loggedBy->excoPosition,
      "role": loggedBy->role
    }
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
  *[_type == "firstTimer" && ($hall == null || hall == $hall || hallRef->name == $hall)] | order(dateVisited desc, _createdAt desc) {
    _id,
    _type,
    fullName,
    firstName,
    lastName,
    phoneNumber,
    "hall": coalesce(hallRef->name, hall),
    roomNumber,
    department,
    level,
    dateVisited,
    followedUp,
    followedUpAt,
    followedUpBy,
    followUpNotes,
    createdAt
  }
`

export const DASHBOARD_WELFARE_QUERY = `
  *[_type == "welfareRequest"] | order(dateSubmitted desc) {
    _id,
    _type,
    name,
    phoneNumber,
    requestDetails,
    status,
    dateSubmitted
  }
`

export const DASHBOARD_WELFARE_LEDGER_QUERY = `
  *[_type == "welfareLedger"] | order(date asc, _createdAt asc) {
    _id,
    date,
    description,
    type,
    amount,
    bankCharge,
    balance,
    category,
    recipient,
    reference,
    "loggedByName": coalesce(loggedByName, loggedBy->fullName, "Welfare Officer"),
    "loggedBy": {
      "_id": coalesce(loggedBy->_id, loggedBy._ref, ""),
      "fullName": coalesce(loggedBy->fullName, loggedByName, "Welfare Officer")
    },
    "createdAt": coalesce(createdAt, _createdAt)
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
  "firstTimersThisMonth": count(*[_type == "firstTimer" && ($hall == null || hall == $hall) && dateVisited >= $monthStart]),
  "pendingWelfare": count(*[_type == "welfareRequest" && status == "Pending"]),
  "prayerRequestsThisWeek": count(*[_type == "prayerRequest" && coalesce(dateSubmitted, _createdAt) >= $weekStart]),
  "workers": count(*[_type == "worker" && ($hall == null || hall == $hall || lower(hall) == lower($hall)) && (
    $team == null ||
    team->name == $team ||
    team == $team ||
    lower(team->name) == lower($team) ||
    lower(team) == lower($team) ||
    team->name match $team ||
    team match $team ||
    $team in teams[]->name ||
    $team in teams ||
    count((teams[]->name)[@ match $team || lower(@) == lower($team)]) > 0 ||
    count(teams[@ match $team || lower(@) == lower($team)]) > 0 ||
    ($cleanTeam != null && (
      team->name match $cleanTeam ||
      team match $cleanTeam ||
      lower(team->name) == lower($cleanTeam) ||
      lower(team) == lower($cleanTeam) ||
      $cleanTeam in teams[]->name ||
      $cleanTeam in teams ||
      count((teams[]->name)[@ match $cleanTeam || lower(@) == lower($cleanTeam)]) > 0 ||
      count(teams[@ match $cleanTeam || lower(@) == lower($cleanTeam)]) > 0
    ))
  )]),
  "lastService": *[_type == "attendanceLedger" && (
    $team == null ||
    team->name == $team ||
    team == $team ||
    lower(team->name) == lower($team) ||
    lower(team) == lower($team) ||
    team->name match $team ||
    team match $team ||
    ($cleanTeam != null && (
      team->name match $cleanTeam ||
      team match $cleanTeam ||
      lower(team->name) == lower($cleanTeam) ||
      lower(team) == lower($cleanTeam)
    ))
  )] | order(date desc)[0] { date, serviceType, meetingTitle, totalCount }
}`

export const FINANCE_STATS_QUERY = `{
  "incomeThisMonth": coalesce(math::sum(*[_type == "financeLedger" && type == "Income" && transactionDate >= $monthStart].amount), 0),
  "expenseThisMonth": coalesce(math::sum(*[_type == "financeLedger" && type == "Expense" && transactionDate >= $monthStart].amount), 0)
}`

// ---------------------------------------------------------------------------
// Announcements Engine (Dashboard view — both published and drafts)
// ---------------------------------------------------------------------------

export const DASHBOARD_ANNOUNCEMENTS_QUERY = `
  *[_type == "announcement"] | order(coalesce(isPinned, false) desc, coalesce(eventDate, publishDate) desc, _createdAt desc) {
    _id,
    title,
    category,
    isPinned,
    time,
    location,
    eventDate,
    publishDate,
    content,
    isPublished,
    sendBroadcastOnPublish,
    sentToSubscribers,
    sentAt,
    _createdAt,
    _updatedAt
  }
`


// ---------------------------------------------------------------------------
// Executives Console (All appointed and approved executive leaders)
// ---------------------------------------------------------------------------

export const DASHBOARD_EXECUTIVES_QUERY = `
  *[_type == "worker" && defined(positions) && count(positions) > 0 && !(_id in path("drafts.**"))] | order(fullName asc) {
    _id,
    fullName,
    firstName,
    lastName,
    email,
    hall,
    roomNumber,
    profileImageUrl,
    "positions": positions[] {
      "_key": coalesce(_key, ""),
      "key": coalesce(_key, ""),
      kind,
      office,
      rank,
      status,
      submittedAt,
      decidedAt,
      "csgbRoleTitle": coalesce(csgbRole->title, office),
      "csgbRoleRef": csgbRole._ref,
      "hallName": coalesce(hallRef->name, hall),
      "teamTitle": coalesce(team->name, teamName)
    }
  }
`

// ---------------------------------------------------------------------------
// Executives Console — reserved appointments for leaders who have not
// registered on /register yet. Claimed automatically on registration.
// ---------------------------------------------------------------------------

export const DASHBOARD_UNREGISTERED_EXECUTIVES_QUERY = `
  *[_type == "executiveAppointment" && status == "pending_claim" && !(_id in path("drafts.**"))] | order(fullName asc) {
    _id,
    fullName,
    normalizedName,
    email,
    kind,
    rank,
    office,
    hall,
    teamName,
    importedAt,
    "csgbRoleTitle": coalesce(csgbRole->title, office),
    "csgbRoleRef": csgbRole._ref,
    "hallName": coalesce(hallRef->name, hall),
    "teamTitle": coalesce(team->name, teamName)
  }
`
