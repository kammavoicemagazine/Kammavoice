import Link from "next/link";
import {
  Globe,
  MessageCircle,
  Camera,
  Play,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
} from "lucide-react";

const QUICK_LINKS = [
  { href: "/news", label: "Latest News" },
  { href: "/gallery", label: "Photo Gallery" },
  { href: "/videos", label: "Videos & Reels" },
  { href: "/magazine", label: "Magazine" },
  { href: "/about", label: "About Us" },
];

const CATEGORIES = [
  { href: "/category/politics", label: "Politics", labelTe: "రాజకీయాలు" },
  { href: "/category/community", label: "Community", labelTe: "సమాజం" },
  { href: "/category/culture", label: "Culture", labelTe: "సంస్కృతి" },
  { href: "/category/business", label: "Business", labelTe: "వ్యాపారం" },
  { href: "/category/education", label: "Education", labelTe: "విద్య" },
  { href: "/category/sports", label: "Sports", labelTe: "క్రీడలు" },
];

const SOCIALS = [
  { href: "#", icon: Globe, label: "Facebook" },
  { href: "#", icon: MessageCircle, label: "Twitter" },
  { href: "#", icon: Camera, label: "Instagram" },
  { href: "#", icon: Play, label: "YouTube" },
];

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border-subtle hidden lg:block">
      {/* Newsletter Bar */}
      <div className="border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gold-gradient font-[family-name:var(--font-playfair)]">
                Stay Updated | అప్‌డేట్‌గా ఉండండి
              </h3>
              <p className="text-sm text-muted mt-1">
                Get the latest news delivered to your inbox
              </p>
            </div>
            <div className="flex w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-72 px-4 py-2.5 rounded-l-lg bg-[#0A0A0A] border border-border-subtle text-sm text-foreground placeholder-muted focus:outline-none focus:border-gold/40"
                id="newsletter-email"
              />
              <button
                className="px-5 py-2.5 rounded-r-lg bg-gold text-[#0A0A0A] text-sm font-semibold hover:bg-gold-light transition-colors flex items-center gap-1 cursor-pointer"
                id="newsletter-subscribe"
              >
                Subscribe <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gold flex items-center justify-center text-[#0A0A0A] font-bold text-lg font-[family-name:var(--font-playfair)]">
                KV
              </div>
              <div>
                <h2 className="text-lg font-bold text-gold-gradient font-[family-name:var(--font-playfair)]">
                  KAMMA VOICE
                </h2>
                <p className="text-[10px] text-muted tracking-widest">కమ్మ వాయిస్</p>
              </div>
            </div>
            <p className="text-sm text-muted leading-relaxed mb-5">
              Your premier source for Telugu community news, culture, and
              stories. Empowering voices, connecting communities.
            </p>
            <p className="text-sm text-muted leading-relaxed">
              తెలుగు సమాజ వార్తలు, సంస్కృతి మరియు కథల కోసం మీ ప్రధాన మూలం.
            </p>
            {/* Social Icons */}
            <div className="flex gap-3 mt-5">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg bg-[#0A0A0A] border border-border-subtle flex items-center justify-center text-muted hover:text-gold hover:border-gold/40 transition-all"
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
              Categories | విభాగాలు
            </h3>
            <ul className="space-y-2.5">
              {CATEGORIES.map((cat) => (
                <li key={cat.href}>
                  <Link
                    href={cat.href}
                    className="text-sm text-muted hover:text-gold transition-colors"
                  >
                    {cat.label}{" "}
                    <span className="text-[11px] opacity-60">{cat.labelTe}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
              Contact | సంప్రదించండి
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-muted">
                <Mail className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <span>contact@kammavoice.com</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted">
                <Phone className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted">
                <MapPin className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <span>Hyderabad, Telangana, India</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
            <p>© {new Date().getFullYear()} Kamma Voice. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-gold transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-gold transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
