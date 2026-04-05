import Link from "next/link";

const AIRMAIL_BG = `repeating-linear-gradient(
  -45deg,
  var(--postal-red)   0px  6px,
  var(--postal-paper) 6px  8px,
  var(--postal-blue)  8px 14px,
  var(--postal-paper) 14px 16px
)`;

export function Footer() {
  return (
    <footer role="contentinfo" style={{ background: "var(--postal-paper)" }}>
      {/* Airmail stripe — top border of footer */}
      <div
        className="h-1.5"
        style={{ backgroundImage: AIRMAIL_BG }}
        aria-hidden="true"
      />

      {/* Hairline border below the stripe */}
      <div style={{ borderTop: "1px solid var(--postal-ink-faint)" }} />

      <div className="mx-auto max-w-5xl px-6 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left — copyright + tagline */}
        <div className="flex flex-col gap-1">
          <p
            className="text-[11px] tracking-[0.18em] uppercase"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--postal-ink-muted)",
            }}
          >
            &copy; 2026 Postcard
          </p>
          <p
            className="text-[10px] tracking-[0.35em] uppercase"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--postal-ink-faint)",
            }}
          >
            Built for Truth
          </p>
        </div>

        {/* Right — legal links */}
        <nav aria-label="Footer navigation" className="flex items-center gap-5">
          <Link
            href="/privacy"
            className="text-[11px] tracking-[0.15em] uppercase transition-colors duration-100"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--postal-ink-muted)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color =
                "var(--postal-ink)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color =
                "var(--postal-ink-muted)")
            }
          >
            Privacy Policy
          </Link>

          <span
            aria-hidden="true"
            style={{ color: "var(--postal-ink-faint)", fontSize: "10px" }}
          >
            ·
          </span>

          <Link
            href="/terms"
            className="text-[11px] tracking-[0.15em] uppercase transition-colors duration-100"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--postal-ink-muted)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color =
                "var(--postal-ink)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color =
                "var(--postal-ink-muted)")
            }
          >
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
