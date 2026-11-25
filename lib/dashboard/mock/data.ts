/**
 * Mock fixtures for the Exco Dashboard — used when DASHBOARD_DATA_SOURCE is
 * "mock" (the default outside production). All names are fictional. Shapes
 * match the browser-safe view models. Worker contact fields are intentionally
 * omitted; first-timer and welfare fixtures include fictional phone numbers so
 * the follow-up and welfare desks can be exercised.
 * Dates are generated relative to today so "this month" / "this
 * week" stats always have something to show.
 */

import type {
  Announcement,
  AttendanceRow,
  FinanceRow,
  FirstTimerRow,
  MeetingMinute,
  PrayerRequest,
  WelfareLedgerRow,
  WelfareRequestRow,
  WorkerRow,
} from '@/types'

const DAY_MS = 24 * 60 * 60 * 1000

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS)
}

function isoDate(days: number): string {
  return daysAgo(days).toISOString().split('T')[0]
}

function isoDateTime(days: number, hour = 10): string {
  const d = daysAgo(days)
  d.setUTCHours(hour, 15, 0, 0)
  return d.toISOString()
}

export const MOCK_HALLS = ['Hall A', 'Hall B', 'Hall C', 'Hall D', 'Hall E'] as const

const TEAMS = ['Media', 'Choir', 'Welfare', 'Academic', 'Outreach', 'Prayer', 'Ushering', 'Protocol', 'Technical', 'Finance']

const FIRST_NAMES = [
  'Osaro', 'Ehis', 'Ivie', 'Osas', 'Efosa', 'Itohan', 'Omoruyi', 'Eghosa', 'Adesuwa', 'Ikponmwosa',
  'Chidinma', 'Tunde', 'Amaka', 'Kelechi', 'Funmi', 'Emeka', 'Blessing', 'Uche', 'Ruth', 'Daniel',
  'Grace', 'Samuel', 'Precious', 'Joshua',
]
const LAST_NAMES = [
  'Okoro', 'Igbinedion', 'Aigbe', 'Osagie', 'Ehigiator', 'Uwaifo', 'Idahosa', 'Omoregie', 'Eguavoen', 'Obaseki',
  'Adeyemi', 'Nwosu', 'Balogun', 'Eze', 'Okafor', 'Ogunleye',
]

function makeWorker(i: number, overrides: Partial<WorkerRow> = {}): WorkerRow {
  const fullName = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i * 7) % LAST_NAMES.length]}`
  const email = `${fullName.toLowerCase().replace(/\s+/g, '.')}@example.com`
  const team = TEAMS[i % TEAMS.length]
  const secondTeam = i % 3 === 0 ? TEAMS[(i + 4) % TEAMS.length] : undefined
  const teams = secondTeam ? [team, secondTeam] : [team]
  const created = 200 - i * 6
  const updated = Math.max(1, created - 40 - (i % 9) * 3)
  const verificationStatus = i === 1 || i % 6 === 0 ? 'pending' : 'verified'
  return {
    _id: `mock-worker-${String(i + 1).padStart(3, '0')}`,
    fullName,
    email,
    team,
    teams,
    hall: MOCK_HALLS[i % MOCK_HALLS.length],
    birthDate: `${2001 + (i % 6)}-${String((i % 12) + 1).padStart(2, '0')}-${String(((i * 5) % 27) + 1).padStart(2, '0')}`,
    verificationStatus,
    createdAt: isoDateTime(created),
    updatedAt: isoDateTime(updated),
    updateLog:
      i % 4 === 0
        ? [`Changed Team from ${TEAMS[(i + 3) % TEAMS.length]} to ${team} on ${isoDate(updated)}`]
        : [],
    ...overrides,
  }
}

const sessionWorkers: WorkerRow[] = [
  makeWorker(0, {
    _id: 'mock-worker-admin',
    fullName: 'Osaro Igbinedion',
    email: 'osaro.igbinedion@example.com',
    team: 'Exco',
    hall: 'Hall A',
    role: 'admin',
    excoPosition: 'President',
    isExcoApproved: true,
    verificationStatus: 'verified',
    positions: [{ _key: 'pos-pres', kind: 'csgb', office: 'President & Executive Shepherd', status: 'approved' }],
  }),
  makeWorker(1, {
    _id: 'mock-worker-teamlead',
    fullName: 'Tobi Adebayo',
    email: 'tobi.adebayo@example.com',
    team: 'Media',
    leadingTeam: 'Media',
    hall: 'Hall D',
    role: 'team_lead',
    excoPosition: 'Media Coordinator',
    isExcoApproved: true,
    verificationStatus: 'verified',
    positions: [{ _key: 'pos-media-lead', kind: 'team', teamId: 'team-media', teamKey: 'media', teamName: 'Media', rank: 'lead', status: 'approved' }],
    memberships: [{ _key: 'mem-media-lead', teamId: 'team-media', teamKey: 'media', teamName: 'Media', status: 'verified' }],
  }),
  makeWorker(2, { _id: 'mock-worker-hallrep', fullName: 'Ivie Aigbe', email: 'ivie.aigbe@example.com', team: 'Welfare', hall: 'Hall B', role: 'hall_rep', isExcoApproved: true, verificationStatus: 'verified' }),
  makeWorker(3, { _id: 'mock-worker-finance', fullName: 'Efosa Osagie', email: 'efosa.osagie@example.com', team: 'Finance', hall: 'Hall C', role: 'finance', excoPosition: 'Financial Secretary', isExcoApproved: true, verificationStatus: 'verified' }),
]

const initialWorkers: WorkerRow[] = [
  ...sessionWorkers,
  makeWorker(4, {
    positions: [{ _key: 'pos-csgb-01', kind: 'csgb', office: "Vice President - Admin", status: 'pending' }],
  }),
  makeWorker(5, {
    positions: [{ _key: 'pos-csgb-02', kind: 'csgb', office: "General Secretary", status: 'pending' }],
  }),
  makeWorker(6, {
    positions: [{ _key: 'pos-hall-01', kind: 'hall', hall: 'Hall 3', rank: 'lead', status: 'pending' }],
  }),
  makeWorker(7, {
    positions: [{ _key: 'pos-hall-02', kind: 'hall', hall: 'Hall 1', rank: 'assistant', status: 'pending' }],
  }),
  makeWorker(8, {
    positions: [{ _key: 'pos-team-01', kind: 'team', teamId: 'team-choir', teamKey: 'choir', teamName: 'Choir', rank: 'lead', status: 'pending' }],
    memberships: [{ _key: 'mem-team-01', teamId: 'team-choir', teamKey: 'choir', teamName: 'Choir', status: 'pending' }],
  }),
  makeWorker(9, {
    positions: [{ _key: 'pos-team-02', kind: 'team', teamId: 'team-technical', teamKey: 'technical', teamName: 'Technical', rank: 'assistant', status: 'pending' }],
    memberships: [{ _key: 'mem-team-02', teamId: 'team-technical', teamKey: 'technical', teamName: 'Technical', status: 'pending' }],
  }),
  ...Array.from({ length: 21 }, (_, i) => makeWorker(i + 10)),
]

/**
 * Next dev compiles server actions and route handlers into separate module
 * instances, so a plain module-level array would let offboarding/import
 * mutations disappear between routes. Keep the mutable dev fixtures on
 * globalThis so every route in the dev server sees the same roster.
 */
const globalForMock = globalThis as typeof globalThis & {
  __ECCF_MOCK_WORKERS?: WorkerRow[]
}

export const MOCK_WORKERS: WorkerRow[] =
  globalForMock.__ECCF_MOCK_WORKERS ?? initialWorkers

globalForMock.__ECCF_MOCK_WORKERS = MOCK_WORKERS

/** Hall of a worker by id — mirrors WORKER_HALL_BY_ID_QUERY */
export function mockHallForWorker(id: string): string | null {
  return MOCK_WORKERS.find((w) => w._id === id)?.hall ?? null
}

export const MOCK_FIRST_TIMERS: FirstTimerRow[] = [
  { _id: 'mock-ft-01', _type: 'firstTimer', fullName: 'Ese Omoregie', hall: 'Hall D', roomNumber: 'Room 114', phoneNumber: '08023456789', department: 'Computer Science', level: '100', dateVisited: isoDate(1), followedUp: false },
  { _id: 'mock-ft-02', _type: 'firstTimer', fullName: 'Kingsley Uwaifo', hall: 'Hall A', roomNumber: 'Room 205', phoneNumber: '08134567890', department: 'Mechanical Engineering', level: '200', dateVisited: isoDate(1), followedUp: false },
  { _id: 'mock-ft-03', _type: 'firstTimer', fullName: 'Nosa Eguavoen', hall: 'Hall B', roomNumber: 'Room 012', phoneNumber: '07045678901', department: 'Nursing', level: '100', dateVisited: isoDate(8), followedUp: false },
  { _id: 'mock-ft-04', _type: 'firstTimer', fullName: 'Joy Adeyemi', hall: 'Hall C', roomNumber: 'Room 310', phoneNumber: '08056789012', department: 'Economics', level: '300', dateVisited: isoDate(8), followedUp: true, followedUpAt: isoDate(7), followedUpBy: 'Ivie Aigbe (Hall Rep)', followUpNotes: 'Spoke with her, warmly welcomed to Hall C cell group.' },
  { _id: 'mock-ft-05', _type: 'firstTimer', fullName: 'Victor Nwosu', hall: 'Hall E', roomNumber: 'Room 108', phoneNumber: '09067890123', department: 'Physics', level: '100', dateVisited: isoDate(15), followedUp: false },
  { _id: 'mock-ft-06', _type: 'firstTimer', fullName: 'Lilian Okafor', hall: 'Hall C', roomNumber: 'Room 221', phoneNumber: '08178901234', department: 'Medicine & Surgery', level: '200', dateVisited: isoDate(22), followedUp: true, followedUpAt: isoDate(21), followedUpBy: 'Osaro Igbinedion (President)' },
  { _id: 'mock-ft-07', _type: 'firstTimer', fullName: 'Ofure Idahosa', hall: 'Hall B', roomNumber: 'Room 104', phoneNumber: '08089012345', department: 'Mass Communication', level: '100', dateVisited: isoDate(36), followedUp: true, followedUpAt: isoDate(35), followedUpBy: 'Ivie Aigbe (Hall Rep)' },
  { _id: 'mock-ft-08', _type: 'firstTimer', fullName: 'Paul Balogun', hall: 'Hall A', roomNumber: 'Room 003', phoneNumber: '07090123456', department: 'Law', level: '400', dateVisited: isoDate(43), followedUp: false },
]

export const MOCK_WELFARE: WelfareRequestRow[] = [
  { _id: 'mock-wf-01', _type: 'welfareRequest', name: 'Anonymous student', requestDetails: 'I need help with feeding until my allowance comes at the end of the month.', status: 'Pending', dateSubmitted: isoDateTime(0, 8) },
  { _id: 'mock-wf-02', _type: 'welfareRequest', name: 'Eghosa Obaseki', phoneNumber: '08031234567', requestDetails: 'Hospital bill after a malaria admission at the university clinic. About ₦18,000 outstanding.', status: 'Pending', dateSubmitted: isoDateTime(2) },
  { _id: 'mock-wf-03', _type: 'welfareRequest', name: 'Amaka Eze', phoneNumber: '08149876543', requestDetails: 'Lost my textbooks and notes in the hostel flood; would appreciate help replacing two course texts.', status: 'Pending', dateSubmitted: isoDateTime(5) },
  { _id: 'mock-wf-04', _type: 'welfareRequest', name: 'Tunde Ogunleye', phoneNumber: '07065554433', requestDetails: 'Transport fare home for a family emergency.', status: 'Resolved', dateSubmitted: isoDateTime(12) },
  { _id: 'mock-wf-05', _type: 'welfareRequest', name: 'Ruth Ehigiator', phoneNumber: '09012223344', requestDetails: 'Help with exam registration fee shortfall.', status: 'Resolved', dateSubmitted: isoDateTime(30) },
]

export const MOCK_PRAYER_REQUESTS: PrayerRequest[] = [
  { _id: 'mock-pr-01', _type: 'prayerRequest', name: 'Daniel', request: 'Pray for my upcoming GST exams and for clarity of mind.', dateSubmitted: isoDateTime(0, 7) },
  { _id: 'mock-pr-02', _type: 'prayerRequest', request: 'Healing for my mother who is recovering from surgery.', dateSubmitted: isoDateTime(1) },
  { _id: 'mock-pr-03', _type: 'prayerRequest', name: 'Grace O.', request: 'Thanksgiving — I got the scholarship! Please pray for wisdom as I manage it well.', dateSubmitted: isoDateTime(3) },
  { _id: 'mock-pr-04', _type: 'prayerRequest', name: 'Samuel', request: 'Direction about my final-year project and supervisor relationship.', dateSubmitted: isoDateTime(9) },
  { _id: 'mock-pr-05', _type: 'prayerRequest', request: 'Peace in my family and provision for school fees next session.', dateSubmitted: isoDateTime(16) },
]

const SERVICE_ROTATION: AttendanceRow['serviceType'][] = ['Sunday Service', 'Wednesday Bible Study', 'Team Meeting', 'Sunday Service', 'Academic Service', 'Team Meeting']

export const MOCK_ATTENDANCE: AttendanceRow[] = Array.from({ length: 14 }, (_, i) => {
  const serviceType = SERVICE_ROTATION[i % SERVICE_ROTATION.length]
  const isGeneral = serviceType !== 'Team Meeting' && serviceType !== 'Exco Meeting'
  const base = serviceType === 'Sunday Service' ? 320 : serviceType === 'Wednesday Bible Study' ? 140 : serviceType === 'Academic Service' ? 210 : 35
  const teamName = serviceType === 'Team Meeting' ? TEAMS[i % TEAMS.length] : undefined
  const meetingTitle = serviceType === 'Team Meeting' ? `${teamName} Weekly Rehearsal & Review` : undefined
  const totalCount = base + ((i * 17) % 40)
  
  const menCount = isGeneral ? Math.round(totalCount * 0.42) : undefined
  const womenCount = isGeneral ? Math.round(totalCount * 0.48) : undefined
  const childrenCount = isGeneral ? Math.round(totalCount * 0.05) : undefined
  const firstTimersCount = isGeneral ? Math.max(2, totalCount - ((menCount || 0) + (womenCount || 0) + (childrenCount || 0))) : undefined

  return {
    _id: `mock-att-${String(i + 1).padStart(2, '0')}`,
    date: isoDate(i * 3 + 1),
    serviceType,
    meetingTitle,
    teamName,
    totalCount,
    attendeeCount: serviceType === 'Team Meeting' ? totalCount : 0,
    menCount,
    womenCount,
    childrenCount,
    firstTimersCount,
    notes: isGeneral && i % 3 === 0 ? 'Smooth service. Ushering headcount completed across all overflow wings.' : undefined,
    loggedBy: isGeneral 
      ? { _id: 'mock-worker-usher', fullName: 'Ushering Head Coordinator' }
      : { _id: 'mock-worker-teamlead', fullName: 'Tobi Adebayo' },
  }
})

export const MOCK_FINANCE: FinanceRow[] = [
  { _id: 'mock-fin-01', transactionDate: isoDate(1), type: 'Income', amount: 86500, category: 'Offering', description: 'Sunday service offering' },
  { _id: 'mock-fin-02', transactionDate: isoDate(1), type: 'Income', amount: 42000, category: 'Tithe', description: 'Sunday service tithes' },
  { _id: 'mock-fin-03', transactionDate: isoDate(2), type: 'Income', amount: 15000, category: 'Online Giving', description: 'Online giving', flutterwaveRef: 'FLW-MOCK-000123' },
  { _id: 'mock-fin-04', transactionDate: isoDate(3), type: 'Expense', amount: 18000, category: 'Welfare Disbursement', description: 'Hospital bill support' },
  { _id: 'mock-fin-05', transactionDate: isoDate(6), type: 'Expense', amount: 9500, category: 'Utility Expense', description: 'Generator fuel for Sunday service' },
  { _id: 'mock-fin-06', transactionDate: isoDate(8), type: 'Income', amount: 79200, category: 'Offering', description: 'Sunday service offering' },
  { _id: 'mock-fin-07', transactionDate: isoDate(10), type: 'Expense', amount: 35000, category: 'Event Expense', description: 'Freshers welcome refreshments' },
  { _id: 'mock-fin-08', transactionDate: isoDate(15), type: 'Income', amount: 25000, category: 'Project Levy', description: 'Sound equipment levy' },
  { _id: 'mock-fin-09', transactionDate: isoDate(29), type: 'Expense', amount: 4000, category: 'Miscellaneous', description: 'Printing of programme sheets' },
  { _id: 'mock-fin-10', transactionDate: isoDate(40), type: 'Income', amount: 81000, category: 'Offering', description: 'Sunday service offering' },
]


export const MOCK_WELFARE_LEDGER: WelfareLedgerRow[] = [
  {
    _id: 'mock-welfare-01',
    date: isoDate(28),
    type: 'Credit',
    amount: 150000,
    bankCharge: 0,
    runningBalance: 150000,
    category: 'Central Finance Allocation',
    description: 'First Semester Welfare Purse seed allocation from ECCF Central Account',
    reference: 'ECCF-TRF-2026-001',
    loggedByName: 'General Secretary',
    createdAt: isoDateTime(28),
  },
  {
    _id: 'mock-welfare-02',
    date: isoDate(24),
    type: 'Debit',
    amount: 15000,
    bankCharge: 53.75,
    runningBalance: 134946.25,
    category: 'Food & Nutrition Support',
    description: 'Emergency food & nutrition support for stranded Hall 2 student',
    recipient: 'Brother Emmanuel',
    reference: 'TRF-WLF-90214',
    loggedByName: 'Welfare Team Lead',
    createdAt: isoDateTime(24),
  },
  {
    _id: 'mock-welfare-03',
    date: isoDate(20),
    type: 'Credit',
    amount: 25000,
    bankCharge: 0,
    runningBalance: 159946.25,
    category: 'Purse Donation / Voluntary Gift',
    description: 'Anonymous voluntary contribution towards Welfare Medical Aid',
    reference: 'FLW-VOL-88192',
    loggedByName: 'Fellowship Chaplain',
    createdAt: isoDateTime(20),
  },
  {
    _id: 'mock-welfare-04',
    date: isoDate(16),
    type: 'Debit',
    amount: 22000,
    bankCharge: 53.75,
    runningBalance: 137892.5,
    category: 'Medical / Healthcare Aid',
    description: 'Urgent prescription medication support at ESUI Health Centre',
    recipient: 'Sister Blessing',
    reference: 'TRF-WLF-90342',
    loggedByName: 'Welfare Team Lead',
    createdAt: isoDateTime(16),
  },
  {
    _id: 'mock-welfare-05',
    date: isoDate(11),
    type: 'Debit',
    amount: 8500,
    bankCharge: 26.88,
    runningBalance: 129365.62,
    category: 'Academic / Textbook Support',
    description: 'GST and faculty syllabus course material support',
    recipient: 'Brother Joshua',
    reference: 'TRF-WLF-90411',
    loggedByName: 'Welfare Team Lead',
    createdAt: isoDateTime(11),
  },
  {
    _id: 'mock-welfare-06',
    date: isoDate(7),
    type: 'Credit',
    amount: 50000,
    bankCharge: 0,
    runningBalance: 179365.62,
    category: 'Central Finance Allocation',
    description: 'Mid-semester welfare supplemental grant from Fellowship Executive',
    reference: 'ECCF-TRF-2026-045',
    loggedByName: 'Financial Secretary',
    createdAt: isoDateTime(7),
  },
  {
    _id: 'mock-welfare-07',
    date: isoDate(3),
    type: 'Debit',
    amount: 14000,
    bankCharge: 53.75,
    runningBalance: 165311.87,
    category: 'Emergency Transport Aid',
    description: 'Emergency travel assistance for family bereavement',
    recipient: 'Brother Samuel',
    reference: 'TRF-WLF-90520',
    loggedByName: 'Welfare Team Lead',
    createdAt: isoDateTime(3),
  },
]

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    _id: 'mock-ann-01',
    _type: 'announcement',
    title: 'Sunday Worship Encounter & Spiritual Awakening',
    category: 'WEEKLY SERVICES',
    isPinned: true,
    time: '08:00 AM',
    location: 'NLT 5, Faculty of Law, ESUI',
    eventDate: isoDate(-4),
    publishDate: isoDate(0),
    content: [
      {
        _type: 'block',
        _key: 'b1',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 's1',
            text: 'Join us for a transformational encounter with God in His presence. Come expecting miracles, uplifting worship, and the undiluted Word.',
          },
        ],
      },
    ],
    isPublished: true,
    sendBroadcastOnPublish: true,
    sentToSubscribers: true,
    sentAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: 'mock-ann-02',
    _type: 'announcement',
    title: 'Pre-Exam Academic Tutorials & Special Prayer Clinic',
    category: 'ACADEMIC & EXAMS',
    isPinned: false,
    time: '04:50 PM',
    location: 'NLT 5, Faculty of Law, ESUI',
    eventDate: isoDate(-7),
    publishDate: isoDate(1),
    content: [
      {
        _type: 'block',
        _key: 'b2',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 's2',
            text: 'The Academic & Tutorial Committee invites all students to our intensive revision sessions in GST, Science, and Law courses followed by a dedicated session of prayer for academic excellence.',
          },
        ],
      },
    ],
    isPublished: true,
    sendBroadcastOnPublish: true,
    sentToSubscribers: false,
  },
  {
    _id: 'mock-ann-03',
    _type: 'announcement',
    title: 'Wednesday Midweek Bible Study: Walking in Dominion',
    category: 'BIBLE STUDY',
    isPinned: false,
    time: '04:50 PM',
    location: 'NLT 5, Faculty of Law, ESUI',
    eventDate: isoDate(-2),
    publishDate: isoDate(2),
    content: [
      {
        _type: 'block',
        _key: 'b3',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 's3',
            text: 'Diving deep into practical Christian living and foundational doctrines. Bring your Bible, journal, and a friend.',
          },
        ],
      },
    ],
    isPublished: true,
    sendBroadcastOnPublish: false,
    sentToSubscribers: true,
    sentAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: 'mock-ann-04',
    _type: 'announcement',
    title: 'CSGB Quarterly Strategic Exco Planning Retreat',
    category: 'EXCO UPDATES',
    isPinned: false,
    time: '02:00 PM',
    location: 'ECCF Secretariat, Hall A',
    eventDate: isoDate(-12),
    publishDate: isoDate(3),
    content: [
      {
        _type: 'block',
        _key: 'b4',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 's4',
            text: 'Internal draft review of fellowship spiritual calendar, mission outreach budget, and team leadership performance evaluations.',
          },
        ],
      },
    ],
    isPublished: false,
    sendBroadcastOnPublish: false,
    sentToSubscribers: false,
  },
]

const initialMeetingMinutes: MeetingMinute[] = [
  {
    _id: 'mock-min-01',
    _type: 'meetingMinute',
    title: 'General EXCO Mobilization & First Semester Calendar Alignment',
    meetingDate: isoDate(3),
    meetingType: 'General EXCO',
    folder: '2026/2027 Session',
    venue: 'NLT 5, Faculty of Law, ESUI',
    startTime: '04:00 PM',
    endTime: '06:20 PM',
    chairperson: 'Osaro Igbinedion',
    recorderName: 'General Secretary',
    attendees: [
      'Osaro Igbinedion (President)',
      'Vice President - Admin',
      'General Secretary',
      'Tobi Adebayo (Media Coordinator)',
      'Efosa Osagie (Financial Secretary)',
      'Ivie Aigbe (Hall B Pastor)',
    ],
    absentees: ['Decoration Director (excused)'],
    agenda: [
      'Opening prayer and spiritual charge from Psalm 127',
      'Review of Freshers Welcome & Hall mobilization targets',
      'Sunday and midweek service logistics alignment',
      'Financial purse update and welfare support coordination',
      'Action item assignments and closing benediction',
    ],
    summary:
      'Aligned all ministry teams and hall pastors on First Semester outreach targets, ushering headcount workflow, and weekly prayer chain coverage.',
    body:
      '1. Opening Charge: The President exhorted all executives on servant leadership, consistency in secret-place prayer, and punctual service preparation.\n\n2. Hall Mobilization: Hall Pastors reported steady follow-up on 100-level newcomers across Halls A–E. Follow-up notes must be logged in the First-Timers desk within 48 hours of Sunday service.\n\n3. Media & Publicity: Media Team presented the semester graphics schedule and requested sermon outlines by Thursday evenings to keep the Sermon Vault synced.\n\n4. Stewardship & Welfare: Financial Secretary reminded all team leads to submit programme requisition vouchers at least 7 days before events.',
    decisions: [
      'All Sunday service headcounts must be submitted on the Attendance console before 4:00 PM each Sunday.',
      'Hall Pastors will host bi-weekly hostel prayer cells starting next Tuesday.',
      'Media and Technical teams to finalize audio routing for the upcoming Academic Prayer Clinic.',
    ],
    actionItems: [
      {
        _key: 'ai-01-a',
        task: 'Assign follow-up leads to all uncontacted 100-level first-timers across Halls A–E',
        owner: 'Hall Pastors & Outreach Team',
        dueDate: isoDate(-4),
        status: 'open',
      },
      {
        _key: 'ai-01-b',
        task: 'Publish midweek Bible Study announcement and verify venue readiness',
        owner: 'General Secretary',
        dueDate: isoDate(1),
        status: 'done',
      },
      {
        _key: 'ai-01-c',
        task: 'Upload Sunday sermon media links and verify Spotify/YouTube sync',
        owner: 'Tobi Adebayo (Media Coordinator)',
        dueDate: isoDate(-2),
        status: 'open',
      },
    ],
    tags: ['mobilization', 'semester-calendar', 'all-exco'],
    isPinned: true,
    isPostedToExcos: true,
    postedAt: isoDateTime(2, 14),
    postedBy: 'Osaro Igbinedion',
    archived: false,
    createdById: 'mock-worker-admin',
    createdByName: 'Osaro Igbinedion',
    createdAt: isoDateTime(3, 18),
    updatedByName: 'Osaro Igbinedion',
    updatedAt: isoDateTime(2, 14),
  },
  {
    _id: 'mock-min-02',
    _type: 'meetingMinute',
    title: 'CSGB Executive Screening & Pastoral Oversight Review',
    meetingDate: isoDate(5),
    meetingType: 'CSGB',
    folder: '2026/2027 Session',
    venue: 'ECCF Secretariat, Room 2',
    startTime: '06:30 PM',
    endTime: '08:10 PM',
    chairperson: 'Osaro Igbinedion',
    recorderName: 'General Secretary',
    attendees: [
      'Osaro Igbinedion (President)',
      'Vice President - Admin',
      'Vice President - Evangelism',
      'General Secretary',
      'Prayer Coordinator',
    ],
    absentees: [],
    agenda: [
      'Intercession for campus spiritual climate and executive unity',
      'Review of pending executive appointment applications',
      'Confidential pastoral care follow-up for distressed students',
      'Preparation of agenda for next General EXCO assembly',
    ],
    summary:
      'Internal CSGB deliberation reviewing pending executive leadership appointments and sensitive student pastoral cases prior to General EXCO briefing.',
    body:
      'The Board met for focused prayer and governance review. Pending team assistant nominations from Choir and Technical were evaluated for spiritual maturity and academic standing.\n\nConfidential welfare referrals were routed to the Welfare & Medical Coordinator with direct oversight from the Fellowship Chaplain.',
    decisions: [
      'Approve verified executive onboarding once candidate interviews conclude this Friday.',
      'Keep confidential pastoral case notes restricted to CSGB and Welfare leadership.',
    ],
    actionItems: [
      {
        _key: 'ai-02-a',
        task: 'Complete brief confirmation interviews for Choir and Technical assistant nominees',
        owner: 'VP Admin & Chaplain',
        dueDate: isoDate(-3),
        status: 'open',
      },
      {
        _key: 'ai-02-b',
        task: 'Coordinate discreet medical support disbursement for Hall 2 student',
        owner: 'Welfare Coordinator',
        dueDate: isoDate(1),
        status: 'done',
      },
    ],
    tags: ['csgb-internal', 'governance', 'pastoral'],
    isPinned: false,
    isPostedToExcos: false,
    archived: false,
    createdById: 'mock-worker-admin',
    createdByName: 'Osaro Igbinedion',
    createdAt: isoDateTime(5, 20),
    updatedByName: 'Osaro Igbinedion',
    updatedAt: isoDateTime(5, 20),
  },
  {
    _id: 'mock-min-03',
    _type: 'meetingMinute',
    title: '2026/2027 EXCO Leadership Retreat & Spiritual Blueprint',
    meetingDate: isoDate(12),
    meetingType: 'Retreat & Planning',
    folder: '2026/2027 Session',
    venue: 'Campus Chapel Annex',
    startTime: '09:00 AM',
    endTime: '03:30 PM',
    chairperson: 'Osaro Igbinedion',
    recorderName: 'General Secretary',
    attendees: [
      'Osaro Igbinedion (President)',
      'Vice President - Admin',
      'General Secretary',
      'Prayer Coordinator',
      'Efosa Osagie (Financial Secretary)',
      'Tobi Adebayo (Media Coordinator)',
      'Ivie Aigbe (Hall B Pastor)',
    ],
    absentees: [],
    agenda: [
      'Word session & prophetic theme for the 2026/2027 tenure',
      'Departmental KPIs and worker discipleship tracks',
      'Budget framework for evangelism, welfare, and media equipment',
    ],
    summary:
      'Tenure kickoff retreat establishing spiritual priorities, worker retention goals, and quarterly budget discipline across all ministry teams.',
    body:
      'All executives fasted and prayed together before breaking into ministry strategy workshops. Each team submitted measurable goals for worker discipleship and newcomer assimilation.\n\nThe retreat concluded with communion and formal commissioning of team leaders.',
    decisions: [
      'Adopt "Rooted & Built Up" as the semester discipleship focus across Bible Study and Hall Cells.',
      'Hold monthly EXCO accountability check-ins on the first Saturday of each month.',
    ],
    actionItems: [
      {
        _key: 'ai-03-a',
        task: 'Circulate approved semester budget ceilings to every team coordinator',
        owner: 'Efosa Osagie (Financial Secretary)',
        dueDate: isoDate(6),
        status: 'done',
      },
      {
        _key: 'ai-03-b',
        task: 'Publish quarterly discipleship reading guide for all workers',
        owner: 'Academic & Bible Study Coordinators',
        dueDate: isoDate(-6),
        status: 'open',
      },
    ],
    tags: ['retreat', 'vision', 'discipleship'],
    isPinned: false,
    isPostedToExcos: true,
    postedAt: isoDateTime(10, 11),
    postedBy: 'Osaro Igbinedion',
    archived: false,
    createdById: 'mock-worker-admin',
    createdByName: 'Osaro Igbinedion',
    createdAt: isoDateTime(12, 16),
    updatedByName: 'Osaro Igbinedion',
    updatedAt: isoDateTime(10, 11),
  },
  {
    _id: 'mock-min-04',
    _type: 'meetingMinute',
    title: 'Academic Tutorials & Exam Prayer Clinic Committee Briefing',
    meetingDate: isoDate(18),
    meetingType: 'Committee',
    folder: 'Academic & Outreach',
    venue: 'Faculty of Law Reading Room',
    startTime: '05:00 PM',
    endTime: '06:15 PM',
    chairperson: 'Academic Coordinator',
    recorderName: 'General Secretary',
    attendees: [
      'Academic Coordinator',
      'Prayer Coordinator',
      'Tobi Adebayo (Media Coordinator)',
      'Ivie Aigbe (Hall B Pastor)',
    ],
    absentees: [],
    agenda: [
      'Tutorial tutor roster for 100L/200L GST and Science courses',
      'Prayer clinic format and worship schedule',
      'Hall announcement and flyer distribution plan',
    ],
    summary:
      'Operational committee briefing finalizing tutor pairings, classroom bookings, and publicity timeline for pre-exam revision clinics.',
    body:
      'Confirmed 12 senior student tutors across Law, Basic Medical Sciences, Engineering, and Management Sciences. Prayer clinic will hold immediately after Thursday revision hours.',
    decisions: [
      'Reserve NLT 5 for Thursday evening tutorial & prayer sessions.',
      'Deliver printed timetable flyers to Hall Pastors by Monday morning.',
    ],
    actionItems: [
      {
        _key: 'ai-04-a',
        task: 'Confirm NLT 5 hall reservation with Faculty officer',
        owner: 'Academic Coordinator',
        dueDate: isoDate(14),
        status: 'done',
      },
    ],
    tags: ['academics', 'tutorials', 'prayer-clinic'],
    isPinned: false,
    isPostedToExcos: true,
    postedAt: isoDateTime(17, 9),
    postedBy: 'Osaro Igbinedion',
    archived: false,
    createdById: 'mock-worker-admin',
    createdByName: 'Osaro Igbinedion',
    createdAt: isoDateTime(18, 19),
    updatedByName: 'Osaro Igbinedion',
    updatedAt: isoDateTime(17, 9),
  },
  {
    _id: 'mock-min-05',
    _type: 'meetingMinute',
    title: 'CSGB Emergency Welfare & Hostel Intervention Session',
    meetingDate: isoDate(1),
    meetingType: 'Emergency',
    folder: '2026/2027 Session',
    venue: 'ECCF Secretariat (Urgent Session)',
    startTime: '08:00 PM',
    endTime: '09:05 PM',
    chairperson: 'Osaro Igbinedion',
    recorderName: 'Prayer Coordinator',
    attendees: [
      'Osaro Igbinedion (President)',
      'Vice President - Admin',
      'Prayer Coordinator',
    ],
    absentees: ['General Secretary (traveling)'],
    agenda: [
      'Urgent accommodation and medical response for affected Hall 2 students',
      'Emergency welfare purse allocation approval',
    ],
    summary:
      'Draft emergency minutes detailing rapid CSGB welfare intervention; awaiting General Secretary review before posting summary to EXCOs.',
    body:
      'Emergency authorization granted for immediate medical and temporary accommodation assistance from the Welfare Purse. Follow-up pastoral visit scheduled within 24 hours.',
    decisions: [
      'Release ₦22,000 emergency allocation via Welfare Purse Ledger with dual sign-off.',
    ],
    actionItems: [
      {
        _key: 'ai-05-a',
        task: 'Log disbursement reference and receipt in Welfare Purse Ledger',
        owner: 'Welfare Team Lead',
        dueDate: isoDate(0),
        status: 'open',
      },
    ],
    tags: ['emergency', 'welfare', 'csgb-draft'],
    isPinned: false,
    isPostedToExcos: false,
    archived: false,
    createdById: 'mock-worker-admin',
    createdByName: 'Osaro Igbinedion',
    createdAt: isoDateTime(1, 21),
    updatedByName: 'Osaro Igbinedion',
    updatedAt: isoDateTime(1, 21),
  },
  {
    _id: 'mock-min-06',
    _type: 'meetingMinute',
    title: '2025/2026 Handover & End-of-Session Financial Review',
    meetingDate: isoDate(95),
    meetingType: 'General EXCO',
    folder: '2025/2026 Session',
    venue: 'NLT 5, Faculty of Law, ESUI',
    startTime: '03:00 PM',
    endTime: '05:45 PM',
    chairperson: 'Outgoing President',
    recorderName: 'Outgoing General Secretary',
    attendees: ['Outgoing CSGB', 'Incoming CSGB', 'Financial Secretary'],
    absentees: [],
    agenda: [
      'Asset and sound inventory handover',
      'Closing balance verification and audit sign-off',
    ],
    summary:
      'Archived handover minutes documenting equipment inventory, closing bank balances, and transition notes from the 2025/2026 EXCO.',
    body:
      'Complete sound, media, and library inventory verified and signed over to incoming 2026/2027 leadership.',
    decisions: [
      'Archive 2025/2026 operational records for historical reference.',
    ],
    actionItems: [
      {
        _key: 'ai-06-a',
        task: 'Complete asset register counter-signature',
        owner: 'VP Admin',
        dueDate: isoDate(90),
        status: 'done',
      },
    ],
    tags: ['handover', 'archive', '2025-2026'],
    isPinned: false,
    isPostedToExcos: true,
    postedAt: isoDateTime(94, 10),
    postedBy: 'Outgoing General Secretary',
    archived: true,
    createdById: 'mock-worker-admin',
    createdByName: 'Outgoing General Secretary',
    createdAt: isoDateTime(95, 18),
    updatedByName: 'Osaro Igbinedion',
    updatedAt: isoDateTime(80, 12),
  },
]

const globalForMinutesMock = globalThis as typeof globalThis & {
  __ECCF_MOCK_MEETING_MINUTES?: MeetingMinute[]
}

export const MOCK_MEETING_MINUTES: MeetingMinute[] =
  globalForMinutesMock.__ECCF_MOCK_MEETING_MINUTES ?? initialMeetingMinutes

globalForMinutesMock.__ECCF_MOCK_MEETING_MINUTES = MOCK_MEETING_MINUTES
