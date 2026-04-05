const AIRMAIL_BG = `repeating-linear-gradient(
  -45deg,
  var(--postal-red)   0px  8px,
  var(--postal-paper) 8px 10px,
  var(--postal-blue) 10px 18px,
  var(--postal-paper) 18px 20px
)`;

export function Footer() {
  return (
    <footer role="contentinfo">
      <div
        className="h-2"
        style={{ backgroundImage: AIRMAIL_BG }}
        aria-hidden="true"
      />
      <div
        style={{
          background: "var(--postal-paper-2)",
          borderTop: "1px solid var(--postal-ink-muted)",
        }}
      >
        <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between flex-wrap gap-4">
          <p
            className="text-[11px] tracking-[0.18em] uppercase"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--postal-ink-muted)",
            }}
          >
            Postcard Forensics &middot; PantherHacks 2026
          </p>

          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 shrink-0"
              style={{ background: "var(--postal-green-near)" }}
              aria-hidden="true"
            />
            <span
              className="text-[11px] tracking-[0.18em] uppercase"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--postal-green-near)",
              }}
            >
              Verified Authenticity
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
