/**
 * Footer — Global footer component
 *
 * Public-facing footer for the ECCF website.
 * Contains site links, social links placeholder, and copyright.
 */

import Link from 'next/link'

const footerLinks = {
  Ministry: [
    {label: 'About Us', href: '/about'},
    {label: 'Our Leadership', href: '/about#leadership'},
    {label: 'Sermons', href: '/sermons'},
    {label: 'Events', href: '/events'},
    {label: 'Announcements', href: '/announcements'},
  ],
  Connect: [
    {label: 'Give Online', href: '/give'},
    {label: 'Prayer Request', href: '/prayer'},
    {label: 'Contact Us', href: '/contact'},
    {label: 'Plan a Visit', href: '/visit'},
  ],
  Internal: [
    {label: 'Exco Dashboard', href: '/dashboard'},
  ],
}

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-white/10 bg-[#0a0f1e]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-[#0a0f1e] shadow-lg shadow-amber-500/20">
                EC
              </div>
              <div>
                <span className="block text-sm font-bold text-white leading-none">ECCF</span>
                <span className="block text-[10px] text-amber-400/80 leading-none tracking-wide mt-0.5">
                  Edo State University
                </span>
              </div>
            </div>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              Edo State University Christian Campus Fellowship — raising leaders for God&apos;s
              kingdom on campus and beyond.
            </p>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-amber-400/80">
                {category}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 transition-colors hover:text-white"
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
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-white/30">
            &copy; {currentYear} Edo State University Christian Campus Fellowship. All rights
            reserved.
          </p>
          <p className="text-xs text-white/20">
            Built with ❤️ by the ECCF Web Dev Team
          </p>
        </div>
      </div>
    </footer>
  )
}
