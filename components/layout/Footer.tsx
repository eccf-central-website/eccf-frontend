/**
 * Footer — Global Footer Component
 *
 * Implements official brand identity, contact email, social links,
 * and navigation links per Section 2.7 of the ECCF UI/UX Design Brief.
 */

import Link from 'next/link'
import Image from 'next/image'

const footerLinks = {
  Ministry: [
    { label: 'Who We Are', href: '/#about' },
    { label: 'Service Times', href: '/#services' },
    { label: 'Our Teams', href: '/#teams' },
    { label: 'Sermon Vault', href: '/sermons' },
    { label: 'Announcements', href: '/announcements' },
  ],
  Connect: [
    { label: 'Plan a Visit', href: '/#visit' },
    { label: 'Give Online', href: '/give' },
    { label: 'Prayer Request', href: '/#visit' },
    { label: 'Contact Us', href: 'mailto:edsuchristiancampusfellowship@gmail.com' },
  ],
  Internal: [
    { label: 'EXCO Portal Login', href: '/dashboard' },
  ],
}

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-sky-900/30 bg-[#040812] text-slate-300">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-sky-500/30 bg-sky-950/40 p-0.5 shadow-md shadow-sky-500/20">
                <Image
                  src="/logos/ECCF LOGO.png"
                  alt="ECCF Logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <span className="block text-lg font-extrabold text-white leading-none">
                  ECCF
                </span>
                <span className="block text-xs font-medium text-sky-400 leading-none mt-1">
                  Edo State University
                </span>
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider text-sky-400/90">
              An Assembly Of Spiritual Dynamites And Academic Giants
            </p>

            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              A vibrant community of believer-students committed to spiritual excellence and academic dominance.
            </p>

            <div className="pt-2">
              <a
                href="mailto:edsuchristiancampusfellowship@gmail.com"
                className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors underline underline-offset-4"
              >
                edsuchristiancampusfellowship@gmail.com
              </a>
            </div>
          </div>

          {/* Nav Categories */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-sky-400">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white hover:underline underline-offset-4"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-sky-900/30 pt-8 sm:flex-row">
          <p className="text-xs text-slate-500">
            &copy; {currentYear} Edo State University Christian Campus Fellowship. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">
            JESUS IN OUR HEARTS, LETTERS IN OUR HEADS.
          </p>
        </div>
      </div>
    </footer>
  )
}
