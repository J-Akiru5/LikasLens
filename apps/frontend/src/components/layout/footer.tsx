import { Leaf } from "lucide-react";
import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact", href: "/contact" },
];

export function Footer() {
  return (
    <footer className="border-t-4 border-primary bg-background font-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-primary">
            <Leaf className="w-5 h-5" />
            <span className="font-heading font-black text-sm uppercase tracking-tighter">
              LikasLens
            </span>
            <span className="font-mono text-xs surface-muted ml-2">
              &copy; {new Date().getFullYear()}
            </span>
          </div>

          <div className="flex items-center gap-6">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-xs font-bold uppercase tracking-wider surface-muted hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t-2 border-primary/10 text-center">
          <p className="font-mono text-xs surface-muted">
            Neuro-symbolic civic reporting platform &mdash; protecting communities through collective intelligence.
          </p>
        </div>
      </div>
    </footer>
  );
}
