import Link from "next/link";

const AIRMAIL_SWATCH = `repeating-linear-gradient(
  -45deg,
  var(--postal-red)   0px  4px,
  var(--postal-paper) 4px  6px,
  var(--postal-blue)  6px 10px,
  var(--postal-paper) 10px 12px
)`;

export function Navbar() {
  return (
    <header
      role="banner"
      className="sticky top-0 z-50"
      style={{
        background: "var(--postal-paper)",
        borderBottom: "1px solid var(--postal-ink-faint)",
      }}
    >
      <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className="inline-flex items-center gap-3 min-h-[44px]"
          style={{ textDecoration: "none" }}
        >
          <div
            className="w-5 h-5 shrink-0"
            style={{ backgroundImage: AIRMAIL_SWATCH }}
            aria-hidden="true"
          />
          <span
            className="text-sm tracking-[0.28em] uppercase font-semibold"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--postal-ink)",
            }}
          >
            Postcard
          </span>
        </Link>

        {/* Nav */}
        <nav aria-label="Primary">
          <a
            href="/#why-it-matters"
            className="inline-flex items-center min-h-[44px] px-3 text-[11px] tracking-[0.22em] uppercase"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--postal-ink-muted)",
            }}
          >
            Why It Matters
          </a>
        </nav>

      </div>
    </header>
  );
}
