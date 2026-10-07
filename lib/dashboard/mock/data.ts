/**
 * Mock fixtures for the Exco Dashboard — used when DASHBOARD_DATA_SOURCE is
 * "mock" (the default outside production). All names are fictional. Shapes
 * match the browser-safe view models, so no phone/room values exist here
 * at all. Dates are generated relative to today so "this month" / "this
 * week" stats always have something to show.
 */

import type {
  AttendanceRow,
  FinanceRow,
  PrayerRequest,
  SafeFirstTimer,
  SafeWelfareRequest,
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
  const team = TEAMS[i % TEAMS.length]
  const created = 200 - i * 6
  const updated = Math.max(1, created - 40 - (i % 9) * 3)
  return {
    _id: `mock-worker-${String(i + 1).padStart(3, '0')}`,
    fullName,
    team,
    hall: MOCK_HALLS[i % MOCK_HALLS.length],
    birthDate: `${2001 + (i % 6)}-${String((i % 12) + 1).padStart(2, '0')}-${String(((i * 5) % 27) + 1).padStart(2, '0')}`,
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
  makeWorker(0, { _id: 'mock-worker-admin', fullName: 'Osaro Igbinedion', team: 'Exco', hall: 'Hall A', role: 'admin' }),
  makeWorker(1, { _id: 'mock-worker-hallrep', fullName: 'Ivie Aigbe', team: 'Welfare', hall: 'Hall B', role: 'hall_rep' }),
  makeWorker(2, { _id: 'mock-worker-finance', fullName: 'Efosa Osagie', team: 'Finance', hall: 'Hall C', role: 'finance' }),
]

export const MOCK_WORKERS: WorkerRow[] = [
  ...sessionWorkers,
  ...Array.from({ length: 27 }, (_, i) => makeWorker(i + 3)),
]

/** Hall of a worker by id — mirrors WORKER_HALL_BY_ID_QUERY */
export function mockHallForWorker(id: string): string | null {
  return MOCK_WORKERS.find((w) => w._id === id)?.hall ?? null
}

export const MOCK_FIRST_TIMERS: SafeFirstTimer[] = [
  { _id: 'mock-ft-01', _type: 'firstTimer', fullName: 'Ese Omoregie', hall: 'Hall D', department: 'Computer Science', level: '100', dateVisited: isoDate(1) },
  { _id: 'mock-ft-02', _type: 'firstTimer', fullName: 'Kingsley Uwaifo', hall: 'Hall A', department: 'Mechanical Engineering', level: '200', dateVisited: isoDate(1) },
  { _id: 'mock-ft-03', _type: 'firstTimer', fullName: 'Nosa Eguavoen', hall: 'Hall B', department: 'Nursing', level: '100', dateVisited: isoDate(8) },
  { _id: 'mock-ft-04', _type: 'firstTimer', fullName: 'Joy Adeyemi', department: 'Economics', level: '300', dateVisited: isoDate(8) },
  { _id: 'mock-ft-05', _type: 'firstTimer', fullName: 'Victor Nwosu', hall: 'Hall E', department: 'Physics', dateVisited: isoDate(15) },
  { _id: 'mock-ft-06', _type: 'firstTimer', fullName: 'Lilian Okafor', hall: 'Hall C', department: 'Medicine & Surgery', level: '200', dateVisited: isoDate(22) },
  { _id: 'mock-ft-07', _type: 'firstTimer', fullName: 'Ofure Idahosa', hall: 'Hall B', department: 'Mass Communication', level: '100', dateVisited: isoDate(36) },
  { _id: 'mock-ft-08', _type: 'firstTimer', fullName: 'Paul Balogun', hall: 'Hall A', department: 'Law', level: '400', dateVisited: isoDate(43) },
]

export const MOCK_WELFARE: SafeWelfareRequest[] = [
  { _id: 'mock-wf-01', _type: 'welfareRequest', name: 'Anonymous student', requestDetails: 'I need help with feeding until my allowance comes at the end of the month.', status: 'Pending', dateSubmitted: isoDateTime(0, 8) },
  { _id: 'mock-wf-02', _type: 'welfareRequest', name: 'Eghosa Obaseki', requestDetails: 'Hospital bill after a malaria admission at the university clinic. About ₦18,000 outstanding.', status: 'Pending', dateSubmitted: isoDateTime(2) },
  { _id: 'mock-wf-03', _type: 'welfareRequest', name: 'Amaka Eze', requestDetails: 'Lost my textbooks and notes in the hostel flood; would appreciate help replacing two course texts.', status: 'Pending', dateSubmitted: isoDateTime(5) },
  { _id: 'mock-wf-04', _type: 'welfareRequest', name: 'Tunde Ogunleye', requestDetails: 'Transport fare home for a family emergency.', status: 'Resolved', dateSubmitted: isoDateTime(12) },
  { _id: 'mock-wf-05', _type: 'welfareRequest', name: 'Ruth Ehigiator', requestDetails: 'Help with exam registration fee shortfall.', status: 'Resolved', dateSubmitted: isoDateTime(30) },
]

export const MOCK_PRAYER_REQUESTS: PrayerRequest[] = [
  { _id: 'mock-pr-01', _type: 'prayerRequest', name: 'Daniel', request: 'Pray for my upcoming GST exams and for clarity of mind.', dateSubmitted: isoDateTime(0, 7) },
  { _id: 'mock-pr-02', _type: 'prayerRequest', request: 'Healing for my mother who is recovering from surgery.', dateSubmitted: isoDateTime(1) },
  { _id: 'mock-pr-03', _type: 'prayerRequest', name: 'Grace O.', request: 'Thanksgiving — I got the scholarship! Please pray for wisdom as I manage it well.', dateSubmitted: isoDateTime(3) },
  { _id: 'mock-pr-04', _type: 'prayerRequest', name: 'Samuel', request: 'Direction about my final-year project and supervisor relationship.', dateSubmitted: isoDateTime(9) },
  { _id: 'mock-pr-05', _type: 'prayerRequest', request: 'Peace in my family and provision for school fees next session.', dateSubmitted: isoDateTime(16) },
]

const SERVICE_ROTATION: AttendanceRow['serviceType'][] = ['Sunday Service', 'Wednesday Bible Study', 'Team Meeting', 'Exco Meeting']

export const MOCK_ATTENDANCE: AttendanceRow[] = Array.from({ length: 14 }, (_, i) => {
  const serviceType = SERVICE_ROTATION[i % SERVICE_ROTATION.length]
  const base = serviceType === 'Sunday Service' ? 310 : serviceType === 'Wednesday Bible Study' ? 140 : serviceType === 'Team Meeting' ? 35 : 14
  return {
    _id: `mock-att-${String(i + 1).padStart(2, '0')}`,
    date: isoDate(i * 3 + 1),
    serviceType,
    totalCount: base + ((i * 17) % 40),
    attendeeCount: serviceType === 'Exco Meeting' ? base : 0,
    loggedBy: { _id: 'mock-worker-hallrep', fullName: 'Ivie Aigbe' },
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
