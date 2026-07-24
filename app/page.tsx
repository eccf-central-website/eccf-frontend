import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Background glow accents */}
      <div className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[500px] w-full max-w-5xl -translate-x-1/2 rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-96 right-10 -z-10 h-[300px] w-[300px] rounded-full bg-blue-600/10 blur-[100px]" />

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-16 text-center lg:pt-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-400 backdrop-blur-md mb-8">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          Welcome to ECCF · Edo State University
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.1]">
          Raising Leaders for <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">God&apos;s Kingdom</span> on Campus
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg">
          Join a vibrant community of believer-students committed to spiritual growth, academic excellence, and kingdom impact at Edo State University.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/sermons"
            className="w-full sm:w-auto rounded-full bg-amber-500 px-8 py-3.5 text-sm font-bold text-[#0a0f1e] shadow-xl shadow-amber-500/25 transition-all hover:bg-amber-400 hover:shadow-amber-400/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            Sermon Vault
          </Link>
          <Link
            href="/give"
            className="w-full sm:w-auto rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            Give Online
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="mx-auto max-w-7xl px-6 py-16 border-t border-white/5">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Sermon Archive */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-md transition-all hover:border-amber-500/30 hover:bg-white/[0.05]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 text-xl font-bold mb-6">
              🎙️
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Advanced Sermon Vault</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Stream messages sorted by Preacher, Topic, Series, and Scripture. Continuous audio playback anywhere on campus.
            </p>
            <Link href="/sermons" className="text-xs font-semibold text-amber-400 hover:text-amber-300">
              Browse Sermons &rarr;
            </Link>
          </div>

          {/* Card 2: Announcements Engine */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-md transition-all hover:border-amber-500/30 hover:bg-white/[0.05]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 text-xl font-bold mb-6">
              📢
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sunday Announcements</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Stay up to date with weekly fellowship updates, unit meeting schedules, and upcoming campus programs.
            </p>
            <Link href="/announcements" className="text-xs font-semibold text-amber-400 hover:text-amber-300">
              View Announcements &rarr;
            </Link>
          </div>

          {/* Card 3: Online Giving */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-md transition-all hover:border-amber-500/30 hover:bg-white/[0.05] sm:col-span-2 lg:col-span-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 text-xl font-bold mb-6">
              💳
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Global Giving Hub</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Support campus ministry, tithes, offerings, and welfare initiatives securely powered by Flutterwave.
            </p>
            <Link href="/give" className="text-xs font-semibold text-amber-400 hover:text-amber-300">
              Support ECCF &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
