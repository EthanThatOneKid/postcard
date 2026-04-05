## Web Quality Audit — Postcard

A comprehensive audit of the Postcard Next.js application following web quality skills.

### Executive Summary

| Category       | Critical | High | Medium | Total |
| -------------- | -------- | ---- | ------ | ----- |
| Accessibility  | 0        | 2    | 3      | **5** |
| Best Practices | 0        | 1    | 2      | **3** |
| Performance    | 0        | 0    | 3      | **3** |
| SEO            | 0        | 0    | 2      | **2** |

---

### Accessibility (5 issues)

#### [High] Input missing label element — WCAG 3.3.2

**Location:** `components/ui/DropZone.tsx:402-426`

The URL input lacks a programmatically associated `<label>`.

```tsx
// Current (❌)
<input type="url" placeholder="...">

// Recommended (✅)
<label>
  <span class="visually-hidden">Post URL</span>
  <input type="url" placeholder="...">
</label>
```

---

#### [High] Error messages not announced to screen readers — WCAG 4.1.3

**Location:** `components/ui/DropZone.tsx:479-492`

Add `role="alert"` or `aria-live="polite"` to error messages.

---

#### [High] Color contrast failure — WCAG 1.4.3

**Location:** `app/globals.css:138` → used in multiple components

`--postal-ink-faint` (#c4b49a) on `--postal-paper` (#fdf6e3) = **1.87:1** (fails AA 4.5:1)

**Usage:**

- ForensicReport.tsx:383, 458, 627 — secondary text
- DropZone.tsx:457 — helper text

**Fix:** Replace with `--postal-ink-muted` (#7a6a52) for 4.96:1, or increase font size to 18px+.

---

#### [Medium] Missing skip link — WCAG 2.4.1

**Location:** `app/layout.tsx`

Add "Skip to main content" link for keyboard navigation.

---

#### [Medium] No prefers-reduced-motion support — WCAG 2.3.3

**Location:** `components/ui/DropZone.tsx`, `components/ui/Hero.tsx`

Motion animations should respect `prefers-reduced-motion: reduce`.

---

### Best Practices (3 issues)

#### [High] Using alert() for user feedback

**Location:** `src/components/forensics/forensic-report.tsx:656`

```tsx
// Current (❌)
alert("Share link copied to clipboard!");

// Recommended (✅)
// Use a toast/snackbar notification instead
```

---

#### [Medium] No focus-visible styles

**Location:** All button elements

Add visible focus indicators for keyboard users.

---

#### [Medium] Missing error boundary

**Location:** N/A

Add React error boundary component for graceful error handling.

---

### Performance (3 issues)

#### [Medium] LCP optimization opportunity

**Location:** `components/ui/Hero.tsx:279`

The hero title should use `fetchpriority="high"` if preloaded.

---

#### [Medium] Font loading delay

**Location:** `app/layout.tsx:6-18`

Ensure `next/font` doesn't cause FOIT (Flash of Invisible Text).

---

#### [Medium] Initial load animations

**Location:** `DropZone.tsx`, `Hero.tsx`

Consider deferring animations until after initial paint.

---

### SEO (2 issues)

#### [Medium] Missing canonical URL

**Location:** `app/layout.tsx`

Add `<link rel="canonical">` to prevent duplicate content.

---

#### [Medium] No structured data

**Location:** `app/layout.tsx`

Consider adding Organization or WebSite schema in JSON-LD.

---

### Priority Order

1. Add `<label>` to input (High)
2. Fix color contrast (High)
3. Add error announcements (High)
4. Replace alert() with toast (High)
5. Add focus-visible styles (Medium)
6. Add skip link (Medium)
7. Add prefers-reduced-motion (Medium)

---

### References

- [Accessibility Skill](.agents/skills/accessibility/SKILL.md)
- [Best Practices Skill](.agents/skills/best-practices/SKILL.md)
- [Core Web Vitals Skill](.agents/skills/core-web-vitals/SKILL.md)
- [Performance Skill](.agents/skills/performance/SKILL.md)
- [Web Quality Audit Skill](.agents/skills/web-quality-audit/SKILL.md)

---

_Audit performed using Lighthouse-based web quality criteria._
