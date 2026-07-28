import Link from 'next/link'

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-[#00a8ff] selection:text-white">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                          */}
      {/* ========================================================================= */}
      <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-20 text-center md:pt-24 md:pb-28">
        {/* Location Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-xs font-bold text-[#00a8ff] border border-sky-100 mb-8 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#00a8ff]" />
          EDO STATE UNIVERSITY, IYAMHO
        </div>

        {/* Hero Title */}
        <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl md:text-7xl leading-[1.1]">
          Spiritual Dynamites <br className="hidden sm:inline" />
          <span className="text-[#00a8ff]">and Academic Giants.</span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-600 sm:text-lg leading-relaxed">
          A vibrant community of campus students pursuing God&apos;s purpose with academic excellence. You belong here &mdash; whether you&apos;re new on campus or looking for a spiritual family.
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="#visit"
            className="w-full sm:w-auto rounded-full bg-[#00a8ff] hover:bg-[#0092e0] text-white font-bold px-8 py-3.5 shadow-md shadow-sky-500/25 transition-all hover:shadow-sky-500/35 hover:-translate-y-0.5"
          >
            Join the Fellowship
          </Link>
          <Link
            href="/sermons"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full border border-sky-300 bg-white text-[#00a8ff] font-bold px-8 py-3.5 shadow-sm transition-all hover:bg-sky-50 hover:border-sky-400 hover:-translate-y-0.5"
          >
            <span className="text-xs">▶</span> Watch a Sermon
          </Link>
        </div>

        {/* Quick Stats Bar */}
        <div className="mt-16 mx-auto grid max-w-xl grid-cols-3 gap-6 border-t border-slate-200/80 pt-10 text-center">
          <div>
            <div className="text-3xl font-extrabold text-slate-900 sm:text-4xl">400+</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Active Members</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#00a8ff] sm:text-4xl">12</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Weekly Programs</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 sm:text-4xl">5yrs</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Of Impact</div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SERMON VAULT — LATEST MESSAGES                                         */}
      {/* ========================================================================= */}
      <section className="py-20 border-t border-slate-200/60 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#00a8ff]">
                SERMON VAULT
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mt-1">
                Latest Messages
              </h2>
            </div>
            <Link
              href="/sermons"
              className="text-sm font-bold text-[#00a8ff] hover:text-[#0092e0] transition-colors"
            >
              View all &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                tag: 'FAVOUR UNVEILED',
                title: 'Walking in Uncommon Favour',
                speaker: 'Bro. Emmanuel Obi',
                date: 'July 6, 2025',
                duration: '48 min',
                bgGradient: 'from-amber-400/20 to-sky-400/20',
              },
              {
                tag: 'CAMPUS GIANTS',
                title: 'The Discipline of the Anointed Student',
                speaker: 'Sis. Grace Iyamu',
                date: 'June 29, 2025',
                duration: '52 min',
                bgGradient: 'from-indigo-400/20 to-sky-400/20',
              },
              {
                tag: 'POWER & PRAYER',
                title: 'Praying with Authority',
                speaker: 'Bro. Samuel Edosa',
                date: 'June 22, 2025',
                duration: '45 min',
                bgGradient: 'from-emerald-400/20 to-sky-400/20',
              },
            ].map((sermon, idx) => (
              <div
                key={idx}
                className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
              >
                {/* Thumbnail Image placeholder with Play Button */}
                <div className={`relative h-48 w-full bg-gradient-to-br ${sermon.bgGradient} flex items-center justify-center p-4`}>
                  <div className="absolute top-3 right-3 rounded-full bg-slate-900/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1">
                    {sermon.duration}
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00a8ff] text-white text-base shadow-lg group-hover:scale-110 transition-transform">
                    ▶
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#00a8ff]">
                    {sermon.tag}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2 group-hover:text-[#00a8ff] transition-colors leading-snug">
                    {sermon.title}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    {sermon.speaker} &bull; {sermon.date}
                  </p>

                  <Link
                    href="/sermons"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00a8ff] hover:underline"
                  >
                    <span>▶</span> Listen Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. GLOBAL GIVING HUB (CONTRIBUTION COMPONENT)                              */}
      {/* ========================================================================= */}
      <section className="py-20 border-t border-slate-200/60 bg-[#f8fafc]">
        <div className="mx-auto max-w-5xl px-6">
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 grid grid-cols-1 md:grid-cols-2">
            {/* Left Card: Sky Blue Highlight */}
            <div className="bg-[#00a8ff] text-white p-8 sm:p-12 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-sky-100">
                  GLOBAL GIVING HUB
                </span>
                <h2 className="text-3xl font-extrabold mt-3 leading-tight">
                  Support the Vision. <br />
                  Fund the Future.
                </h2>
                <p className="mt-4 text-sky-50 text-sm leading-relaxed">
                  Your seed powers campus outreaches, welfare funds, media production, and discipleship programmes. Every naira counts.
                </p>
              </div>

              <ul className="mt-8 space-y-2 text-xs font-semibold text-sky-100">
                <li className="flex items-center gap-2">✓ Tithes & Offerings</li>
                <li className="flex items-center gap-2">✓ Project Contributions</li>
                <li className="flex items-center gap-2">✓ Welfare Fund</li>
                <li className="flex items-center gap-2">✓ Media Ministry</li>
              </ul>
            </div>

            {/* Right Card: Interactive Payment Form Placeholder */}
            <div className="p-8 sm:p-12 bg-white flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Make a Contribution</h3>

                {/* Category Pills */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Tithe', 'Offering', 'Project', 'Welfare'].map((cat, i) => (
                    <button
                      key={cat}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                        i === 0
                          ? 'bg-[#00a8ff] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Form Fields */}
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="Emmanuel Okonkwo"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-[#00a8ff] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Amount (₦)</label>
                    <input
                      type="number"
                      placeholder="5000"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-[#00a8ff] focus:outline-none"
                    />
                  </div>

                  {/* Preset Amount Pills */}
                  <div className="flex gap-2">
                    {['₦1,000', '₦2,500', '₦5,000', '₦10,000'].map((amt) => (
                      <button
                        key={amt}
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-[#00a8ff] hover:text-[#00a8ff]"
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit CTA Button in Orange */}
              <div>
                <Link
                  href="/give"
                  className="block w-full rounded-xl bg-[#f97316] hover:bg-orange-600 text-white text-center font-bold py-3 text-sm shadow-md transition-all"
                >
                  Give via Flutterwave &rarr;
                </Link>
                <p className="mt-2 text-center text-[10px] text-slate-400">
                  Secured by Flutterwave &bull; SSL Encrypted
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. WHO WE ARE SECTION & SERVICE SCHEDULE                                   */}
      {/* ========================================================================= */}
      <section id="about" className="py-24 border-t border-slate-200/60 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
            {/* Text & Service Grid */}
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#00a8ff]">
                WHO WE ARE
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mt-2 leading-tight">
                A fellowship built on faith, love & excellence.
              </h2>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                ECCF is the campus arm of the Evangelical Church Winning All (ECWA), raised to produce students who are spiritual dynamites and academic giants. We meet weekly for Bible studies, prayer, worship, and outreach on the Edo State University campus.
              </p>

              {/* 2x2 Service Schedule */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="text-[10px] font-bold text-[#00a8ff] uppercase">SUNDAY</div>
                  <div className="text-base font-extrabold text-slate-900 mt-1">9:00 AM</div>
                  <div className="text-xs text-slate-500">Praise & Worship</div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="text-[10px] font-bold text-[#00a8ff] uppercase">TUESDAY</div>
                  <div className="text-base font-extrabold text-slate-900 mt-1">6:00 PM</div>
                  <div className="text-xs text-slate-500">Bible Study</div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="text-[10px] font-bold text-[#00a8ff] uppercase">THURSDAY</div>
                  <div className="text-base font-extrabold text-slate-900 mt-1">6:30 PM</div>
                  <div className="text-xs text-slate-500">Prayer Meeting</div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="text-[10px] font-bold text-[#00a8ff] uppercase">FRIDAY</div>
                  <div className="text-base font-extrabold text-slate-900 mt-1">5:00 PM</div>
                  <div className="text-xs text-slate-500">Outreach</div>
                </div>
              </div>
            </div>

            {/* Visual Photo Cards Collage */}
            <div className="relative space-y-4">
              <div className="overflow-hidden rounded-3xl border border-slate-100 shadow-lg bg-sky-100 h-64 flex items-center justify-center p-6 text-center">
                <p className="text-slate-400 text-sm font-medium">
                  📸 Worship & Fellowship Photography <br />
                  <span className="text-xs text-[#00a8ff] font-bold mt-2 block">
                    EDO STATE UNIVERSITY, IYAMHO
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PLAN A VISIT (CTA SECTION)                                             */}
      {/* ========================================================================= */}
      <section id="visit" className="py-20 border-t border-slate-200/60 bg-[#f8fafc] text-center">
        <div className="mx-auto max-w-3xl px-6">
          <span className="text-xs font-bold uppercase tracking-widest text-[#00a8ff]">
            JOIN US THIS SUNDAY
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mt-2">
            Planning a Visit to ECCF?
          </h2>
          <p className="mt-4 text-sm text-slate-600 leading-relaxed">
            We would love to welcome you in person! Whether you&apos;re a fresh student or a returning scholar, there is a place for you at our table.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:edsuchristiancampusfellowship@gmail.com?subject=Planning%20a%20Visit"
              className="w-full sm:w-auto rounded-full bg-[#00a8ff] hover:bg-[#0092e0] text-white font-bold px-8 py-3.5 shadow-md shadow-sky-500/25 transition-all"
            >
              Plan a Visit
            </a>
            <Link
              href="/give"
              className="w-full sm:w-auto rounded-full border border-slate-300 bg-white text-slate-700 font-bold px-8 py-3.5 hover:bg-slate-50"
            >
              Give Online
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
