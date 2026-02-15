import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative bg-[#0b1220] text-gray-400">

      <div className="max-w-7xl mx-auto px-6 py-20">

        <div className="grid grid-cols-1 md:grid-cols-12 gap-14">

          {/* Brand Section */}
          <div className="md:col-span-4">

            <h3 className="text-white text-2xl font-bold font-montserrat tracking-tight mb-6">
              CampusNest<span className="text-indigo-500">.</span>
            </h3>

            <p className="text-gray-400 leading-relaxed font-raleway max-w-sm">
              A student-first rental platform built for trust, speed, and comfort —
              helping students find verified homes without friction.
            </p>

            <div className="mt-8 h-px w-16 bg-indigo-500/40" />
          </div>

          {/* Links Section */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-12">

            <FooterCol
              title="Explore"
              links={[
                { label: "Find Homes", href: "/explore?verified=false" },
                { label: "Verified Listings", href: "/explore?verified=true" },
              ]}
            />

            <FooterCol
              title="Company"
              links={[
                { label: "About Us", href: "/about" },
                { label: "Support", href: "/contact" },
              ]}
            />

            <FooterCol
              title="Legal"
              links={[
                { label: "Privacy Policy", href: "/privacy-policy" },
                { label: "Terms of Service", href: "/terms-of-service" },
              ]}
            />

          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-poppins text-gray-500">

          <p>
            © {new Date().getFullYear()} CampusNest. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="hover:text-white transition">
              Privacy
            </Link>
            <Link href="/terms-of-service" className="hover:text-white transition">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-white transition">
              Support
            </Link>
          </div>

        </div>
      </div>

    </footer>

  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="text-white font-semibold mb-6 font-poppins tracking-wide text-sm uppercase">
        {title}
      </h4>

      <ul className="space-y-3 text-sm font-raleway">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="group relative inline-block transition text-gray-400 hover:text-white"
            >
              {l.label}
              <span className="absolute left-0 -bottom-1 h-px w-0 bg-indigo-500 transition-all duration-300 group-hover:w-full" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
