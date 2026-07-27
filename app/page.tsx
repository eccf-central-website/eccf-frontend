import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#070d19] text-slate-100 selection:bg-sky-500 selection:text-white">
      {/* Background Ambient Glow Accents (Light Blue / Sky Blue theme) */}
      <div className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[600px] w-full max-w-6xl -translate-x-1/2 rounded-full bg-sky-500/10 blur-[150px]" />
      <div className="pointer-events-none absolute top-[800px] right-0 -z-10 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[130px]" />
      <div className="pointer-events-none absolute top-[1800px] left-0 -z-10 h-[450px] w-[450px] rounded-full bg-sky-400/10 blur-[140px]" />

      {/* ========================================================================= */}
      {/* 2.2 HERO SECTION                                                          */}
      {/* ========================================================================= */}
      <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-20 text-center lg:pt-28 lg:pb-32">
        {/* Welcome Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-950/40 px-4 py-2 text-xs font-semibold text-sky-400 backdrop-blur-md shadow-md shadow-sky-500/10 mb-8">
          <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
          Edo State University Christian Campus Fellowship
        </div>

        {/* Primary Tagline Headline */}
        <h1 className="mx-auto max-w-5xl text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.15]">
          An Assembly Of{' '}
          <span className="bg-gradient-to-r from-sky-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
            Spiritual Dynamites
          </span>{' '}
          And Academic Giants.
        </h1>

        {/* Supporting Tagline Subheadline */}
        <p className="mx-auto mt-6 max-w-3xl text-lg font-medium text-sky-200/90 sm:text-2xl tracking-wide uppercase">
          &ldquo;JESUS IN OUR HEARTS, LETTERS IN OUR HEADS.&rdquo;
        </p>

        {/* Subtitle Description */}
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400 sm:text-lg leading-relaxed">
          Welcome to ECCF — a warm, vibrant community of believer-students at Edo State University dedicated to spiritual depth, kingdom impact, and academic dominance.
        </p>

        {/* Hero CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="#visit"
            className="w-full sm:w-auto rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-sky-500/30 transition-all hover:from-sky-400 hover:to-blue-500 hover:shadow-sky-400/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            Plan a Visit
          </Link>
          <Link
            href="/sermons"
            className="w-full sm:w-auto rounded-full border border-sky-500/30 bg-sky-950/30 px-8 py-4 text-base font-semibold text-slate-200 backdrop-blur-md transition-all hover:bg-sky-500/10 hover:border-sky-400 hover:text-white hover:-translate-y-0.5 active:translate-y-0"
          >
            Explore Sermon Vault 🎙️
          </Link>
        </div>

        {/* Hero Brand Visual Badge */}
        <div className="mt-16 mx-auto flex items-center justify-center gap-4 opacity-90">
          <div className="relative h-16 w-16 overflow-hidden rounded-full border border-sky-500/30 bg-sky-950/40 p-1 shadow-lg shadow-sky-500/20">
            <Image
              src="/logos/ECCF LOGO.png"
              alt="ECCF Official Logo"
              width={64}
              height={64}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.3 WHO WE ARE SECTION                                                    */}
      {/* ========================================================================= */}
      <section id="about" className="relative border-t border-sky-900/30 bg-[#060b14]/70 py-24 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-sky-400 mb-3">
              Who We Are
            </h2>
            <h3 className="text-3xl font-extrabold text-white sm:text-4xl">
              Equipping Students for Spiritual Power & Academic Supremacy
            </h3>
            <p className="mt-4 text-slate-400 text-base">
              At ECCF, we believe spiritual fire and academic excellence are not mutually exclusive. We nurture both with equal diligence.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Card 1: Our Mission */}
            <div className="rounded-2xl border border-sky-900/40 bg-sky-950/20 p-8 backdrop-blur-xl transition-all hover:border-sky-500/50 hover:bg-sky-950/40 hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 text-2xl font-bold mb-6 border border-sky-500/20">
                🎯
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Our Mission</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                To raise a generation of university students grounded in prayer, deeply rooted in the Word, and shining as top academic performers across all faculties.
              </p>
            </div>

            {/* Card 2: Our Vision */}
            <div className="rounded-2xl border border-sky-900/40 bg-sky-950/20 p-8 backdrop-blur-xl transition-all hover:border-sky-500/50 hover:bg-sky-950/40 hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 text-2xl font-bold mb-6 border border-sky-500/20">
                🔥
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Our Vision</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                To transform Edo State University into a hub of revival where students encounter Christ, discover their destiny, and graduate as leaders of influence.
              </p>
            </div>

            {/* Card 3: Core Values */}
            <div className="rounded-2xl border border-sky-900/40 bg-sky-950/20 p-8 backdrop-blur-xl transition-all hover:border-sky-500/50 hover:bg-sky-950/40 hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 text-2xl font-bold mb-6 border border-sky-500/20">
                ⚡
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Core Values</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Spiritual Consecration · Academic Distinction · Authentic Fellowship · Kingdom Leadership · Integrity & Discipline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.4 SERVICE TIMES & LOCATION SECTION                                      */}
      {/* ========================================================================= */}
      <section id="services" className="relative py-24 border-t border-sky-900/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-sky-400 mb-3">
              Gatherings & Services
            </h2>
            <h3 className="text-3xl font-extrabold text-white sm:text-4xl">
              Weekly Service Schedule
            </h3>
            <p className="mt-4 text-slate-400 text-base">
              Join us for high-energy worship, deep biblical exposition, and focused academic prayer sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Service 1 */}
            <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-b from-sky-950/40 to-slate-950/60 p-8 backdrop-blur-xl transition-all hover:border-sky-400 shadow-lg shadow-sky-950/30">
              <div className="inline-block rounded-full bg-sky-500/20 border border-sky-500/30 px-3 py-1 text-xs font-semibold text-sky-300 mb-4">
                Sunday Service
              </div>
              <h4 className="text-2xl font-bold text-white mb-2">Fellowship Service</h4>
              <div className="text-3xl font-black text-sky-400 mb-4">08:00 AM</div>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Our main Sunday celebration featuring powerful worship, practical teaching, and fellowship.
              </p>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 border-t border-sky-900/30 pt-4">
                <span>📍 Venue: Main University Auditorium</span>
              </div>
            </div>

            {/* Service 2 */}
            <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-b from-sky-950/40 to-slate-950/60 p-8 backdrop-blur-xl transition-all hover:border-sky-400 shadow-lg shadow-sky-950/30">
              <div className="inline-block rounded-full bg-sky-500/20 border border-sky-500/30 px-3 py-1 text-xs font-semibold text-sky-300 mb-4">
                Wednesday Service
              </div>
              <h4 className="text-2xl font-bold text-white mb-2">Word Service</h4>
              <div className="text-3xl font-black text-sky-400 mb-4">04:50 PM</div>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Midweek bible study for systematic verse-by-verse teaching and spiritual strengthening.
              </p>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 border-t border-sky-900/30 pt-4">
                <span>📍 Venue: Campus Chapel Hall</span>
              </div>
            </div>

            {/* Service 3 */}
            <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-b from-sky-950/40 to-slate-950/60 p-8 backdrop-blur-xl transition-all hover:border-sky-400 shadow-lg shadow-sky-950/30">
              <div className="inline-block rounded-full bg-sky-500/20 border border-sky-500/30 px-3 py-1 text-xs font-semibold text-sky-300 mb-4">
                Friday Service
              </div>
              <h4 className="text-2xl font-bold text-white mb-2">Academic Challenge / Wonder</h4>
              <div className="text-3xl font-black text-sky-400 mb-4">04:50 PM</div>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Specialized prayer, academic mentoring, study strategy sessions, and miracle prayer.
              </p>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 border-t border-sky-900/30 pt-4">
                <span>📍 Venue: Campus Chapel Hall</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.5 OUR TEAMS & UNITS SECTION                                             */}
      {/* ========================================================================= */}
      <section id="teams" className="relative py-24 border-t border-sky-900/30 bg-[#060b14]/70">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-sky-400 mb-3">
              Find Where You Belong
            </h2>
            <h3 className="text-3xl font-extrabold text-white sm:text-4xl">
              Fellowship Units & Operational Teams
            </h3>
            <p className="mt-4 text-slate-400 text-base">
              Discover your spiritual gifts and serve with excellence alongside fellow student workers.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Choir Unit',
                emoji: '🎵',
                description: 'Leading the fellowship into God’s presence through anointed worship and vocal music.',
              },
              {
                title: 'Drama Unit',
                emoji: '🎭',
                description: 'Communicating kingdom truths through creative stage plays, theatrical drama, and movies.',
              },
              {
                title: 'Prayer Unit',
                emoji: '🔥',
                description: 'Standing in the gap for campus revival, fellowship growth, and academic breakthroughs.',
              },
              {
                title: 'Ushering Unit',
                emoji: '🤝',
                description: 'Creating a warm, organized, and welcoming environment for every service attendee.',
              },
              {
                title: 'Media & Tech Unit',
                emoji: '💻',
                description: 'Managing live streaming, sound engineering, graphic design, website, and social media.',
              },
              {
                title: 'Academic Unit',
                emoji: '📚',
                description: 'Organizing tutorials, study groups, past question archives, and academic mentoring.',
              },
              {
                title: 'Welfare Unit',
                emoji: '❤️',
                description: 'Caring for student needs, supporting first-timers, and extending brotherly love.',
              },
              {
                title: 'Outreach Unit',
                emoji: '🌍',
                description: 'Spearheading campus evangelism, hostel visitation, and community outreaches.',
              },
            ].map((team) => (
              <div
                key={team.title}
                className="group rounded-2xl border border-sky-900/40 bg-sky-950/20 p-6 backdrop-blur-xl transition-all hover:border-sky-400 hover:bg-sky-950/40 hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-2xl mb-4 border border-sky-500/20 group-hover:scale-110 transition-transform">
                  {team.emoji}
                </div>
                <h4 className="text-lg font-bold text-white mb-2 group-hover:text-sky-400 transition-colors">
                  {team.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {team.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.6 PLAN A VISIT (ZERO-FRICTION CTA SECTION)                              */}
      {/* ========================================================================= */}
      <section id="visit" className="relative py-24 border-t border-sky-900/30">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-3xl border border-sky-500/40 bg-gradient-to-br from-sky-950/60 via-[#0a1428] to-slate-950/90 p-8 sm:p-14 backdrop-blur-2xl shadow-2xl shadow-sky-950/50 text-center">
            {/* Background Accent */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-500/20 blur-[100px]" />

            <span className="inline-block rounded-full bg-sky-500/20 border border-sky-500/30 px-4 py-1.5 text-xs font-bold text-sky-300 uppercase tracking-widest mb-6">
              First-Time Visitor?
            </span>

            <h2 className="text-3xl font-black text-white sm:text-5xl tracking-tight leading-tight">
              We Can&apos;t Wait to Welcome You!
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base text-slate-300 leading-relaxed">
              Visiting a new fellowship can feel overwhelming, but at ECCF, you are family from day one. Expect warm smiles, powerful worship, uncompromised Word, and zero awkward pressure.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 text-left max-w-3xl mx-auto">
              <div className="rounded-xl border border-sky-900/40 bg-sky-950/30 p-4">
                <div className="text-xs font-bold text-sky-400 uppercase">Dress Code</div>
                <div className="text-sm font-semibold text-slate-200 mt-1">Modest & Comfortable</div>
              </div>
              <div className="rounded-xl border border-sky-900/40 bg-sky-950/30 p-4">
                <div className="text-xs font-bold text-sky-400 uppercase">Who to Look For</div>
                <div className="text-sm font-semibold text-slate-200 mt-1">Ushers in ECCF Tags</div>
              </div>
              <div className="rounded-xl border border-sky-900/40 bg-sky-950/30 p-4">
                <div className="text-xs font-bold text-sky-400 uppercase">Campus Location</div>
                <div className="text-sm font-semibold text-slate-200 mt-1">Main Chapel Hall</div>
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:edsuchristiancampusfellowship@gmail.com?subject=Planning%20a%20Visit%20to%20ECCF"
                className="w-full sm:w-auto rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-sky-500/30 transition-all hover:from-sky-400 hover:to-blue-500 hover:shadow-sky-400/40 hover:-translate-y-0.5"
              >
                Let Us Know You&apos;re Coming
              </a>
              <Link
                href="/give"
                className="w-full sm:w-auto rounded-full border border-sky-500/30 bg-sky-950/30 px-8 py-4 text-base font-semibold text-slate-200 hover:bg-sky-500/10 hover:text-white"
              >
                Support Ministry (Give)
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
