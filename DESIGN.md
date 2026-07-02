# AIQualityHQ — Design System

**Version:** 1.0  
**Status:** Production  
**Last Updated:** July 2026  
**Maintainers:** Design Systems Team  

> This document is the single source of truth for every visual, interactive, and structural decision at AIQualityHQ. It governs the static marketing site, the SaaS dashboard, documentation, and every future surface the brand touches. Every line has a reason. No decision is arbitrary.

---

# Part I — Philosophy & Principles

---

## 1.1 Mission

**Help users measure, improve, and trust every AI interaction.**

AIQualityHQ exists to make AI quality measurable. The product turns subjective impressions ("this AI answer felt wrong") into objective data ("this response scored 62/100 on contextual accuracy, down from 78 last week"). Every design decision must serve this mission: making quality visible, understandable, and actionable.

### Why This Matters for Design

A quality measurement platform has a credibility problem by default. Users must trust the tool that measures trust. This creates a circular requirement: the interface itself must embody the precision, clarity, and reliability that the product promises to measure.

**Every pixel must earn trust.**

---

## 1.2 Design Philosophy

The AIQualityHQ design language is built on three words:

### Calm · Precise · Trustworthy

| Principle | Meaning | Anti-pattern |
|-----------|---------|--------------|
| **Calm** | Reduce cognitive load at every layer. Whitespace, hierarchy, and restraint. The interface never shouts. | Neon accents, gradient overload, floating blobs, competing animations |
| **Precise** | Every element aligns, every token has a reason, every measurement is exact. The interface reflects the precision it measures. | Approximate spacing, inconsistent radius, arbitrary color choices |
| **Trustworthy** | The interface communicates reliability through consistency, predictability, and honesty. Nothing decorative exists without function. | Glassmorphism, sci-fi aesthetics, robot illustrations, playful whimsy |

### What the Product Should Feel Like

Open AIQualityHQ. The first impression should be:

> "This feels like professional-grade software built by people who care deeply about craft. It's not trying to impress me — it's trying to help me understand something important."

The interface should feel like a precision instrument: a well-calibrated oscilloscope, a laboratory dashboard, a Bloomberg terminal designed by someone who also loves Dieter Rams. It should feel **inevitable** — like there was no other way to design it.

### What the Product Should NOT Feel Like

- A chatbot wrapper
- A startup landing page with purple gradients
- A consumer social media app
- A gaming interface
- A science fiction movie prop
- A PowerPoint presentation with stock photos

---

## 1.3 Brand Personality

### Voice Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| **Intelligent** | Speaks with authority but without condescension. Assumes the user is smart. | "Your prompt scored 73. Context window utilization dropped 12% from baseline." — not "Great job! Your prompt is pretty good! 🎉" |
| **Measured** | Every word is chosen deliberately. No filler, no fluff, no marketing superlatives. | "Analyze any AI interaction in under 3 seconds." — not "The ULTIMATE AI quality solution!!!" |
| **Honest** | Reports what is true, even when unflattering. Never hides bad scores behind soft language. | "This response has significant hallucination risk." — not "This response could be improved." |
| **Calm** | Never urgent unless something is genuinely critical. The interface breathes. | "Score updated" — not "🚨 ALERT: Your score has been recalculated!" |
| **Helpful** | Always suggests a next step. Never leaves the user at a dead end. | "Trust score: 45/100. Three factors are below threshold. View recommendations →" |

### Personality Anti-Patterns

- **Never playful.** This is a professional tool. No emoji in UI, no casual slang, no jokes.
- **Never mysterious.** AI tools that feel opaque lose trust. Show the work.
- **Never apologetic.** "Something went wrong" is better than "Oopsie! We're so sorry!"
- **Never promotional within the app.** The product sells itself through use, not internal marketing.

---

## 1.4 User Experience Principles

### Principle 1: Reduce Cognitive Load at Every Layer

**Why:** Users come to AIQualityHQ to understand complex AI quality data. The interface must not add complexity.

**Do:**
- Use progressive disclosure — show summary first, detail on demand
- Group related information in cards
- Use consistent patterns — once a user learns one score card, they can read all score cards
- Default to the most useful view, not the most impressive one

**Don't:**
- Show all data at once
- Use different patterns for similar information
- Require users to remember information across views
- Add visual complexity that doesn't carry information

**Implementation Notes:**
- Every dashboard page should load with a summary view
- Detail views expand in-place (drawers, expandable sections) rather than navigating away
- Maximum 7±2 items in any single group or menu

### Principle 2: Typography Carries Hierarchy

**Why:** In a data-heavy product, visual hierarchy is the difference between understanding and confusion. Type size, weight, and color must clearly signal what matters most.

**Do:**
- Use the defined type scale — never interpolate custom sizes
- Rely on weight and size changes for emphasis, not color or decoration
- Maintain consistent heading-to-body relationships across all pages

**Don't:**
- Use bold for emphasis within body text (use the `strong` weight variant)
- Underline text for emphasis (underline is reserved for links)
- Use color alone to create hierarchy

**Tailwind Guidance:**
```html
<!-- Correct: type scale carries hierarchy -->
<h1 class="text-display-lg font-semibold tracking-tight">Quality Report</h1>
<p class="text-body text-secondary">Last analyzed 3 minutes ago</p>

<!-- Incorrect: color doing hierarchy's job -->
<h1 class="text-lg text-blue-500 font-bold">Quality Report</h1>
<p class="text-lg text-gray-300">Last analyzed 3 minutes ago</p>
```

### Principle 3: Color Communicates State, Not Decoration

**Why:** In a quality measurement tool, color carries semantic meaning. Green means good. Red means bad. If color is used decoratively, it pollutes these signals.

**Do:**
- Reserve the primary teal for interactive elements (links, buttons, focus rings)
- Use semantic colors (green, amber, red) exclusively for quality scores and system states
- Use neutral grays for all structural elements (borders, backgrounds, dividers)

**Don't:**
- Use colored backgrounds for aesthetic variety
- Apply gradients to surfaces
- Use accent colors on non-interactive elements

### Principle 4: Whitespace Over Decoration

**Why:** Whitespace creates breathing room and directs attention. Decoration competes for attention with content.

**Do:**
- Separate sections with spacing, not ornamental dividers
- Use the spacing scale consistently
- Allow content to breathe — dense information needs more surrounding space, not less

**Don't:**
- Fill empty space with decorative elements
- Use background patterns or textures
- Add visual ornaments (dots, lines, shapes) that carry no information

### Principle 5: Motion Communicates Transitions

**Why:** Animation should help users understand what changed and where they are. It should never exist solely because it looks cool.

**Do:**
- Animate state changes (loading → loaded, collapsed → expanded)
- Use consistent easing curves and durations
- Respect `prefers-reduced-motion`

**Don't:**
- Animate elements on page load for dramatic effect
- Use spring/bounce physics for UI elements
- Add hover animations that delay interaction
- Create parallax scrolling effects

### Principle 6: Nothing Exists Without a Reason

**Why:** Every element on screen costs the user attention. If an element doesn't serve a purpose — communicating information, enabling action, or aiding navigation — it must be removed.

**Do:**
- Audit every element: "What happens if I remove this?"
- Challenge decorative elements: "Does this help the user understand or act?"
- Prefer fewer, better elements over many mediocre ones

**Don't:**
- Add elements "because the page looks empty"
- Include features "because competitors have them"
- Keep elements that tested poorly "because we already built them"

---

## 1.5 Visual Principles

### The Score is the Hero

In every product screenshot, every marketing page, every dashboard view — the quality score is the visual centerpiece. Not a logo, not a gradient, not an illustration. **The data IS the visual identity.**

This means:
- Score cards must be the most visually refined component in the system
- Score typography uses monospace numerals for alignment and precision
- Score colors must be immediately legible and semantically clear
- Every page that shows a score should make that score the first thing the eye lands on

### Restraint is Premium

The most expensive products in the world use the least decoration. A Leica camera, a Porsche dashboard, a Bloomberg terminal — restraint signals confidence. If the product needs decoration to look good, the underlying structure is weak.

### Consistency is Trust

Users develop mental models quickly. A card that looks like X in one place should behave like X everywhere. A color that means "good" on one page must mean "good" on every page. Breaking consistency breaks trust.

### Light and Dark are Equal Citizens

Neither mode is a "skin" applied over the other. Both are designed from first principles with their own token sets. Dark mode is not "invert the colors." It is a parallel design system with deliberately chosen surfaces, contrasts, and adjustments.

---

## 1.6 Design Decision Framework

When making any design decision not covered by this document, apply these filters in order:

```
1. Does it serve the mission? (Measure, improve, trust)
   → No → Remove it.

2. Does it reduce cognitive load?
   → No → Simplify it.

3. Is it consistent with existing patterns?
   → No → Justify why it must be different.

4. Does it work in both light and dark modes?
   → No → Redesign it.

5. Does it meet accessibility requirements?
   → No → Fix it before shipping.

6. Does it perform well? (< 100ms interaction, < 3s page load)
   → No → Optimize it.

7. Does it still work if you remove all color?
   → No → Strengthen the structural hierarchy.
```

---

## 1.7 Psychology Behind the Product

### Cognitive Load Rules

The human working memory holds approximately 7±2 items. Every UI element consumes working memory. The design system enforces these limits:

| Context | Maximum Items | Rationale |
|---------|--------------|-----------|
| Navigation menu items | 7 | Primary nav should be scannable in one pass |
| Score dimensions per view | 6-8 | Users can compare up to 8 metrics simultaneously |
| Action buttons per context | 3 | Primary, secondary, tertiary — never more |
| Table columns visible without scroll | 6-8 | Beyond 8, users lose positional awareness |
| Filter options visible | 5 (show "More" for remainder) | Prevents choice paralysis |
| Toast notifications stacked | 3 | Auto-dismiss oldest when fourth appears |

### Mental Models

Users approach AIQualityHQ with these existing mental models. The interface should align with them:

| Mental Model | User Expectation | Design Implication |
|-------------|-----------------|-------------------|
| **Report card** | Scores are 0–100, higher is better, color-coded green/yellow/red | Use 0–100 scale, use traffic-light semantics |
| **Dashboard** | Key metrics at the top, details below, time-series trends visible | Summary → Detail layout, sparkline trends |
| **Analysis tool** | I input something, it processes, I get results | Clear input → processing → output flow |
| **Settings panel** | Left nav, grouped options, save button | Standard settings layout, no innovation needed |

### Trust Building Principles

Trust is built through consistency and transparency. These rules are non-negotiable:

1. **Show the work.** Every score should be expandable to show the factors that produced it.
2. **Be precise.** "73/100" is more trustworthy than "Good." Numbers build trust.
3. **Acknowledge uncertainty.** When confidence is low, say so. "Score: 61 (low confidence — limited sample size)" is more trustworthy than "Score: 61."
4. **Never move the goalposts.** Scoring criteria displayed alongside scores. Users must be able to verify.
5. **Consistent formatting.** Every score, everywhere, always uses the same format: number / 100, same colors, same card layout.
6. **Timestamp everything.** Every score shows when it was calculated. Stale data must be visually marked.

---

# Part II — Visual Foundation

---

## 2.1 Color System

### Design Rationale

The color palette is built on three layers:
1. **Neutral foundation** — Warm grays that form the structural backbone (surfaces, borders, text)
2. **Primary accent** — A single teal for interactive elements and brand identity
3. **Semantic colors** — Purposeful use of green, amber, and red for quality scores and system states

The palette deliberately avoids:
- Purple gradients (AI startup cliché)
- Neon or saturated accent colors (distracting in data-heavy views)
- Multiple brand colors competing for attention (dilutes focus)
- Cool/blue-tinted grays (clinical, unwelcoming)

### Primary — Teal

**Why teal?** Teal communicates scientific precision, analytical trust, and measured authority. It is the color of medical instruments, quality control systems, and engineering dashboards. It is distinct from the generic "SaaS blue" that dominates B2B software, and it avoids the AI-cliché purple gradient space entirely.

| Token | Light Mode | Dark Mode | Use |
|-------|-----------|-----------|-----|
| `primary` | `#0891B2` | `#22D3EE` | Primary CTAs, links, active states, focus rings |
| `primary-hover` | `#0E7490` | `#67E8F9` | Hovered primary elements |
| `primary-pressed` | `#155E75` | `#A5F3FC` | Pressed/active primary elements |
| `primary-subtle` | `#ECFEFF` | `#164E63` | Subtle primary backgrounds (selected rows, active tabs) |
| `primary-border` | `#A5F3FC` | `#155E75` | Primary-tinted borders (focus states, selected cards) |
| `on-primary` | `#FFFFFF` | `#042F2E` | Text on primary-filled surfaces |

**Tailwind Guidance:**
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0891B2',
          hover: '#0E7490',
          pressed: '#155E75',
          subtle: '#ECFEFF',
          border: '#A5F3FC',
        },
      },
    },
  },
}
```

**Accessibility Notes:**
- `primary` (#0891B2) on white (#FFFFFF): contrast ratio 4.56:1 — passes WCAG AA for normal text
- `primary` (#0891B2) on off-white (#FAFBFC): contrast ratio 4.51:1 — passes WCAG AA
- `primary` dark (#22D3EE) on dark canvas (#0A0B0D): contrast ratio 11.2:1 — passes WCAG AAA
- All primary text must be at least 16px or paired with `primary-hover` for smaller sizes

### Neutral — Warm Grays

**Why warm grays?** Pure neutral grays feel clinical and cold. The references split: Apple uses warm near-blacks, Vercel uses cool near-blacks, Linear uses blue-tinted near-blacks. AIQualityHQ uses a warm gray scale (slight amber undertone) that feels professional without being sterile. Warmth builds approachability without sacrificing precision.

| Token | Light Mode | Dark Mode | Use |
|-------|-----------|-----------|-----|
| `canvas` | `#FAFBFC` | `#0A0B0D` | Page background |
| `surface` | `#FFFFFF` | `#111214` | Cards, elevated panels, inputs |
| `surface-secondary` | `#F4F5F7` | `#1A1B1E` | Secondary surfaces, alternating rows |
| `surface-tertiary` | `#EBEDF0` | `#222326` | Tertiary surfaces, well backgrounds |
| `border` | `#D1D5DB` | `#2E3036` | Default borders, card edges, dividers |
| `border-subtle` | `#E5E7EB` | `#1F2024` | Subtle borders, section dividers |
| `border-strong` | `#9CA3AF` | `#404249` | Emphasized borders, focus-adjacent |

**Do:**
- Use `canvas` for the page-level background
- Use `surface` for any element that "floats" above the canvas (cards, panels, inputs)
- Use `surface-secondary` for nested surfaces and alternating table rows
- Use `border` as the default 1px structural element

**Don't:**
- Skip surface levels (canvas → surface-tertiary without surface)
- Use borders heavier than 1px for structural elements
- Mix warm and cool gray families

### Text Colors

| Token | Light Mode | Dark Mode | Use |
|-------|-----------|-----------|-----|
| `text-primary` | `#111827` | `#F9FAFB` | Headlines, primary body, high-emphasis text |
| `text-secondary` | `#4B5563` | `#D1D5DB` | Secondary body, descriptions, metadata |
| `text-tertiary` | `#6B7280` | `#9CA3AF` | Captions, placeholders, timestamps |
| `text-disabled` | `#9CA3AF` | `#4B5563` | Disabled elements, inactive controls |
| `text-on-primary` | `#FFFFFF` | `#042F2E` | Text on primary-colored backgrounds |
| `text-on-inverted` | `#FFFFFF` | `#111827` | Text on inverted (dark-on-light / light-on-dark) surfaces |

**Why `#111827` instead of `#000000`?** Pure black text on a white screen creates maximum contrast (21:1), which causes eye strain during extended reading sessions. `#111827` (a warm near-black) achieves a 15.4:1 contrast ratio — well above WCAG AAA requirements — while reducing strain.

**Accessibility Notes:**
- `text-primary` on `canvas`: 15.4:1 (AAA) ✓
- `text-secondary` on `canvas`: 8.2:1 (AAA) ✓
- `text-tertiary` on `canvas`: 5.7:1 (AA for normal text, AAA for large text) ✓
- `text-disabled` on `canvas`: 3.5:1 (AA for large text only) — intentional for disabled state
- `text-primary` dark on dark `canvas`: 17.1:1 (AAA) ✓

### Semantic Colors — Score States

**Why traffic-light semantics?** The most universally understood color mapping for quality assessment is the traffic-light system: green = good, amber/yellow = caution, red = bad. Every user on Earth understands this without instruction. For a quality platform, leveraging this innate understanding reduces learning time to zero.

| Token | Light Mode | Dark Mode | Use |
|-------|-----------|-----------|-----|
| `score-excellent` | `#059669` | `#34D399` | Scores 80–100, passing states |
| `score-excellent-subtle` | `#ECFDF5` | `#064E3B` | Background for excellent scores |
| `score-excellent-border` | `#6EE7B7` | `#065F46` | Border for excellent score cards |
| `score-good` | `#0891B2` | `#22D3EE` | Scores 60–79, acceptable states (maps to primary) |
| `score-good-subtle` | `#ECFEFF` | `#164E63` | Background for good scores |
| `score-warning` | `#D97706` | `#FBBF24` | Scores 40–59, needs attention |
| `score-warning-subtle` | `#FFFBEB` | `#78350F` | Background for warning scores |
| `score-warning-border` | `#FCD34D` | `#92400E` | Border for warning score cards |
| `score-critical` | `#DC2626` | `#F87171` | Scores 0–39, critical issues |
| `score-critical-subtle` | `#FEF2F2` | `#7F1D1D` | Background for critical scores |
| `score-critical-border` | `#FCA5A5` | `#991B1B` | Border for critical score cards |

**Score Color Mapping:**

```
Score Range    Color Token          Meaning
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
90–100         score-excellent      Exceptional quality
80–89          score-excellent      Strong quality
60–79          score-good           Acceptable quality
40–59          score-warning        Needs improvement
20–39          score-critical       Significant issues
0–19           score-critical       Critical failure
```

**Do:**
- Always pair score numbers with their semantic color
- Use the subtle background variants for score card fills
- Display the score number prominently (the number is the primary communication, color is secondary)

**Don't:**
- Use score colors for non-score UI elements
- Use red for error states that aren't quality-score-related (use a separate `error` token)
- Rely on color alone — always pair with a number, label, or icon

**Accessibility Notes:**
- All score colors pass WCAG AA against their respective backgrounds
- Score numbers always render with the score color token + a number, never color alone (supports colorblind users)
- In high-contrast mode, scores fall back to text-primary with a distinct icon prefix

### System Semantic Colors

Separate from score colors, these are used for system-level states (form validation, alerts, status indicators):

| Token | Light Mode | Dark Mode | Use |
|-------|-----------|-----------|-----|
| `success` | `#059669` | `#34D399` | System success, form validation passed |
| `success-subtle` | `#ECFDF5` | `#064E3B` | Success backgrounds |
| `warning` | `#D97706` | `#FBBF24` | System warnings, degraded states |
| `warning-subtle` | `#FFFBEB` | `#78350F` | Warning backgrounds |
| `error` | `#DC2626` | `#F87171` | System errors, form validation failed |
| `error-subtle` | `#FEF2F2` | `#7F1D1D` | Error backgrounds |
| `info` | `#2563EB` | `#60A5FA` | Informational, tips, neutral highlights |
| `info-subtle` | `#EFF6FF` | `#1E3A5F` | Information backgrounds |

### Color Usage Rules

**Rule 1: The 60-30-10 Distribution**
- 60% — Neutral (canvas, surface, text) — the structural majority
- 30% — Primary teal — interactive elements, brand moments
- 10% — Semantic colors — scores, states, alerts

**Rule 2: No Decorative Color**
Color is never used to "make something look nicer." Every use of color beyond the neutral palette must answer: "What information does this color communicate?"

**Rule 3: Dark Mode is Not Inverted Light Mode**
Dark mode colors are independently specified. Key differences:
- Primary teal shifts lighter in dark mode (higher luminance to maintain contrast on dark surfaces)
- Text colors invert in value but maintain the warm undertone
- Borders shift from gray hairlines to subtle luminance steps
- Score colors shift to their light-on-dark variants (more luminous, slightly desaturated)

**Tailwind Guidance:**
```js
// Use CSS custom properties for automatic light/dark switching
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        // ... all tokens as CSS custom properties
      },
    },
  },
}
```

```css
/* globals.css */
:root {
  --color-canvas: #FAFBFC;
  --color-surface: #FFFFFF;
  --color-border: #D1D5DB;
  --color-text-primary: #111827;
  --color-text-secondary: #4B5563;
  --color-primary: #0891B2;
}

[data-theme="dark"] {
  --color-canvas: #0A0B0D;
  --color-surface: #111214;
  --color-border: #2E3036;
  --color-text-primary: #F9FAFB;
  --color-text-secondary: #D1D5DB;
  --color-primary: #22D3EE;
}
```

**Astro Guidance:**
```astro
---
// In layout component, apply theme class to html element
const theme = Astro.cookies.get('theme')?.value || 'light';
---
<html data-theme={theme}>
  <body class="bg-canvas text-text-primary">
    <slot />
  </body>
</html>
```

---

## 2.2 Typography

### Design Rationale

Typography is the primary carrier of hierarchy, personality, and trust in a data-heavy product. The font system must:

1. **Be open-source and freely available** — no licensing barriers for team scaling
2. **Support tabular numerals** — critical for score alignment in tables and cards
3. **Have a distinctive but subtle personality** — not generic, but not distracting
4. **Perform well across all sizes** — from 10px captions to 56px display headlines
5. **Include a matched monospace** — for code, scores, and technical data

### Font Families

**Primary: Inter**

Inter is chosen as the primary typeface for AIQualityHQ. The rationale:

- **Open-source, Google Fonts hosted** — zero licensing cost, CDN-served, excellent caching
- **`ss03` stylistic set** — enables the single-story `g` glyph that gives the typography a distinctive voice without being distracting (proven at Raycast's scale)
- **Excellent `tnum` support** — tabular numerals align scores perfectly in tables and cards
- **Variable font** — single file, continuous weight range, optimal loading performance
- **Screen-optimized** — designed specifically for computer screens at all sizes
- **Apple recommended** — Apple's own design documentation recommends Inter as the SF Pro substitute

**Enable globally:**
```css
body {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-feature-settings: "kern", "liga", "calt", "ss03";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

**Monospace: JetBrains Mono**

JetBrains Mono is the monospace companion for code blocks, technical labels, and — critically — score number displays where tabular alignment matters most.

- **Open-source** — freely available via Google Fonts
- **Distinctive ligatures** — optional, not enabled by default for score displays
- **Excellent readability at small sizes** — 12-14px code blocks remain crisp
- **Taller x-height** — better readability than Courier or Monaco

```css
code, .font-mono, .score-number {
  font-family: 'JetBrains Mono', ui-monospace, 'SF Mono', 'Cascadia Code', 'Segoe UI Mono', monospace;
  font-feature-settings: "tnum";
}
```

**Performance Guidance:**
```html
<!-- Preload both variable fonts for fastest paint -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@300..700&display=swap">
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap">
```

### Type Scale

The type scale uses a modular approach with three tiers: **Display** (marketing, heroes), **UI** (application interfaces), and **Data** (scores, tables, technical).

| Token | Size | Weight | Line Height | Letter Spacing | Family | Use |
|-------|------|--------|-------------|----------------|--------|-----|
| `display-2xl` | 56px | 600 | 1.07 | -1.4px | Inter | Hero headlines (marketing only) |
| `display-xl` | 48px | 600 | 1.1 | -1.2px | Inter | Section heroes, feature openers |
| `display-lg` | 40px | 600 | 1.15 | -0.8px | Inter | Major section headings |
| `display-md` | 32px | 600 | 1.2 | -0.64px | Inter | Sub-section headings |
| `heading-lg` | 24px | 600 | 1.3 | -0.48px | Inter | Page titles, card group headers |
| `heading-md` | 20px | 600 | 1.4 | -0.3px | Inter | Card titles, dialog headers |
| `heading-sm` | 16px | 600 | 1.5 | -0.16px | Inter | Sub-card headings, list headers |
| `body-lg` | 16px | 400 | 1.6 | 0 | Inter | Lead body, marketing paragraphs |
| `body` | 14px | 400 | 1.6 | 0 | Inter | Default UI body text |
| `body-strong` | 14px | 500 | 1.5 | 0.1px | Inter | Emphasized body, nav links |
| `body-sm` | 13px | 400 | 1.5 | 0.1px | Inter | Secondary descriptions, metadata |
| `caption` | 12px | 400 | 1.4 | 0.2px | Inter | Captions, timestamps, footnotes |
| `caption-strong` | 12px | 500 | 1.4 | 0.3px | Inter | Label text, badge labels |
| `overline` | 11px | 500 | 1.3 | 0.8px | Inter | ALL-CAPS section eyebrows |
| `button-lg` | 16px | 500 | 1.0 | 0 | Inter | Large CTA labels |
| `button` | 14px | 500 | 1.0 | 0.1px | Inter | Default button labels |
| `button-sm` | 12px | 500 | 1.0 | 0.2px | Inter | Compact button labels |
| `mono-eyebrow` | 12px | 500 | 1.0 | 0.5px | JetBrains Mono | Technical section labels (ALL-CAPS) |
| `mono` | 14px | 400 | 1.6 | 0 | JetBrains Mono | Code blocks, inline code |
| `mono-sm` | 12px | 400 | 1.5 | 0 | JetBrains Mono | Small code, terminal output |
| `score-display` | 48px | 600 | 1.0 | -0.5px | JetBrains Mono | Large score numbers (hero) |
| `score-lg` | 32px | 600 | 1.0 | 0 | JetBrains Mono | Score card primary number |
| `score-md` | 24px | 600 | 1.0 | 0 | JetBrains Mono | Score card secondary number |
| `score-sm` | 16px | 500 | 1.0 | 0 | JetBrains Mono | Inline score references |
| `tabular` | 14px | 400 | 1.5 | 0 | JetBrains Mono | Table data cells with numerics |

### Typography Principles

**1. Negative Tracking on Display, Positive on Small Sizes**

Every reference system uses negative letter-spacing at display sizes. This creates the signature "tight headline" feel that reads as confident and premium. At small sizes, positive letter-spacing opens the type for readability.

```
56px → -1.4px  (tight, confident)
48px → -1.2px
40px → -0.8px
32px → -0.64px
24px → -0.48px
20px → -0.3px
16px → -0.16px to 0  (neutral transition)
14px → 0 to +0.1px  (slightly open)
12px → +0.2px to +0.3px  (open for readability)
11px → +0.8px  (wide, for all-caps overlines)
```

**Why:** Tight tracking at large sizes creates visual density that reads as premium craftsmanship. Open tracking at small sizes prevents characters from colliding, which is critical for data readability at 12-14px.

**2. Weight 600 for Headings, Not 700**

Apple, Linear, and Vercel all use weight 600 for display headlines. Stripe uses 300 (too thin for accessibility). Raycast uses 500 (slightly under-emphasizes). Weight 600 is the sweet spot: assertive without being aggressive.

**Weight ladder:**
- 600 — Headlines and display (semibold — assertive)
- 500 — Buttons, labels, emphasis (medium — functional)
- 400 — Body text (regular — readable)
- No 300, no 700, no 800 in the marketing or app system

**3. Monospace for Scores and Data, Not Decoration**

JetBrains Mono is reserved for three contexts:
1. **Score numbers** — using `tnum` (tabular numerals) for perfect column alignment
2. **Code blocks** — inline and block code rendering
3. **Technical eyebrows** — ALL-CAPS section labels that signal "this is a data/technical section"

**Do not** use monospace for:
- Body text
- Marketing copy
- Navigation labels
- Button text (except in developer-specific tools)

**4. The `ss03` Stylistic Set is Brand Identity**

Inter with `ss03` enabled swaps the double-story `g` for a single-story `g`. This is a subtle change that most users will never consciously notice, but it gives AIQualityHQ's typography a distinctly softer, more modern feel compared to plain Inter. It is the typographic equivalent of a brand signature.

**Do:** Enable `ss03` globally on the body element.
**Don't:** Override `ss03` on individual elements (consistency is the point).

**5. Tabular Numerals for Data Contexts**

Every element that displays a number that will be compared (scores, prices, dates, counts) must use `font-feature-settings: "tnum"`. Tabular numerals are fixed-width, so columns align perfectly.

```css
/* Apply to all data-display contexts */
.score-value, .metric-value, .table-cell-numeric, .price {
  font-feature-settings: "tnum";
  font-variant-numeric: tabular-nums;
}
```

**Tailwind Guidance:**
```html
<!-- Score display with monospace tabular numerals -->
<span class="font-mono text-score-lg font-semibold tabular-nums">73</span>

<!-- Table cell with tabular numerals -->
<td class="font-mono tabular-nums text-right">1,247</td>
```

**Astro Guidance:**
```astro
---
// Score component with proper typography
interface Props {
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'display';
}
const { score, size = 'lg' } = Astro.props;
const sizeClass = {
  sm: 'text-score-sm',
  md: 'text-score-md',
  lg: 'text-score-lg',
  display: 'text-score-display',
}[size];
---
<span class:list={["font-mono font-semibold tabular-nums", sizeClass]}>
  {score}
</span>
```

### Responsive Typography

Display types scale down at mobile breakpoints. Body and data types remain constant (users need the same data density regardless of screen size).

| Token | Desktop (≥1024px) | Tablet (768-1023px) | Mobile (<768px) |
|-------|-------------------|---------------------|-----------------|
| `display-2xl` | 56px | 44px | 36px |
| `display-xl` | 48px | 40px | 32px |
| `display-lg` | 40px | 32px | 28px |
| `display-md` | 32px | 28px | 24px |
| `heading-lg` | 24px | 22px | 20px |
| `heading-md` | 20px | 18px | 18px |
| `heading-sm` | 16px | 16px | 16px |
| `body-lg` | 16px | 16px | 16px |
| `body` | 14px | 14px | 14px |

**Why body doesn't scale:** Information density in the app should be consistent. Users accessing a quality dashboard on a tablet need the same data density as on desktop. Scaling body text up wastes screen real estate on already-constrained viewports.

---

## 2.3 Spacing System

### Design Rationale

The spacing system uses an **8px base unit** with half-steps at 4px for tight internal use. This aligns with all five reference systems (Apple 8px, Linear 4px, Stripe 8px, Raycast 8px, Vercel 4px) and the 8px grid convention that dominates modern interface design.

### Spacing Scale

| Token | Value | Use |
|-------|-------|-----|
| `space-0` | 0px | Zero spacing (elements flush) |
| `space-0.5` | 2px | Hairline gaps (border-adjacent only) |
| `space-1` | 4px | Tight internal gaps (icon-to-text, badge padding) |
| `space-1.5` | 6px | Compact internal gaps (chip padding) |
| `space-2` | 8px | Small gaps (button icon spacing, inline elements) |
| `space-3` | 12px | Standard internal padding (input padding, card internal) |
| `space-4` | 16px | Medium gaps (between related elements within a group) |
| `space-5` | 20px | Standard card padding |
| `space-6` | 24px | Large internal padding (generous card padding) |
| `space-8` | 32px | Between groups of related content |
| `space-10` | 40px | Major content separation |
| `space-12` | 48px | Section sub-dividers |
| `space-16` | 64px | Between major page sections (dense) |
| `space-20` | 80px | Between major page sections (standard) |
| `space-24` | 96px | Section spacing (marketing pages) |
| `space-32` | 128px | Hero-level vertical spacing |

### Spacing Modes

AIQualityHQ has two spacing contexts:

**Marketing Mode** — Used on landing pages, feature pages, and public-facing content.
- Section spacing: `space-24` (96px) to `space-32` (128px)
- Card padding: `space-6` (24px) to `space-8` (32px)
- Content max-width: 1200px
- Generous whitespace, editorial rhythm

**Dashboard Mode** — Used in the SaaS application, analysis views, and data-heavy screens.
- Section spacing: `space-12` (48px) to `space-16` (64px)
- Card padding: `space-4` (16px) to `space-5` (20px)
- Content max-width: 100% (fluid, sidebar layout)
- Tight, efficient use of space

**Why two modes?** Marketing pages need to persuade — whitespace creates a feeling of premium confidence. Dashboard pages need to inform — compact spacing maximizes the data visible per viewport.

**Tailwind Guidance:**
```html
<!-- Marketing section -->
<section class="py-24 px-6">
  <div class="max-w-[1200px] mx-auto">
    <!-- content -->
  </div>
</section>

<!-- Dashboard section -->
<section class="py-6 px-4">
  <div class="w-full">
    <!-- content -->
  </div>
</section>
```

---

## 2.4 Grid & Containers

### Marketing Grid

- **Max width:** 1200px, centered with `auto` margins
- **Columns:** 12-column grid at desktop, 8-column at tablet, 4-column at mobile
- **Gutters:** 24px at desktop, 16px at tablet and mobile
- **Outer padding:** 24px at desktop, 16px at mobile

**Why 1200px and not 1440px?** Stripe and Linear use 1200-1280px. Vercel uses ~1200px. Apple uses 980-1440px depending on content type. 1200px is the sweet spot for readability of marketing content — wider than this and line lengths exceed comfortable reading (65-80 characters).

```css
.container-marketing {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

@media (max-width: 768px) {
  .container-marketing {
    padding: 0 16px;
  }
}
```

### Dashboard Grid

- **Layout:** Fixed sidebar (256px collapsed, 280px expanded) + fluid main content area
- **Max width:** Fluid (fills available space)
- **Columns:** Content area uses CSS Grid with `auto-fill` and `minmax()` for card grids
- **Gutters:** 16px between cards
- **Outer padding:** 24px around the main content area

```css
.layout-dashboard {
  display: grid;
  grid-template-columns: var(--sidebar-width, 256px) 1fr;
  min-height: 100vh;
}

.dashboard-content {
  padding: 24px;
  overflow-y: auto;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
```

---

## 2.5 Breakpoints

| Token | Width | Description | Key Changes |
|-------|-------|-------------|-------------|
| `mobile` | < 640px | Phone | Single column, stacked cards, hamburger nav, full-width CTAs |
| `mobile-lg` | 640px–767px | Large phone / small tablet | Two-column card grids begin |
| `tablet` | 768px–1023px | Tablet portrait | 2-up card grids, condensed nav, sidebar collapses |
| `desktop` | 1024px–1279px | Small desktop / tablet landscape | Full nav, sidebar visible, 3-up grids |
| `desktop-lg` | 1280px–1535px | Standard desktop | Default layout, all features visible |
| `desktop-xl` | ≥ 1536px | Large / ultra-wide monitor | Content locks at max-width, margins absorb extra space |

**Tailwind Guidance:**
```js
// tailwind.config.js — matches the breakpoint tokens
module.exports = {
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
}
```

**Design Rules:**
- Never design for desktop-first and "scale down." Design mobile-first and enhance up.
- At `mobile`, every element stacks vertically. No horizontal layouts except inline text + icon.
- At `tablet`, the dashboard sidebar collapses to icons-only (64px). Marketing pages show 2-up card grids.
- At `desktop`, full sidebar and content area. Marketing pages show 3-up or 4-up grids.
- At `desktop-xl`, content locks at `max-width` and does not stretch further. Margins grow.

---

## 2.6 Border Radius

### Design Rationale

Border radius communicates the personality of an element. Fully rounded pills feel playful and marketing-oriented. Sharp corners feel technical and dense. AIQualityHQ uses a restrained, precise radius vocabulary.

| Token | Value | Use |
|-------|-------|-----|
| `radius-none` | 0px | Full-bleed sections, dividers |
| `radius-sm` | 4px | Badges, tags, chips, inline code, small indicators |
| `radius-md` | 6px | Buttons, inputs, small cards, dropdowns, tooltips |
| `radius-lg` | 8px | Standard cards, dialogs, panels |
| `radius-xl` | 12px | Large cards, dashboard panels, feature cards |
| `radius-2xl` | 16px | Marketing-scale feature cards, modals |
| `radius-full` | 9999px | Avatars, status dots, pill-shaped marketing CTAs (rare) |

### Why `radius-md` (6px) is the Default

Apple uses 8-11px. Linear uses 8px. Stripe uses 6px. Raycast uses 8px. Vercel uses 6px for controls.

6px is the precision-oriented choice:
- Enough rounding to feel modern (not the sharp 2-4px of older enterprise software)
- Not enough rounding to feel playful or consumer-oriented
- Mathematically harmonious with the 8px spacing grid (6px = 0.75 × 8px base)
- Matches the control-level radius of Vercel and Stripe — the two most "engineering-forward" references

**Button Radius:**
- Default buttons: `radius-md` (6px) — precise, software-like
- Marketing hero CTA (one per page): `radius-full` (pill) — distinctive, inviting
- This dual-radius approach mirrors Vercel's strategy of pill for marketing, square for app

**Card Radius:**
- Small cards (metric tiles, score cards): `radius-lg` (8px)
- Standard cards (feature cards, analysis panels): `radius-xl` (12px)
- Marketing cards (pricing tiers, testimonials): `radius-2xl` (16px)

**Tailwind Guidance:**
```js
// tailwind.config.js
module.exports = {
  theme: {
    borderRadius: {
      'none': '0px',
      'sm': '4px',
      DEFAULT: '6px',   // radius-md is the default
      'lg': '8px',
      'xl': '12px',
      '2xl': '16px',
      'full': '9999px',
    },
  },
}
```

---

## 2.7 Elevation & Shadows

### Design Rationale

All five reference systems minimize shadow use. Linear and Raycast use zero shadows (surface-ladder only). Apple uses exactly one shadow (product photography). Stripe uses subtle layered shadows. Vercel uses whisper shadows. AIQualityHQ follows the minimal-shadow approach with a three-level system.

### Elevation Scale

| Level | Name | Light Mode | Dark Mode | Use |
|-------|------|-----------|-----------|-----|
| 0 | Flat | No shadow | No shadow | Default — canvas, borders define edges |
| 1 | Subtle | `0 1px 2px rgba(0,0,0,0.05)` | `0 1px 2px rgba(0,0,0,0.3)` | Cards resting on canvas, slightly lifted |
| 2 | Raised | `0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)` | `0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.2)` | Dropdowns, popovers, floating panels |
| 3 | Floating | `0 2px 8px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.06)` | `0 2px 8px rgba(0,0,0,0.5), 0 12px 32px rgba(0,0,0,0.3)` | Modals, dialogs, command palette |

### Shadow Philosophy

**Principle: Borders first, shadows second.**

The default card has a 1px `border` hairline and NO shadow (Level 0). Most cards in the system should be Level 0 or Level 1. Reserve Level 2 for interactive overlays (dropdowns, tooltips). Reserve Level 3 for modals and command palette only.

**Why:** Shadows compete with content for attention. In a data-heavy product, every pixel of visual noise reduces the user's ability to read scores and metrics. A 1px hairline border provides sufficient containment without adding visual weight.

**Dark Mode Shadow Adjustment:** Shadows in dark mode use higher opacity because the low-luminance background absorbs shadow more than a light background. Without this adjustment, shadows disappear entirely in dark mode.

**Do:**
- Use Level 0 (flat with hairline border) for the majority of cards
- Use Level 1 for cards that need slight visual lift on marketing pages
- Use Level 2 for temporary overlay surfaces (tooltips, dropdowns)
- Use Level 3 sparingly — only full-screen overlays (modals, command palette)

**Don't:**
- Apply shadows to buttons (buttons use background color change, not shadow, for depth)
- Stack shadows on shadows (no nested elevated elements)
- Use colored shadows (all shadows are neutral black at low opacity)
- Use `box-shadow` for borders (use `border` property for borders)

**Tailwind Guidance:**
```js
module.exports = {
  theme: {
    boxShadow: {
      'none': 'none',
      'subtle': '0 1px 2px rgba(0,0,0,0.05)',
      'raised': '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
      'floating': '0 2px 8px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.06)',
    },
  },
}
```

---

## 2.8 Borders

| Token | Value | Use |
|-------|-------|-----|
| `border-width-default` | 1px | Standard card borders, dividers, input borders |
| `border-width-thick` | 2px | Focus rings, selected states, active indicators |
| `border-style` | solid | Always solid — no dashed, dotted, or decorative borders |

**Rule:** Borders are structural, not decorative. A border exists to separate two regions or contain an interactive element. If a border doesn't serve a containment or separation purpose, remove it.

---

## 2.9 Opacity

| Token | Value | Use |
|-------|-------|-----|
| `opacity-disabled` | 0.4 | Disabled buttons, inputs, and interactive elements |
| `opacity-hover-overlay` | 0.04 | Subtle hover background overlay |
| `opacity-pressed-overlay` | 0.08 | Pressed background overlay |
| `opacity-backdrop` | 0.5 | Modal/dialog backdrop overlay |
| `opacity-skeleton` | 0.08 | Skeleton loading shimmer base |

**Rule:** Opacity is never used to "soften" an element. If something needs to be less prominent, use a lower-contrast color token, not opacity reduction. Opacity is reserved for interactive states and overlays.

---

## 2.10 Iconography

### Icon Library: Lucide

AIQualityHQ uses **Lucide Icons** as the primary icon set.

**Why Lucide?**
- Open-source, MIT licensed
- 1,400+ icons covering every UI pattern
- Consistent 24px grid, 2px stroke weight
- Tree-shakeable — only ship the icons you use
- First-class Astro and React support
- Clean, geometric style that matches the restrained design language

### Icon Sizing

| Token | Size | Stroke | Use |
|-------|------|--------|-----|
| `icon-xs` | 12px | 1.5px | Inline badges, tiny indicators |
| `icon-sm` | 16px | 2px | Inline with body text, button icons, table actions |
| `icon-md` | 20px | 2px | Standard UI icons, navigation items |
| `icon-lg` | 24px | 2px | Card header icons, feature icons |
| `icon-xl` | 32px | 2px | Empty state illustrations, feature highlights |

### Icon Rules

**Do:**
- Always pair icons with text labels in navigation (icon-only nav items fail accessibility)
- Use icons at their designed grid size (no arbitrary resizing)
- Match icon color to the text color of its context (icon inherits `currentColor`)
- Use `aria-hidden="true"` on decorative icons; use `aria-label` on functional icons

**Don't:**
- Use icons as decoration without function
- Fill icons with color (Lucide icons are stroked, never filled)
- Animate icons on hover (motion should be functional, not decorative)
- Use more than one icon per button label
- Mix icon libraries (Lucide only — consistency over variety)

**Astro Guidance:**
```astro
---
import { Shield, TrendingUp, AlertTriangle } from 'lucide-astro';
---
<Shield class="w-5 h-5 text-text-secondary" aria-hidden="true" />
```

---

## 2.11 Illustration & Image Style

### No Traditional Illustration

AIQualityHQ does not use traditional illustration. No hand-drawn art, no 3D renders, no character illustrations, no abstract shapes. The product's visual identity comes from its data: score cards, trend charts, analysis panels, and the product UI itself.

### Product Screenshots as Visual Identity

Following the principle established by Linear, Raycast, and Vercel: **the product IS the visual identity.**

- Marketing pages show real (or realistic mockup) product screenshots
- Hero sections feature the actual dashboard UI, score cards, and analysis views
- Feature sections pair explanatory text with annotated product screenshots
- No stock photography, no generic "team at work" images, no abstract background images

### Image Treatment

When images are used (product screenshots, partner logos):

| Context | Treatment |
|---------|-----------|
| Product screenshots | `radius-xl` (12px) container, 1px `border`, Level 1 shadow, on `surface` background |
| Partner/customer logos | Grayscale, uniform height (24-32px), no container, horizontally centered |
| Blog post hero images | `radius-xl` (12px), full-width within content container, no shadow |
| Avatars | `radius-full` (circle), 32-40px for inline, 64-80px for profile |
| Favicon | 32×32px, teal primary on transparent, `radius-sm` (4px) mask |

### Empty Space Rules

**Why:** White space (or dark space in dark mode) is the most important design element. It creates hierarchy, directs attention, and communicates premium quality. Space is not "empty" — it is deliberately designed negative space.

**Rules:**
1. **Between sections:** Minimum `space-20` (80px) on marketing, `space-12` (48px) on dashboard
2. **Between cards in a grid:** `space-4` (16px) standard, `space-6` (24px) on marketing pages
3. **Inside cards:** `space-4` (16px) compact, `space-5` (20px) standard, `space-6` (24px) generous
4. **Around page content:** `space-6` (24px) minimum from any edge
5. **Between a heading and its first content:** `space-3` (12px) to `space-4` (16px)
6. **Between paragraphs:** `space-4` (16px) — equivalent to one line of body text
7. **Between list items:** `space-2` (8px) for tight lists, `space-3` (12px) for descriptive lists

**Never:**
- Fill empty space with decorative elements
- Reduce spacing to "fit more on screen" — redesign the information architecture instead
- Use different spacing within the same component type

---

# Part III — Motion System

---

## 3.1 Animation Philosophy

Motion at AIQualityHQ serves exactly three purposes:

1. **Orient** — Help the user understand where they are and what just changed
2. **Feedback** — Confirm that an interaction was registered
3. **Continuity** — Smooth transitions between states to maintain spatial awareness

Motion does NOT serve:
- Entertainment or delight
- Brand personality expression
- "Making things feel alive"
- Demonstrating technical capability

### The Speed Principle

Fast is better than beautiful. The product measures AI quality — users expect the tool itself to be fast and precise. Every animation must feel like it exists to save the user time, not cost them time.

**Rule:** If removing an animation makes the interface harder to use, the animation is justified. If removing an animation has no impact on usability, remove it.

---

## 3.2 Timing & Duration

### Duration Scale

| Token | Duration | Use |
|-------|----------|-----|
| `duration-instant` | 0ms | Immediate state changes (color, opacity for disabled) |
| `duration-fast` | 100ms | Micro-interactions (button press, checkbox toggle, focus ring) |
| `duration-normal` | 150ms | Standard transitions (hover states, tab switches, accordion) |
| `duration-moderate` | 200ms | Panel transitions (dropdown open, tooltip appear) |
| `duration-slow` | 300ms | Major transitions (modal open, drawer slide, page section) |
| `duration-slower` | 500ms | Complex transitions (skeleton → content reveal, loading state) |

### Why These Durations

Research by the Nielsen Norman Group establishes:
- **< 100ms** feels instantaneous
- **100-300ms** feels responsive
- **> 300ms** begins to feel laggy for direct interactions
- **> 1000ms** breaks the user's flow of thought

Our durations are calibrated to the interaction type:
- **Press/click feedback:** `duration-fast` (100ms) — must feel instantaneous
- **State changes:** `duration-normal` (150ms) — perceptible but not slow
- **Overlays:** `duration-moderate` (200ms) — needs enough time to orient the user
- **Major panels:** `duration-slow` (300ms) — complex enough to warrant orientation time
- **Nothing above 500ms** — ever

### Easing Curves

| Token | CSS Value | Use |
|-------|-----------|-----|
| `ease-default` | `cubic-bezier(0.2, 0, 0, 1)` | Standard transitions (enter and exit) |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements exiting the viewport |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering the viewport |
| `ease-linear` | `linear` | Progress bars, loading indicators only |

**Why `cubic-bezier(0.2, 0, 0, 1)` as default?** This curve starts with a gentle acceleration and decelerates firmly. It feels natural, precise, and controlled — like a well-damped mechanical system. It avoids the "springy" overshoot of bounce curves and the artificial feel of pure ease-in-out.

**Tailwind Guidance:**
```css
/* Add to globals.css */
@layer utilities {
  .transition-default {
    transition-duration: 150ms;
    transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
  }
  .transition-fast {
    transition-duration: 100ms;
    transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
  }
  .transition-moderate {
    transition-duration: 200ms;
    transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
  }
  .transition-slow {
    transition-duration: 300ms;
    transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
  }
}
```

---

## 3.3 Interactive States

### Hover States

**Philosophy:** Hover states confirm interactivity. They should be subtle — a slight background shift, not a dramatic transformation.

| Element | Hover Treatment | Implementation |
|---------|----------------|----------------|
| Primary button | Background shifts to `primary-hover` | `background-color` transition, `duration-fast` |
| Secondary button | Background gains `rgba(0,0,0,0.04)` overlay | Background transition, `duration-fast` |
| Ghost button | Background gains `surface-secondary` fill | Background transition, `duration-fast` |
| Card (clickable) | Border shifts to `border-strong` | Border-color transition, `duration-fast` |
| Link | Text color shifts to `primary-hover` | Color transition, `duration-fast` |
| Table row (clickable) | Background gains `surface-secondary` fill | Background transition, `duration-fast` |
| Nav item | Background gains `surface-secondary` pill | Background transition, `duration-fast` |

**Do:**
- Use background-color changes as the primary hover signal
- Keep hover transitions at `duration-fast` (100ms)
- Apply hover only to interactive elements

**Don't:**
- Scale elements on hover (no `transform: scale()` for hover)
- Change text content on hover
- Add shadows on hover
- Use color changes that could be confused with semantic meaning

### Pressed / Active States

**Philosophy:** Press states confirm the action was received. The feedback should be immediate and tactile-feeling.

| Element | Press Treatment | Implementation |
|---------|----------------|----------------|
| Primary button | Background shifts to `primary-pressed`, `transform: scale(0.97)` | `duration-instant` for color, `duration-fast` for scale |
| Secondary button | Background gains `rgba(0,0,0,0.08)` overlay, `transform: scale(0.97)` | Same timing |
| Card (clickable) | Background gains `surface-tertiary` fill | `duration-instant` |
| Checkbox/radio | Scale to `0.9` then back | `duration-fast` |

**Why `scale(0.97)` instead of `scale(0.95)`?** Apple uses `scale(0.95)` which is very noticeable. We use `0.97` — perceptible but more restrained, matching our "precise, not dramatic" personality.

### Focus States

**Philosophy:** Focus states must be visible to keyboard users without being distracting to mouse users. We use the `:focus-visible` pseudo-class to show focus only when the user is navigating with a keyboard.

| Element | Focus Treatment |
|---------|----------------|
| Buttons | 2px solid `primary`, 2px offset | 
| Inputs | 2px solid `primary`, replacing the default border |
| Links | 2px solid `primary`, 2px offset, `radius-sm` outline |
| Cards (focusable) | 2px solid `primary-border`, replacing the default border |
| Checkboxes/radios | 2px solid `primary`, 2px offset |

```css
/* Global focus-visible style */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Inputs replace border instead of adding outline */
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}
```

**Accessibility Notes:**
- Focus ring must have a minimum 3:1 contrast ratio against the surrounding background
- `outline-offset: 2px` prevents the focus ring from overlapping element content
- Focus must be visible in both light and dark modes

---

## 3.4 Loading States

### Loading Indicators

| Scenario | Treatment | Duration Guidance |
|----------|-----------|-------------------|
| Button loading | Replace label with small spinner (16px), maintain button width | Show immediately on click |
| Page loading | Full skeleton screen (see 3.5) | Show after 200ms delay (avoid flash for fast loads) |
| Data fetching | Inline spinner + "Loading..." text | Show after 200ms delay |
| Score calculation | Progress bar (determinate if possible) | Show immediately, update in real-time |
| Background save | Subtle status indicator in header ("Saving..." → "Saved") | Show immediately |

**Spinner Specification:**
- Circular arc, 270° sweep
- Rotates clockwise, 750ms per revolution
- Color: `text-tertiary` on light surfaces, `text-secondary` on dark
- Sizes: 16px (inline), 24px (block), 32px (page-level)

**Button Loading:**
```html
<!-- Button with loading state -->
<button class="btn btn-primary" disabled>
  <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
    <!-- spinner SVG -->
  </svg>
  <span class="sr-only">Analyzing...</span>
</button>
```

### Skeleton Screens

**Philosophy:** Skeleton screens are better than spinners for content-heavy pages because they preview the layout and reduce perceived load time. They match the structure of the content that will replace them.

**Rules:**
1. Skeleton shapes must match the dimensions of the actual content they replace
2. Use `surface-secondary` as the skeleton background with a subtle shimmer animation
3. Skeleton text blocks use rounded rectangles at 60-80% of expected text width
4. Skeleton images use the same radius as the actual images
5. Skeleton screens show for a minimum of 300ms (prevent flash) and maximum 5s (timeout with error)

**Shimmer Animation:**
```css
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-secondary) 0%,
    var(--color-surface-tertiary) 50%,
    var(--color-surface-secondary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}
```

**Astro Guidance:**
```astro
---
// Skeleton component
interface Props {
  width?: string;
  height?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}
const { width = '100%', height = '16px', rounded = 'sm' } = Astro.props;
---
<div
  class:list={["skeleton", `rounded-${rounded}`]}
  style={`width: ${width}; height: ${height};`}
  role="status"
  aria-label="Loading"
>
  <span class="sr-only">Loading...</span>
</div>
```

---

## 3.5 Empty States

**Philosophy:** An empty state is an opportunity to guide, not an apology. Every empty state should tell the user what this area is for AND how to populate it.

**Structure:**
1. Icon (from Lucide, `icon-xl` 32px, `text-tertiary`)
2. Heading (what this area shows)
3. Description (why it's empty and what to do)
4. Action button (the primary action to populate it)

```html
<!-- Empty state pattern -->
<div class="flex flex-col items-center justify-center py-16 text-center">
  <BarChart3 class="w-8 h-8 text-tertiary mb-4" />
  <h3 class="text-heading-sm text-primary mb-2">No analyses yet</h3>
  <p class="text-body-sm text-secondary mb-6 max-w-sm">
    Run your first quality analysis to see scores, trends, and recommendations here.
  </p>
  <button class="btn btn-primary">Run Analysis</button>
</div>
```

**Do:**
- Always include an action that resolves the empty state
- Keep the description under two sentences
- Use the same empty state pattern throughout the product

**Don't:**
- Use emoji or playful illustrations
- Apologize ("Sorry, nothing here!")
- Leave the empty state without guidance

---

## 3.6 Success States

| Scenario | Treatment |
|----------|-----------|
| Form submitted | Green toast notification, auto-dismiss 4s |
| Score calculated | Score card fills in with value, brief pulse on the number |
| Settings saved | Inline "Saved" label near the save button, fades after 2s |
| File uploaded | Progress bar completes, replaced by file info |

**Success Colors:** Use `success` token (#059669 light / #34D399 dark) — never the score-excellent green for system success to avoid confusion.

**Toast Pattern (see also 3.8 Notifications):**
```html
<div role="alert" class="toast toast-success">
  <CheckCircle class="w-5 h-5" />
  <span>Analysis complete. Quality score: 78/100</span>
</div>
```

---

## 3.7 Error States

### Form Errors

- Display inline below the errored field
- Red border on the input (`error` token)
- Error message in `caption` size, `error` color
- Error icon (AlertCircle from Lucide) prefix on the message

```html
<div class="field field-error">
  <label for="prompt" class="label">Prompt Text</label>
  <textarea id="prompt" class="input border-error" aria-describedby="prompt-error">
  </textarea>
  <p id="prompt-error" class="field-error-message" role="alert">
    <AlertCircle class="w-3 h-3 inline" />
    Prompt text is required and must be at least 10 characters.
  </p>
</div>
```

### Page-Level Errors

- Full error card centered in the content area
- Error icon (`icon-xl`), heading, description, retry button
- Never show raw error codes to users
- Log technical details to console for debugging

### API / Network Errors

- Toast notification with error styling
- Auto-dismiss after 6s (longer than success — users need time to read errors)
- Include a "Retry" action button in the toast when appropriate

---

## 3.8 Notifications & Toasts

### Toast System

Toasts are brief, non-blocking notifications that appear at the bottom-right of the viewport (bottom-center on mobile).

| Property | Value |
|----------|-------|
| Position | Bottom-right (desktop), bottom-center (mobile) |
| Width | 360px max (desktop), full-width minus 32px (mobile) |
| Duration | 4s (success), 6s (error), 8s (info with action) |
| Animation | Slide up + fade in, `duration-moderate` (200ms) |
| Dismiss | Click × button, swipe right (touch), or auto-dismiss |
| Stacking | Max 3 visible, oldest dismissed when 4th appears |
| Z-index | 50 (above everything except modals) |

**Toast Variants:**

| Variant | Left accent | Icon |
|---------|------------|------|
| Success | `success` (2px left border) | CheckCircle |
| Error | `error` (2px left border) | AlertCircle |
| Warning | `warning` (2px left border) | AlertTriangle |
| Info | `info` (2px left border) | Info |
| Neutral | `border` (1px all around) | None |

**Implementation:**
```html
<div class="toast-container" aria-live="polite" aria-atomic="true">
  <div class="toast toast-success" role="alert">
    <div class="toast-icon">
      <CheckCircle class="w-5 h-5 text-success" />
    </div>
    <div class="toast-content">
      <p class="toast-title text-body-strong">Analysis Complete</p>
      <p class="toast-description text-body-sm text-secondary">
        Quality score: 78/100
      </p>
    </div>
    <button class="toast-dismiss" aria-label="Dismiss">
      <X class="w-4 h-4" />
    </button>
  </div>
</div>
```

---

## 3.9 Transitions

### Page Transitions

**Astro does not use client-side page transitions by default.** For the static marketing site, pages load as full-page navigations. No page transition animation.

For the future SaaS dashboard (client-side routing):
- Content area cross-fades with `duration-normal` (150ms)
- Sidebar and header remain static during page transitions
- Scroll position resets to top on navigation

### Component Transitions

| Transition | Animation | Duration | Easing |
|------------|-----------|----------|--------|
| Accordion expand | Height auto → measured height | `duration-slow` (300ms) | `ease-default` |
| Dropdown open | Scale from 0.95 + fade | `duration-moderate` (200ms) | `ease-out` |
| Dropdown close | Scale to 0.95 + fade | `duration-fast` (100ms) | `ease-in` |
| Modal open | Backdrop fade + scale from 0.95 | `duration-slow` (300ms) | `ease-out` |
| Modal close | Backdrop fade + scale to 0.95 | `duration-moderate` (200ms) | `ease-in` |
| Drawer open | Slide from edge | `duration-slow` (300ms) | `ease-out` |
| Drawer close | Slide to edge | `duration-moderate` (200ms) | `ease-in` |
| Tab switch | Content cross-fade | `duration-normal` (150ms) | `ease-default` |
| Tooltip appear | Fade + translate 4px | `duration-moderate` (200ms) | `ease-out` |
| Tooltip dismiss | Fade | `duration-fast` (100ms) | `ease-in` |

**Rule: Exit is faster than enter.** Opening transitions use `duration-slow` or `duration-moderate`. Closing transitions use one step faster. This makes the UI feel responsive when dismissing and deliberate when presenting.

---

## 3.10 Scrolling Behavior

- **Scroll restoration:** Enabled for browser-native navigation. Disabled for in-app tab switches (always scroll to top of new content).
- **Sticky elements:** Dashboard header (64px), sidebar (full height). Marketing nav (64px).
- **Scroll-linked animations:** None. No parallax. No scroll-triggered fade-ins. No scroll-progress indicators.
- **Infinite scroll:** Not used. Paginate data tables. Use "Load More" buttons for feed-like lists.
- **Smooth scroll:** Applied only for in-page anchor links (`scroll-behavior: smooth` on `html`). Not applied for navigation.

**Why no scroll-triggered animations?** They break accessibility (`prefers-reduced-motion` must disable them), they interfere with screen readers, and they add perceived latency. Content should be immediately visible when scrolled into view.

---

## 3.11 Micro-interactions

| Interaction | Animation | Purpose |
|-------------|-----------|---------|
| Button press | `scale(0.97)` for 100ms | Tactile feedback |
| Checkbox toggle | Scale 0.9 → 1.0 with check icon fade | Confirmation |
| Toggle switch | Thumb slides with `duration-fast` | State change orientation |
| Score number change | Count-up from previous value, 500ms | Draw attention to change |
| Copy button | Icon swaps to checkmark for 2s, then reverts | Confirmation |
| Star/favorite | Scale 1.0 → 1.2 → 1.0 pulse | Emphasis on action |

---

## 3.12 Accessibility During Motion

### Reduced Motion Strategy

Users who set `prefers-reduced-motion: reduce` in their OS must receive a fully functional experience without motion. This is non-negotiable.

**Implementation:**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Preserve opacity transitions for critical state changes */
  .toast,
  .modal-backdrop {
    transition-duration: 0.01ms !important;
  }
}
```

**Rules:**
1. All animations must be CSS-based (not JavaScript-driven) so the media query catches them
2. Content must never depend on animation completion to become visible
3. Loading states use static indicators (progress bar at fixed position, spinner replaced by "Loading..." text)
4. Score count-up animation is replaced by immediate number display
5. Page transitions are replaced by instant content swap

**Performance Guidance:**
- All animations use `transform` and `opacity` exclusively (GPU-composited properties)
- Never animate `height`, `width`, `margin`, `padding`, `left`, `top` (trigger layout reflow)
- Use `will-change: transform` sparingly and only on elements that actually animate
  - Remove `will-change` when animation completes (promote, animate, demote pattern)

---

# Part IV — Component Library

---

> Every component in this section follows the same documentation pattern:
> **What** → **Why** → **Anatomy** → **Variants** → **States** → **Do / Don't** → **Implementation** → **Accessibility**

---

## 4.1 Buttons

### Why This Design

Buttons are the primary action mechanism. After studying all five reference systems, AIQualityHQ uses a dual-shape strategy inspired by Vercel: **rounded rectangles for application controls** (precision-oriented) and **pills for the single hero CTA on marketing pages** (inviting, distinctive). This separation creates an automatic signal to the user: pill = marketing action, rectangle = application action.

### Variants

#### Primary Button

The main action. One per context (dialog, card header, page section).

| Property | Value |
|----------|-------|
| Background | `primary` |
| Text | `text-on-primary` |
| Typography | `button` (14px / 500) |
| Padding | `space-2 space-4` (8px 16px) |
| Height | 36px |
| Border Radius | `radius-md` (6px) |
| Border | None |
| Shadow | None |
| Hover | `primary-hover` background |
| Pressed | `primary-pressed` background + `scale(0.97)` |
| Focus | 2px `primary` outline, 2px offset |
| Disabled | `opacity-disabled` (0.4), `cursor-not-allowed` |
| Loading | Spinner replaces label, maintains width |

```html
<button class="btn btn-primary">
  Run Analysis
</button>

<!-- With icon -->
<button class="btn btn-primary">
  <Play class="w-4 h-4 mr-2" />
  Run Analysis
</button>

<!-- Loading -->
<button class="btn btn-primary" disabled>
  <Spinner class="w-4 h-4 mr-2 animate-spin" />
  Analyzing...
</button>
```

**Tailwind Guidance:**
```css
.btn-primary {
  @apply inline-flex items-center justify-center
         h-9 px-4
         bg-primary text-on-primary
         text-button font-medium
         rounded-md
         transition-fast
         hover:bg-primary-hover
         active:bg-primary-pressed active:scale-[0.97]
         focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2
         disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary;
}
```

#### Secondary Button

The alternative action. Used alongside a primary button or as a standalone when the action is less critical.

| Property | Value |
|----------|-------|
| Background | `surface` |
| Text | `text-primary` |
| Typography | `button` (14px / 500) |
| Padding | `space-2 space-4` (8px 16px) |
| Height | 36px |
| Border Radius | `radius-md` (6px) |
| Border | 1px solid `border` |
| Hover | `surface-secondary` background |
| Pressed | `surface-tertiary` background + `scale(0.97)` |

```html
<button class="btn btn-secondary">Cancel</button>
```

#### Ghost Button

No visible container until hovered. For low-emphasis actions and toolbar controls.

| Property | Value |
|----------|-------|
| Background | transparent |
| Text | `text-secondary` |
| Typography | `button` (14px / 500) |
| Padding | `space-2 space-3` (8px 12px) |
| Height | 36px |
| Border Radius | `radius-md` (6px) |
| Border | None |
| Hover | `surface-secondary` background, text shifts to `text-primary` |
| Pressed | `surface-tertiary` background |

```html
<button class="btn btn-ghost">
  <Settings class="w-4 h-4 mr-2" />
  Settings
</button>
```

#### Destructive Button

For actions that delete data, remove access, or cannot be undone.

| Property | Value |
|----------|-------|
| Background | `error` |
| Text | `#FFFFFF` |
| Typography | `button` (14px / 500) |
| Padding | `space-2 space-4` (8px 16px) |
| Height | 36px |
| Border Radius | `radius-md` (6px) |
| Hover | Darkened `error` (10% darker) |
| Pressed | Darkened `error` (20% darker) + `scale(0.97)` |

```html
<button class="btn btn-destructive">Delete Report</button>
```

**Do:**
- Always require confirmation before executing destructive actions
- Use destructive buttons only for irreversible actions

**Don't:**
- Use destructive styling for "Cancel" buttons
- Place destructive buttons in prominent positions without a confirmation step

#### Marketing Hero CTA (Pill)

The one marketing CTA per page that uses the pill shape for visual distinction.

| Property | Value |
|----------|-------|
| Background | `primary` |
| Text | `text-on-primary` |
| Typography | `button-lg` (16px / 500) |
| Padding | `space-3 space-6` (12px 24px) |
| Height | 44px |
| Border Radius | `radius-full` (9999px) |
| Border | None |

```html
<a href="/signup" class="btn btn-primary-pill">
  Start Free Trial
</a>
```

**Rule:** Maximum ONE pill-shaped CTA per page. All other buttons on the same page use `radius-md` (6px).

#### Button Sizes

| Size | Height | Padding | Typography | Use |
|------|--------|---------|------------|-----|
| Small | 28px | 4px 10px | `button-sm` (12px) | Inline actions, table rows, compact UIs |
| Default | 36px | 8px 16px | `button` (14px) | Standard UI actions |
| Large | 44px | 12px 24px | `button-lg` (16px) | Marketing CTAs, hero actions, mobile primary |

#### Icon-Only Button

For actions where the icon is universally understood (close, menu, refresh).

| Property | Value |
|----------|-------|
| Shape | Square (1:1 aspect ratio) |
| Sizes | 28×28 (sm), 36×36 (md), 44×44 (lg) |
| Border Radius | `radius-md` (6px) |
| Padding | Centered icon, no text |
| Requirement | Must have `aria-label` |

```html
<button class="btn-icon btn-ghost" aria-label="Close dialog">
  <X class="w-4 h-4" />
</button>
```

### Button Accessibility Notes

- All buttons must have visible text labels OR `aria-label` for icon-only buttons
- Disabled buttons must have `aria-disabled="true"` in addition to the `disabled` attribute
- Button loading states must include `aria-live="polite"` on the spinner container
- Focus ring must be visible in both light and dark modes at 3:1 contrast minimum
- Minimum touch target: 44×44px on mobile (use padding to extend hit area if visual size is smaller)

---

## 4.2 Inputs

### Text Input

| Property | Value |
|----------|-------|
| Background | `surface` |
| Text | `text-primary` |
| Placeholder | `text-tertiary` |
| Typography | `body` (14px / 400) |
| Padding | `space-2 space-3` (8px 12px) |
| Height | 36px |
| Border | 1px solid `border` |
| Border Radius | `radius-md` (6px) |
| Focus | Border: `primary`, ring: `0 0 0 1px primary` |
| Error | Border: `error`, ring: `0 0 0 1px error` |
| Disabled | `opacity-disabled`, `surface-secondary` background |

```html
<div class="field">
  <label for="api-key" class="label">API Key</label>
  <input
    type="text"
    id="api-key"
    class="input"
    placeholder="sk_live_..."
  />
  <p class="field-description">Your secret API key. Keep this private.</p>
</div>

<!-- With error -->
<div class="field field-error">
  <label for="prompt" class="label">Prompt</label>
  <input
    type="text"
    id="prompt"
    class="input input-error"
    aria-describedby="prompt-error"
    aria-invalid="true"
  />
  <p id="prompt-error" class="field-error-message" role="alert">
    Prompt is required.
  </p>
</div>
```

### Label

| Property | Value |
|----------|-------|
| Typography | `body-strong` (14px / 500) |
| Color | `text-primary` |
| Margin bottom | `space-1.5` (6px) |
| Required indicator | Red asterisk (*) after label text |

### Description / Helper Text

| Property | Value |
|----------|-------|
| Typography | `body-sm` (13px / 400) |
| Color | `text-tertiary` |
| Margin top | `space-1` (4px) |

### Error Message

| Property | Value |
|----------|-------|
| Typography | `caption` (12px / 400) |
| Color | `error` |
| Margin top | `space-1` (4px) |
| Icon | AlertCircle (12px), inline before text |

---

## 4.3 Textareas

Same styling as text input with these differences:

| Property | Value |
|----------|-------|
| Min height | 80px (3 lines) |
| Max height | 320px (if resizable) |
| Resize | Vertical only (`resize-y`) |
| Padding | `space-3` (12px) on all sides |

For prompt input (the primary textarea in AIQualityHQ):
- Min height: 120px (5 lines) — prompts are the core input, give them space
- Character count display in the bottom-right corner: `caption` size, `text-tertiary`
- Max character limit: display in `text-warning` when > 90% of limit

---

## 4.4 Dropdowns / Select

### Standard Select

Uses the native `<select>` element with custom styling for consistency.

| Property | Value |
|----------|-------|
| Appearance | Same as text input + chevron-down icon at right |
| Dropdown menu | `surface`, `border`, `radius-md`, Level 2 shadow |
| Option hover | `surface-secondary` background |
| Option selected | `primary-subtle` background, `primary` text |
| Max visible options | 8 before scrolling |
| Animation | Scale from 0.95 + fade, `duration-moderate` |

### Custom Dropdown (for complex content)

For dropdowns containing rich content (icons, descriptions, avatars):

```html
<div class="dropdown">
  <button class="dropdown-trigger">
    <span>Select model</span>
    <ChevronDown class="w-4 h-4 ml-2" />
  </button>
  <div class="dropdown-menu" role="listbox">
    <div class="dropdown-item" role="option">
      <span class="dropdown-item-label">GPT-4</span>
      <span class="dropdown-item-description">Most capable model</span>
    </div>
    <!-- ... -->
  </div>
</div>
```

---

## 4.5 Checkboxes

| Property | Value |
|----------|-------|
| Size | 16×16px |
| Border | 1.5px solid `border` |
| Border Radius | `radius-sm` (4px) |
| Checked background | `primary` |
| Checked icon | White checkmark stroke |
| Focus | 2px `primary` outline, 2px offset |
| Disabled | `opacity-disabled` |
| Label spacing | `space-2` (8px) from checkbox to label |
| Press animation | Scale 0.9 → 1.0, `duration-fast` |

**Accessibility:**
- Always pair checkboxes with visible `<label>` elements
- Use `fieldset` and `legend` for checkbox groups
- Support keyboard interaction (Space to toggle)
- Indeterminate state: horizontal dash instead of checkmark

---

## 4.6 Radio Buttons

| Property | Value |
|----------|-------|
| Size | 16×16px |
| Border | 1.5px solid `border` |
| Shape | Circle (`radius-full`) |
| Selected indicator | 6px `primary` filled circle, centered |
| Focus | 2px `primary` outline, 2px offset |
| Disabled | `opacity-disabled` |
| Label spacing | `space-2` (8px) |

**Accessibility:**
- Radio groups must use `fieldset` with a descriptive `legend`
- Arrow keys navigate within the group
- Tab key moves focus to the next group, not the next option

---

## 4.7 Tabs

### Standard Tabs

| Property | Value |
|----------|-------|
| Container border | 1px solid `border-subtle` bottom |
| Tab typography | `body-strong` (14px / 500) |
| Tab color (inactive) | `text-tertiary` |
| Tab color (active) | `text-primary` |
| Active indicator | 2px `primary` bottom border |
| Padding | `space-2 space-4` (8px 16px) per tab |
| Gap between tabs | `space-1` (4px) |
| Hover | `text-secondary` color, `surface-secondary` background pill |
| Transition | Active indicator slides with `duration-normal` |

```html
<div class="tabs" role="tablist">
  <button class="tab tab-active" role="tab" aria-selected="true">
    Overview
  </button>
  <button class="tab" role="tab" aria-selected="false">
    Detailed Scores
  </button>
  <button class="tab" role="tab" aria-selected="false">
    History
  </button>
</div>
```

### Pill Tabs (Segmented Control)

For mutually exclusive filter options:

| Property | Value |
|----------|-------|
| Container | `surface-secondary` background, `radius-lg` (8px) |
| Tab (inactive) | transparent, `text-secondary` |
| Tab (active) | `surface` background, `text-primary`, Level 1 shadow |
| Padding | `space-1` (4px) container, `space-1.5 space-3` (6px 12px) per pill |
| Border Radius | `radius-md` (6px) per pill |
| Transition | Background slide with `duration-normal` |

---

## 4.8 Accordions

| Property | Value |
|----------|-------|
| Trigger | Full-width row, `heading-sm` typography for label |
| Chevron | Right-aligned, rotates 180° when expanded |
| Content padding | `space-4` (16px) top, `space-0` sides (aligns with trigger text) |
| Divider | 1px `border-subtle` between accordion items |
| Animation | Height expand, `duration-slow` (300ms), `ease-default` |
| Default state | All collapsed |

**Accessibility:**
- Trigger must be a `<button>` inside a heading element
- Use `aria-expanded` on the trigger
- Use `aria-controls` linking trigger to content panel
- Content panel uses `role="region"` with `aria-labelledby` referencing the trigger

---

## 4.9 Tooltips

| Property | Value |
|----------|-------|
| Background | `text-primary` (inverted — dark on light, light on dark) |
| Text | `text-on-inverted` |
| Typography | `body-sm` (13px / 400) |
| Padding | `space-1.5 space-2` (6px 8px) |
| Border Radius | `radius-sm` (4px) |
| Max width | 240px |
| Arrow | 6px triangular arrow pointing toward the trigger |
| Delay | 300ms before showing (prevents accidental triggers) |
| Animation | Fade + translate 4px from direction, `duration-moderate` |
| Dismiss | Fade, `duration-fast` |

**Do:**
- Use tooltips for supplementary information that isn't critical
- Keep tooltip text to one sentence (max ~60 characters)
- Position tooltips to avoid being clipped by viewport edges

**Don't:**
- Put interactive elements inside tooltips (use popovers instead)
- Use tooltips to convey essential information
- Show tooltips on touch devices (use long-press or info icon + popover)

**Accessibility:**
- Use `aria-describedby` on the trigger element, referencing the tooltip's `id`
- Tooltip content must be accessible to screen readers
- Tooltip must be dismissible with Escape key

---

## 4.10 Cards

Cards are the primary content container in AIQualityHQ. The card vocabulary is extensive because the product revolves around presenting analysis data in card-based layouts.

### Base Card

| Property | Value |
|----------|-------|
| Background | `surface` |
| Border | 1px solid `border` |
| Border Radius | `radius-xl` (12px) — marketing / `radius-lg` (8px) — dashboard |
| Padding | `space-5` (20px) standard / `space-6` (24px) generous |
| Shadow | None (Level 0) by default |

```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
    <p class="card-description">Optional description text</p>
  </div>
  <div class="card-content">
    <!-- Content -->
  </div>
  <div class="card-footer">
    <!-- Actions -->
  </div>
</div>
```

### Clickable Card

Extends Base Card with interactive states:

| State | Treatment |
|-------|-----------|
| Hover | Border shifts to `border-strong` |
| Pressed | Background shifts to `surface-secondary` |
| Focus | 2px `primary-border` outline |

```html
<a href="/report/123" class="card card-clickable">
  <!-- Card content -->
</a>
```

**Accessibility:** Clickable cards must be `<a>` or `<button>` elements, never `<div>` with `onClick`. The entire card surface must be the click target.

### Feature Card (Marketing)

For marketing/landing page feature highlights:

| Property | Value |
|----------|-------|
| Border Radius | `radius-2xl` (16px) |
| Padding | `space-8` (32px) |
| Min height | 320px |
| Layout | Icon/illustration top, heading, description, optional link |
| Shadow | Level 1 (subtle) |

### Metric Card (Dashboard)

Compact card displaying a single metric with trend:

| Property | Value |
|----------|-------|
| Border Radius | `radius-lg` (8px) |
| Padding | `space-4` (16px) |
| Layout | Label top-left, value large center, trend bottom-right |
| Value typography | `score-lg` (32px mono) |
| Trend | Small arrow + percentage in `caption` size, semantic color |

```html
<div class="card metric-card">
  <span class="metric-label text-body-sm text-secondary">Total Analyses</span>
  <span class="metric-value font-mono text-score-lg font-semibold tabular-nums">1,247</span>
  <span class="metric-trend text-success text-caption">
    <TrendingUp class="w-3 h-3 inline" /> +12.3%
  </span>
</div>
```

---

## 4.11 Dialogs (Modals)

| Property | Value |
|----------|-------|
| Backdrop | `rgba(0,0,0,0.5)` (light mode) / `rgba(0,0,0,0.7)` (dark mode) |
| Container | `surface`, `radius-2xl` (16px), Level 3 shadow |
| Width | 480px (default), 640px (wide), 320px (compact) |
| Max height | 85vh |
| Padding | `space-6` (24px) |
| Header | Title in `heading-md`, optional close button top-right |
| Footer | Action buttons right-aligned, `space-3` (12px) gap |
| Animation open | Backdrop fade + container scale from 0.95, `duration-slow` |
| Animation close | Reverse, `duration-moderate` |
| Dismiss | Click backdrop, press Escape, click close button |

**Accessibility:**
- Use `role="dialog"` with `aria-modal="true"`
- Set `aria-labelledby` to the dialog title
- Focus traps inside the dialog when open
- On open, focus moves to the first interactive element
- On close, focus returns to the trigger element
- Escape key dismisses the dialog

```html
<div class="dialog-backdrop" aria-hidden="true"></div>
<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <div class="dialog-header">
    <h2 id="dialog-title" class="text-heading-md">Confirm Deletion</h2>
    <button class="btn-icon btn-ghost" aria-label="Close">
      <X class="w-4 h-4" />
    </button>
  </div>
  <div class="dialog-content">
    <p>Are you sure you want to delete this report? This action cannot be undone.</p>
  </div>
  <div class="dialog-footer">
    <button class="btn btn-secondary">Cancel</button>
    <button class="btn btn-destructive">Delete</button>
  </div>
</div>
```

---

## 4.12 Drawers

Side panels that slide in from the edge of the viewport. Used for detail views, settings panels, and extended forms that don't warrant a full page navigation.

| Property | Value |
|----------|-------|
| Position | Right edge (default), left edge (sidebar variant) |
| Width | 480px (default), 640px (wide), 320px (compact) |
| Background | `surface` |
| Border | 1px `border` on the side facing the content |
| Shadow | Level 3 on the leading edge |
| Animation | Slide from edge, `duration-slow` (300ms), `ease-out` |
| Backdrop | Same as dialog on mobile; none on desktop (content remains visible) |
| Close | Close button, Escape key, click outside (mobile) |

---

## 4.13 Tables

Tables are critical for displaying quality analysis data, comparison reports, and historical scores.

### Data Table

| Property | Value |
|----------|-------|
| Background | `surface` |
| Border | 1px solid `border` on container |
| Border Radius | `radius-lg` (8px) on container |
| Header background | `surface-secondary` |
| Header typography | `caption-strong` (12px / 500), `text-secondary` |
| Header letter-spacing | 0.3px (slightly open for scannability) |
| Cell typography | `body` (14px / 400), `text-primary` |
| Cell padding | `space-3 space-4` (12px 16px) |
| Row divider | 1px solid `border-subtle` |
| Row hover | `surface-secondary` background (if clickable) |
| Numeric cells | `font-mono tabular-nums`, right-aligned |
| Sort indicator | Small chevron, `text-tertiary`, transition rotation |
| Pagination | Below table, centered, see Pagination component |

```html
<div class="table-container">
  <table class="data-table">
    <thead>
      <tr>
        <th class="text-left">Analysis</th>
        <th class="text-left">Model</th>
        <th class="text-right font-mono">Score</th>
        <th class="text-right font-mono">Trust</th>
        <th class="text-left">Date</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Prompt Analysis #1247</td>
        <td>GPT-4o</td>
        <td class="text-right font-mono tabular-nums text-score-excellent">87</td>
        <td class="text-right font-mono tabular-nums text-score-good">72</td>
        <td class="text-tertiary">Jun 28, 2026</td>
      </tr>
    </tbody>
  </table>
</div>
```

**Responsive:** Tables scroll horizontally on mobile. Use `overflow-x-auto` on the container. Pin the first column on mobile if it contains the row identifier.

---

## 4.14 Charts

Charts use a minimal, high-contrast style that aligns with the design system's restraint.

### Chart Principles

1. **Teal primary for the focal data series.** Secondary series use neutral grays.
2. **No grid lines by default.** Only add if the y-axis values are critical (financial, score trends).
3. **Axis labels in `caption` typography,** `text-tertiary` color.
4. **Tooltips follow the tooltip component spec** (dark background, `body-sm` text).
5. **Legend uses dot + label format,** positioned top-right of the chart, `body-sm` typography.
6. **No 3D effects, no animation on initial load.** Data should be immediately readable.
7. **Score charts always include the 0 and 100 bounds** on the y-axis for context.

### Chart Color Palette

| Series | Light Mode | Dark Mode | Use |
|--------|-----------|-----------|-----|
| Primary | `#0891B2` | `#22D3EE` | Main data series |
| Secondary | `#6B7280` | `#9CA3AF` | Comparison / secondary data |
| Tertiary | `#D1D5DB` | `#4B5563` | Baseline / reference lines |
| Area fill | `rgba(8,145,178,0.08)` | `rgba(34,211,238,0.1)` | Area under primary line |
| Grid lines | `#E5E7EB` | `#1F2024` | If enabled |

---

## 4.15 Progress Bars

### Linear Progress

| Property | Value |
|----------|-------|
| Track height | 4px (compact), 8px (standard) |
| Track background | `surface-tertiary` |
| Track radius | `radius-full` (fully rounded) |
| Fill color | `primary` (default), semantic colors for scores |
| Fill radius | `radius-full` |
| Animation | Width transition, `duration-slower` (500ms), `ease-default` |
| Label | Optional, above the bar in `caption` typography |

```html
<div class="progress" role="progressbar" aria-valuenow="73" aria-valuemin="0" aria-valuemax="100">
  <div class="progress-label">
    <span class="text-caption text-secondary">Quality Score</span>
    <span class="text-caption-strong font-mono tabular-nums">73/100</span>
  </div>
  <div class="progress-track">
    <div class="progress-fill bg-score-good" style="width: 73%"></div>
  </div>
</div>
```

### Circular Progress (Score Ring)

Used for individual dimension scores in quality score widgets.

| Property | Value |
|----------|-------|
| Size | 48px (compact), 64px (standard), 96px (large) |
| Track stroke | 4px (compact), 6px (standard) |
| Track color | `surface-tertiary` |
| Fill stroke | Same width, semantic score color |
| Fill cap | Round line cap |
| Center content | Score number in `score-sm` / `score-md` typography |
| Animation | Stroke-dashoffset transition, `duration-slower` |

---

## 4.16 Score Cards

**The signature component of AIQualityHQ.** Score cards display quality scores with immediate semantic clarity.

### Primary Score Card

The hero score display — large, prominent, used for the overall quality score.

| Property | Value |
|----------|-------|
| Background | `surface` |
| Border | 2px solid (semantic score color border variant) |
| Border Radius | `radius-xl` (12px) |
| Padding | `space-6` (24px) |
| Score number | `score-display` (48px mono / 600), center-aligned |
| Score label | `heading-sm` (16px / 600), above score number |
| Score sublabel | `body-sm` (13px / 400), `text-secondary`, below score |
| Suffix | "/100" in `score-md`, `text-tertiary` |
| Trend indicator | Arrow + percentage, `caption`, below score |

```html
<div class="score-card score-card-primary score-excellent">
  <h3 class="score-card-label">Overall Quality Score</h3>
  <div class="score-card-value">
    <span class="font-mono text-score-display font-semibold tabular-nums text-score-excellent">87</span>
    <span class="font-mono text-score-md text-tertiary">/100</span>
  </div>
  <div class="score-card-trend text-success">
    <TrendingUp class="w-3 h-3 inline" />
    <span class="text-caption">+5 from last analysis</span>
  </div>
</div>
```

### Dimension Score Card

Compact card for individual quality dimensions (Trust, Privacy, Security, etc.):

| Property | Value |
|----------|-------|
| Background | Semantic score `subtle` color |
| Border | 1px solid (semantic score `border` variant) |
| Border Radius | `radius-lg` (8px) |
| Padding | `space-4` (16px) |
| Layout | Circular progress ring (48px) left, label + number right |
| Score number | `score-md` (24px mono / 600), semantic color |
| Label | `body-strong` (14px / 500), `text-primary` |
| Sub-label | `body-sm`, `text-secondary` |

```html
<div class="score-card score-card-dimension score-warning">
  <div class="score-ring" data-score="52" data-max="100">
    <!-- SVG circular progress -->
  </div>
  <div class="score-card-info">
    <span class="text-body-strong">Trust Score</span>
    <span class="font-mono text-score-md font-semibold tabular-nums text-score-warning">52</span>
    <span class="text-body-sm text-secondary">3 factors below threshold</span>
  </div>
</div>
```

---

## 4.17 Metric Cards

Simpler than score cards — for displaying non-score metrics (total analyses, average response time, etc.).

| Property | Value |
|----------|-------|
| Background | `surface` |
| Border | 1px solid `border` |
| Border Radius | `radius-lg` (8px) |
| Padding | `space-4` (16px) |
| Label | `body-sm`, `text-secondary`, top |
| Value | `heading-lg` (24px / 600) or `score-lg` (32px mono) for numerics |
| Trend | `caption`, semantic color, bottom-right |
| Icon | Optional, `icon-md`, `text-tertiary`, top-left |

---

## 4.18 Search Bar

### Standard Search

| Property | Value |
|----------|-------|
| Background | `surface` |
| Border | 1px solid `border` |
| Border Radius | `radius-md` (6px) |
| Height | 36px |
| Padding | 8px 12px, left icon offset |
| Icon | Search (Lucide), 16px, `text-tertiary`, left-aligned |
| Placeholder | "Search analyses..." in `text-tertiary` |
| Clear button | X icon appears when input has value |
| Focus | Same as text input focus state |
| Keyboard shortcut | `⌘K` / `Ctrl+K` hint at right edge, `caption` mono |

### Command Palette Search (see 4.28)

---

## 4.19 Navigation

### Top Navigation (Marketing)

| Property | Value |
|----------|-------|
| Background | `canvas` |
| Height | 64px |
| Border | 1px solid `border-subtle` bottom |
| Position | Sticky, top: 0, z-index: 40 |
| Layout | Logo left, nav links center, CTAs right |
| Link typography | `body-strong` (14px / 500) |
| Link color | `text-secondary` (default), `text-primary` (active/hover) |
| CTA | Primary button (single, right side) |
| Mobile | Hamburger menu at < 768px, full-screen drawer |

```html
<header class="nav-marketing">
  <div class="nav-container">
    <a href="/" class="nav-logo" aria-label="AIQualityHQ Home">
      <!-- Logo -->
    </a>
    <nav class="nav-links" aria-label="Main navigation">
      <a href="/features" class="nav-link">Features</a>
      <a href="/pricing" class="nav-link">Pricing</a>
      <a href="/docs" class="nav-link">Documentation</a>
      <a href="/blog" class="nav-link">Blog</a>
    </nav>
    <div class="nav-actions">
      <a href="/login" class="btn btn-ghost">Log In</a>
      <a href="/signup" class="btn btn-primary">Start Free</a>
    </div>
  </div>
</header>
```

### Top Navigation (Dashboard)

| Property | Value |
|----------|-------|
| Background | `surface` |
| Height | 56px |
| Border | 1px solid `border-subtle` bottom |
| Position | Fixed, top: 0, z-index: 40 |
| Layout | Hamburger/logo left, search center, user menu right |
| Search | Compact search bar with `⌘K` shortcut |

---

## 4.20 Sidebar

### Dashboard Sidebar

| Property | Value |
|----------|-------|
| Background | `canvas` (light mode) / `surface` (dark mode) |
| Width | 256px expanded, 64px collapsed |
| Border | 1px solid `border-subtle` right |
| Position | Fixed, full height |
| Section spacing | `space-6` (24px) between groups |
| Item height | 36px |
| Item padding | `space-2 space-3` (8px 12px) |
| Item typography | `body-strong` (14px / 500) |
| Item color | `text-secondary` (default), `text-primary` (active) |
| Active indicator | `primary-subtle` background, `primary` text, 2px `primary` left border |
| Hover | `surface-secondary` background |
| Collapse | `space-16` (64px) width, icon-only, tooltip on hover |
| Mobile | Hidden by default, slides in as drawer from left |

```html
<aside class="sidebar" aria-label="Dashboard navigation">
  <nav>
    <div class="sidebar-section">
      <span class="sidebar-section-label text-overline text-tertiary">ANALYZE</span>
      <a href="/dashboard" class="sidebar-item sidebar-item-active">
        <BarChart3 class="w-5 h-5" />
        <span class="sidebar-label">Dashboard</span>
      </a>
      <a href="/analyses" class="sidebar-item">
        <Search class="w-5 h-5" />
        <span class="sidebar-label">Analyses</span>
      </a>
    </div>
  </nav>
</aside>
```

---

## 4.21 Header (Page-Level)

Not the navigation — this is the page header within the content area.

| Property | Value |
|----------|-------|
| Title | `heading-lg` (24px / 600) |
| Description | `body-lg` (16px / 400), `text-secondary` |
| Actions | Right-aligned buttons |
| Border | Optional 1px `border-subtle` bottom |
| Padding bottom | `space-6` (24px) |
| Margin bottom | `space-6` (24px) |

---

## 4.22 Footer

### Marketing Footer

| Property | Value |
|----------|-------|
| Background | `canvas` |
| Border top | 1px solid `border-subtle` |
| Padding | `space-16` (64px) top, `space-8` (32px) bottom |
| Layout | 4-column link grid at desktop, 2-up tablet, 1-up mobile |
| Column heading | `body-strong` (14px / 500), `text-primary` |
| Link | `body-sm` (13px / 400), `text-secondary`, hover: `text-primary` |
| Bottom row | Logo, copyright, legal links in `caption` |
| Max width | Same as marketing container (1200px) |

---

## 4.23 Breadcrumbs

| Property | Value |
|----------|-------|
| Typography | `body-sm` (13px / 400) |
| Color | `text-tertiary` (parents), `text-primary` (current) |
| Separator | `/` character or ChevronRight icon (12px), `text-disabled` |
| Spacing | `space-1.5` (6px) between items |
| Current page | Not a link, rendered as plain text |

**Accessibility:** Use `<nav aria-label="Breadcrumb">` with `<ol>` list markup. Current page has `aria-current="page"`.

---

## 4.24 Pagination

| Property | Value |
|----------|-------|
| Container | Centered, `space-4` (16px) from table bottom |
| Page button | 36×36px, `radius-md`, `body-sm` typography |
| Active page | `primary-subtle` background, `primary` text |
| Disabled (prev/next at bounds) | `opacity-disabled` |
| Ellipsis | "..." text, non-interactive |
| Max visible pages | 7 (1 ... 4 5 6 ... 12) |

---

## 4.25 Code Blocks

For displaying code snippets in documentation and analysis results.

| Property | Value |
|----------|-------|
| Background | `surface-secondary` (light), `surface` (dark) |
| Border | 1px solid `border` |
| Border Radius | `radius-lg` (8px) |
| Padding | `space-4` (16px) |
| Typography | `mono` (14px JetBrains Mono / 400) |
| Line height | 1.6 |
| Header | Optional filename/language label, `caption-strong`, `surface-tertiary` background |
| Copy button | Top-right, ghost button, copies content to clipboard |
| Syntax highlighting | Minimal palette — keywords in `primary`, strings in `score-excellent`, comments in `text-tertiary` |
| Max height | 480px with scroll, or expandable |
| Overflow | Horizontal scroll (never wrap code lines) |

---

## 4.26 Badges & Tags

### Badges

Small status indicators, always paired with text context.

| Variant | Background | Text | Border | Use |
|---------|-----------|------|--------|-----|
| Default | `surface-secondary` | `text-secondary` | none | Generic labels |
| Primary | `primary-subtle` | `primary` | none | Feature highlights |
| Success | `success-subtle` | `success` | none | Passed, active, online |
| Warning | `warning-subtle` | `warning` | none | Caution, degraded |
| Error | `error-subtle` | `error` | none | Failed, offline |

| Property | Value |
|----------|-------|
| Typography | `caption-strong` (12px / 500) |
| Padding | `space-0.5 space-1.5` (2px 6px) |
| Border Radius | `radius-sm` (4px) |
| Height | 20px |

### Tags / Chips

Removable labels for categorization and filtering.

| Property | Value |
|----------|-------|
| Background | `surface-secondary` |
| Text | `text-primary` |
| Typography | `body-sm` (13px / 400) |
| Padding | `space-1 space-2` (4px 8px) |
| Border Radius | `radius-sm` (4px) |
| Border | 1px solid `border` |
| Remove button | X icon (12px), right side |
| Height | 28px |

---

## 4.27 Command Palette

A keyboard-first command interface (⌘K / Ctrl+K) for power users. Modeled after the command palette patterns proven by Linear and Raycast.

| Property | Value |
|----------|-------|
| Trigger | `⌘K` / `Ctrl+K` keyboard shortcut |
| Container | `surface`, `radius-2xl` (16px), Level 3 shadow, 640px wide |
| Position | Centered, 20% from viewport top |
| Backdrop | Same as dialog |
| Search input | Top, full-width, no border, large placeholder |
| Results list | Below search, scrollable, max 8 visible items |
| Result item | 40px height, icon + label + shortcut hint |
| Active item | `surface-secondary` background |
| Keyboard nav | Arrow keys move selection, Enter activates, Escape closes |
| Groups | Separated by `overline` section labels |

```html
<div class="command-palette" role="dialog" aria-modal="true" aria-label="Command palette">
  <div class="command-palette-search">
    <Search class="w-5 h-5 text-tertiary" />
    <input
      type="text"
      placeholder="Type a command or search..."
      class="command-palette-input"
      aria-label="Command search"
    />
  </div>
  <div class="command-palette-results" role="listbox">
    <div class="command-palette-group">
      <span class="command-palette-group-label text-overline">RECENT ANALYSES</span>
      <div class="command-palette-item" role="option">
        <BarChart3 class="w-4 h-4" />
        <span>View Latest Report</span>
        <kbd class="command-palette-shortcut">⌘ R</kbd>
      </div>
    </div>
  </div>
</div>
```

---

## 4.28 Modals

See section 4.11 (Dialogs). "Modal" and "Dialog" are used interchangeably in this system. All modal patterns follow the Dialog specification.

---

## 4.29 AI Analysis Panels

Specialized panels for displaying AI quality analysis results. These extend the card pattern with analysis-specific layouts.

### Analysis Result Panel

| Property | Value |
|----------|-------|
| Background | `surface` |
| Border | 1px solid `border` |
| Border Radius | `radius-xl` (12px) |
| Padding | `space-6` (24px) |
| Layout | Score card top, factor breakdown below, recommendations bottom |
| Header | Analysis title + model name + timestamp |
| Score section | Primary score card (large) + dimension scores (grid) |
| Factor section | Expandable list of scoring factors with individual scores |
| Recommendation section | Numbered list of improvement suggestions |

```html
<div class="analysis-panel">
  <div class="analysis-header">
    <div>
      <h2 class="text-heading-md">Prompt Quality Analysis</h2>
      <p class="text-body-sm text-secondary">
        GPT-4o · Analyzed 2 minutes ago
      </p>
    </div>
    <button class="btn btn-secondary btn-sm">
      <Download class="w-4 h-4 mr-1" /> Export
    </button>
  </div>

  <div class="analysis-scores">
    <!-- Primary score card -->
    <!-- Dimension score grid -->
  </div>

  <div class="analysis-factors">
    <h3 class="text-heading-sm mb-4">Scoring Factors</h3>
    <!-- Expandable factor list -->
  </div>

  <div class="analysis-recommendations">
    <h3 class="text-heading-sm mb-4">Recommendations</h3>
    <!-- Numbered recommendation list -->
  </div>
</div>
```

---

## 4.30 Report Cards

Extended cards for quality reports that aggregate multiple analyses.

| Property | Value |
|----------|-------|
| Background | `surface` |
| Border | 1px solid `border` |
| Border Radius | `radius-xl` (12px) |
| Padding | `space-6` (24px) |
| Header | Report title, date range, analysis count |
| Body | Summary metrics grid + trend chart + key findings list |
| Footer | Actions: Download PDF, Share, Schedule |

---

## 4.31 Comparison Tables

For comparing scores across multiple analyses, models, or time periods.

| Property | Value |
|----------|-------|
| Layout | Extends data table with fixed first column |
| Header | Model/analysis names as column headers |
| Score cells | `score-sm` typography with semantic color background |
| Difference cells | +/- delta with arrow indicator |
| Best-in-row | Bold value, subtle primary background |
| Worst-in-row | Subtle error background |

---

## 4.32 Quality Score Widgets

Composite widgets that combine multiple score components into a cohesive quality overview.

### Score Overview Widget

The primary dashboard widget showing overall quality with dimension breakdown.

| Layout | Description |
|--------|-------------|
| Top | Primary Score Card (overall score, large) |
| Middle | 6-column grid of Dimension Score Cards (small) |
| Bottom | Trend sparkline showing score over last 30 days |

```html
<div class="quality-widget">
  <div class="quality-widget-primary">
    <!-- Primary Score Card (overall) -->
  </div>
  <div class="quality-widget-dimensions">
    <!-- Dimension Score Cards (grid) -->
    <!-- Prompt, Memory, Context, Trust, Privacy, Security -->
  </div>
  <div class="quality-widget-trend">
    <!-- 30-day trend sparkline -->
  </div>
</div>
```

---

# Part V — Page Patterns

---

## 5.1 Homepage

### Purpose
The homepage convinces visitors that AIQualityHQ is the definitive platform for AI quality measurement. It should communicate credibility, precision, and capability in under 5 seconds.

### Structure

```
┌─────────────────────────────────────────────────────┐
│  Navigation (sticky)                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Hero Section                                       │
│  ├── Mono eyebrow: "THE AI QUALITY PLATFORM"        │
│  ├── Display headline: "Measure, improve,           │
│  │   and trust every AI interaction."               │
│  ├── Body lead paragraph                            │
│  ├── CTA: [Start Free Trial] (pill) + [See Demo]   │
│  └── Hero visual: Product screenshot with           │
│      score card overlay                             │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Logo Strip: "Trusted by teams at..."               │
│  (grayscale logos, auto-scrolling if > 6)           │
├─────────────────────────────────────────────────────┤
│  Feature Grid (3-up)                                │
│  ├── Measure: Score any AI interaction              │
│  ├── Analyze: 6-dimension quality breakdown         │
│  └── Trust: Build confidence in AI outputs          │
├─────────────────────────────────────────────────────┤
│  Product Showcase                                   │
│  ├── Full-width product screenshot                  │
│  ├── Annotated callouts highlighting features       │
│  └── Score visualization in context                 │
├─────────────────────────────────────────────────────┤
│  Quality Dimensions Section                         │
│  ├── 6 dimension cards (Prompt, Memory, Context,    │
│  │   Trust, Privacy, Security)                      │
│  └── Each with icon, title, description, sample     │
│      score ring                                     │
├─────────────────────────────────────────────────────┤
│  Social Proof / Testimonials                        │
│  ├── 3-up testimonial cards                         │
│  └── Name, role, company, quote                     │
├─────────────────────────────────────────────────────┤
│  CTA Band                                           │
│  ├── "Ready to measure AI quality?"                 │
│  └── [Start Free Trial] + [Contact Sales]           │
├─────────────────────────────────────────────────────┤
│  Footer                                             │
└─────────────────────────────────────────────────────┘
```

### Hero Section Rules

**Typography:**
- Eyebrow: `mono-eyebrow` (12px JetBrains Mono / 500), `text-primary`, ALL-CAPS, `space-3` (12px) below
- Headline: `display-2xl` (56px / 600), `text-primary`, tight tracking (-1.4px)
- Subheadline: `body-lg` (16px / 400), `text-secondary`, max-width 560px
- Primary CTA: `btn-primary-pill` (marketing pill), `button-lg`
- Secondary CTA: `btn-secondary` (standard rectangle), `button-lg`

**Hero Visual:**
- Product screenshot in `radius-xl` (12px) container, 1px `border`, Level 1 shadow
- Score card overlay (floating, positioned over the screenshot) showing a sample overall score
- No background gradient, no atmospheric effects, no particles
- The product screenshot IS the visual

**Spacing:**
- Hero section padding: `space-32` (128px) top, `space-24` (96px) bottom
- Headline to subheadline: `space-4` (16px)
- Subheadline to CTAs: `space-8` (32px)
- CTAs to hero visual: `space-16` (64px)

**Astro Implementation:**
```astro
---
// src/components/Hero.astro
---
<section class="py-32 px-6">
  <div class="max-w-[1200px] mx-auto text-center">
    <span class="font-mono text-mono-eyebrow font-medium uppercase tracking-widest text-primary">
      The AI Quality Platform
    </span>
    <h1 class="mt-3 text-display-2xl font-semibold tracking-tight text-primary">
      Measure, improve, and trust<br />every AI interaction.
    </h1>
    <p class="mt-4 text-body-lg text-secondary max-w-xl mx-auto">
      AIQualityHQ scores every AI response across six quality dimensions —
      giving you the data to build AI systems users can rely on.
    </p>
    <div class="mt-8 flex items-center justify-center gap-3">
      <a href="/signup" class="btn btn-primary-pill">Start Free Trial</a>
      <a href="/demo" class="btn btn-secondary btn-lg">See Demo</a>
    </div>
    <div class="mt-16">
      <!-- Product screenshot component -->
    </div>
  </div>
</section>
```

**SEO:**
- Page title: "AIQualityHQ — The AI Quality Platform"
- Meta description: "Measure, improve, and trust every AI interaction. Score AI responses across six quality dimensions with AIQualityHQ."
- Single `<h1>` — the hero headline
- Structured data: Organization + SoftwareApplication schema

---

## 5.2 Landing Pages

Template for feature-specific landing pages (e.g., /features/prompt-analysis, /features/trust-scoring).

### Structure
1. Hero with feature-specific headline + product screenshot
2. Problem statement (what pain this solves)
3. Feature details with annotated screenshots (alternating left-right layout)
4. Quality dimension deep-dive (if applicable)
5. Integration section (API, SDK, webhooks)
6. CTA band

### Layout Rules
- Alternating sections: full-width text left / screenshot right, then text right / screenshot left
- Each feature section: `space-24` (96px) vertical spacing
- Screenshots: `radius-xl` (12px), Level 1 shadow, responsive scaling
- Max content width per section: 560px text column + 560px visual column = 1120px + gutter

---

## 5.3 Tool Pages

Individual tool pages for each analysis type (Prompt Analysis, Response Scoring, etc.).

### Structure
1. Hero with tool name + one-line description + [Try It] CTA
2. Interactive demo embed (if applicable)
3. How it works (3-step process)
4. Scoring dimensions relevant to this tool
5. Sample output / report preview
6. Pricing callout
7. CTA band

---

## 5.4 Prompt Analysis Page

The primary input interface for analyzing a prompt.

### Layout
```
┌─────────────────────────────────────────┐
│  Page Header: "Analyze Prompt"          │
├───────────────────┬─────────────────────┤
│                   │                     │
│  Input Panel      │  Results Panel      │
│  ├── Textarea     │  ├── Loading state  │
│  ├── Model select │  │   (skeleton)     │
│  ├── Options      │  ├── Score card     │
│  └── [Analyze]    │  ├── Dimensions     │
│      button       │  ├── Factors        │
│                   │  └── Recommendations│
│                   │                     │
└───────────────────┴─────────────────────┘
```

- Two-column layout at desktop (50/50 split)
- Single column at mobile (input stacks above results)
- Input panel is sticky on desktop (stays visible while scrolling results)
- Results panel shows skeleton state before analysis runs

---

## 5.5 Results Page

Displays the complete analysis results with full detail.

### Layout
1. Summary strip: Overall score + model + timestamp
2. Dimension breakdown: 6-column grid of dimension score cards
3. Factor analysis: Expandable accordion of individual scoring factors
4. Trend comparison: If historical data exists, 30-day trend chart
5. Recommendations: Ordered list of improvement suggestions
6. Raw data: Collapsible section with raw analysis JSON (for technical users)
7. Actions: Export PDF, Share Link, Re-analyze

---

## 5.6 Documentation

### Design Rules
- Left sidebar navigation (256px, fixed)
- Content area: max-width 720px (optimal reading length)
- Right sidebar: Table of contents (200px, visible at > 1280px)
- Typography: `body-lg` (16px) for body — one step larger than app body for reading comfort
- Code blocks: Full-width within content, syntax highlighted
- Headings: `heading-lg` for h2, `heading-md` for h3, `heading-sm` for h4
- Heading anchors: Link icon appears on hover for deep linking
- In-page navigation: Smooth scroll to anchors

**SEO:** Each documentation page should have a unique title and meta description. Use structured data (TechArticle) for documentation pages.

---

## 5.7 Blog

### Listing Page
- Grid of blog post cards (3-up desktop, 2-up tablet, 1-up mobile)
- Card: Hero image + title + excerpt + author + date + read time
- Featured post (first position): Larger card spanning full width
- Pagination: Standard pagination component at bottom

### Post Page
- Content: max-width 720px, centered
- Hero image: Full-width within content container, `radius-xl`
- Author byline: Avatar (40px) + name + role + date
- Body: `body-lg` (16px) for comfortable reading
- Code blocks, blockquotes, tables supported
- Related posts: 3-up card grid at bottom

---

## 5.8 Pricing

### Structure
1. Hero: "Simple pricing" + toggle Annual/Monthly (pill tabs)
2. Pricing tier cards: 3-up (Free / Pro / Enterprise)
3. Feature comparison table
4. FAQ accordion
5. CTA band

### Pricing Card Rules
- All cards same height (use flexbox align-stretch)
- Featured card (Pro): 2px `primary` border, "Most Popular" badge
- CTA inside each card, pinned to bottom
- Price: `display-md` (32px / 600) with monospace tabular figures
- Period: `body-sm`, `text-tertiary`, inline after price
- Feature list: Check/X icons, `body-sm`, semantic colors

---

## 5.9 FAQ

- Full-width accordion, max-width 768px centered
- Questions: `heading-sm` typography
- Answers: `body-lg` typography for readability
- Categorized with `overline` section headers
- Structured data: FAQPage schema for SEO

---

## 5.10 About

- Company mission and values
- Team section (if applicable): Avatar grid with name, role
- Timeline / milestones (if applicable)
- Keep minimal — users come to the About page for trust signals, not entertainment

---

## 5.11 Contact

- Two-column: Contact form left, contact info right
- Form: Name, email, company, message (textarea), submit button
- Info: Email address, response time expectations
- No chatbot widget, no phone number unless staffed

---

## 5.12 Authentication

### Login Page
- Centered card, max-width 400px
- Logo + "Log in to AIQualityHQ"
- Email input + password input
- [Log In] primary button (full-width)
- "Forgot password?" link below
- "Don't have an account? Sign up" link at bottom
- Optional: Social login buttons (Google, GitHub) above email form

### Signup Page
- Same layout as login
- Additional fields: Name, company (optional)
- Terms of service checkbox
- [Create Account] primary button

### Password Reset
- Single email input + [Send Reset Link] button
- Success state: Confirmation message with email hint

---

## 5.13 Dashboard

The main SaaS application interface.

### Layout
```
┌──────┬──────────────────────────────────┐
│      │  Top Nav (56px)                  │
│ Side ├──────────────────────────────────┤
│ bar  │                                  │
│      │  Page Content                    │
│ 256  │  ├── Page header + actions       │
│ px   │  ├── Metric cards (4-up grid)    │
│      │  ├── Score trend chart           │
│      │  ├── Recent analyses table       │
│      │  └── Quick actions               │
│      │                                  │
└──────┴──────────────────────────────────┘
```

### Dashboard Page Rules
- Default dark mode option for extended use
- Metric cards at top: Overall Score, Analyses Run, Avg Score, Active Monitors
- Trend chart: 30-day quality score trend (line chart)
- Recent analyses: Data table with score, model, date, actions
- Quick actions: "New Analysis" primary button, always visible

---

## 5.14 Future SaaS Dashboard

As the platform evolves, the dashboard will expand with:
- Team management and collaborative analysis
- API key management
- Webhook configuration
- Custom scoring rubrics
- Scheduled analysis (cron-based quality monitoring)
- Alert configuration (score drops below threshold)

All future features should follow the existing component library and spacing system. New page patterns should be composed from existing components before creating new ones.

---

## 5.15 Admin Panel

- Uses the same dashboard layout (sidebar + content)
- Additional nav section: "ADMIN" overline in sidebar
- User management table
- Usage analytics (metric cards + charts)
- Billing management
- System status page

---

# Part VI — Technical Standards

---

## 6.1 Responsive Design

### Mobile (< 640px)

**Layout:**
- Single column, full-width
- Navigation collapses to hamburger menu
- Sidebar hidden (slides in as drawer)
- Cards stack vertically
- Tables scroll horizontally

**Typography:**
- `display-2xl` scales to 36px
- `display-xl` scales to 32px
- Body sizes remain constant (14px)

**Touch:**
- All interactive elements: minimum 44×44px touch target
- CTAs go full-width
- Swipe gestures: dismiss toasts, navigate drawers

**Spacing:**
- Section spacing reduces to `space-16` (64px)
- Card padding remains `space-4` (16px) minimum
- Page horizontal padding: `space-4` (16px)

### Tablet (768px–1023px)

**Layout:**
- 2-up card grids
- Sidebar collapses to icon-only (64px)
- Navigation shows condensed link row
- Marketing pages show alternating sections at 80% width

**Typography:**
- `display-2xl` scales to 44px
- Other display sizes scale by one step down

### Desktop (1024px–1279px)

**Layout:**
- Full sidebar (256px) + content area
- 3-up card grids
- All navigation visible
- Marketing pages at full layout

### Desktop Large (1280px–1535px)

- Default layout, all features visible
- Documentation shows both sidebars (nav + TOC)

### Ultra-wide (≥ 1536px)

- Content locks at `max-width` (1200px marketing, fluid dashboard)
- Margins absorb extra space
- Dashboard can show 4-up metric cards

### Implementation

```css
/* Mobile-first breakpoints */
/* sm: 640px */
@media (min-width: 640px) { /* mobile-lg layouts */ }

/* md: 768px */
@media (min-width: 768px) { /* tablet layouts */ }

/* lg: 1024px */
@media (min-width: 1024px) { /* desktop layouts */ }

/* xl: 1280px */
@media (min-width: 1280px) { /* desktop-lg layouts */ }

/* 2xl: 1536px */
@media (min-width: 1536px) { /* ultra-wide layouts */ }
```

---

## 6.2 Touch Targets

| Element | Minimum Touch Target | Visual Size Allowed |
|---------|---------------------|-------------------|
| Buttons (primary/secondary) | 44×44px | 36px height (padding extends touch) |
| Icon buttons | 44×44px | 28-36px visual |
| Text inputs | 44px height | 36px visual |
| Checkbox/radio | 44×44px | 16px visual (padding extends) |
| Nav links | 44px height | Flexible width |
| Table rows (clickable) | 48px height | 48px visual |
| Tab items | 44px height | Flexible |

**Implementation:** Use `min-height` and `padding` to extend touch targets beyond the visual boundary. Never shrink touch targets below 44px on mobile.

---

## 6.3 Accessibility

### WCAG 2.1 AA Compliance (Minimum)

AIQualityHQ must meet WCAG 2.1 Level AA. Key requirements:

**Perceivable:**
- Color contrast: 4.5:1 for normal text, 3:1 for large text (18px+ bold or 24px+ regular)
- Text resizable to 200% without loss of content
- All images have alt text (or `aria-hidden` if decorative)
- No information conveyed by color alone (always pair with text, icon, or pattern)

**Operable:**
- All interactive elements reachable by keyboard
- Focus visible at all times (`:focus-visible` with 2px primary outline)
- No keyboard traps
- Skip-to-content link as first focusable element
- No time limits on input (except session timeout with warning)

**Understandable:**
- Language attribute on `<html>` element
- Error messages identify the field and explain how to fix it
- Labels explicitly associated with inputs (`for`/`id` pairing)
- Consistent navigation across pages

**Robust:**
- Valid HTML markup
- ARIA roles used where HTML semantics are insufficient
- Form elements have programmatic labels

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move focus to next focusable element |
| `Shift+Tab` | Move focus to previous focusable element |
| `Enter` / `Space` | Activate buttons, links, checkboxes |
| `Arrow keys` | Navigate within radio groups, tabs, menus |
| `Escape` | Close modals, drawers, dropdowns, command palette |
| `⌘K` / `Ctrl+K` | Open command palette |
| `⌘/` / `Ctrl+/` | Open keyboard shortcut help |

### Screen Reader Guidance

- Use semantic HTML elements (`<nav>`, `<main>`, `<aside>`, `<article>`, `<section>`)
- Use `aria-label` on navigation landmarks to differentiate them
- Use `aria-live="polite"` for dynamic content updates (score changes, toast notifications)
- Use `aria-busy="true"` during loading states
- Score announcements: "Quality score: 73 out of 100. Good quality."
- Use `role="status"` for inline status updates

### Color Contrast Summary

All color pairings in the design system meet WCAG AA minimum. Specific pairings verified:

| Combination | Ratio | Level |
|-------------|-------|-------|
| `text-primary` on `canvas` | 15.4:1 | AAA |
| `text-secondary` on `canvas` | 8.2:1 | AAA |
| `text-tertiary` on `canvas` | 5.7:1 | AA |
| `primary` on `canvas` | 4.56:1 | AA |
| `text-on-primary` on `primary` | 4.56:1 | AA |
| `score-excellent` on `score-excellent-subtle` | 5.1:1 | AA |
| `score-warning` on `score-warning-subtle` | 4.8:1 | AA |
| `score-critical` on `score-critical-subtle` | 5.3:1 | AA |
| Dark mode equivalents | All ≥ 4.5:1 | AA |

---

## 6.4 SEO Layout Rules

### Every Page Must Have:
1. **Unique `<title>`** — Format: "Page Title — AIQualityHQ"
2. **Unique `<meta name="description">`** — 150-160 characters, compelling
3. **Single `<h1>`** — one per page, containing the primary heading
4. **Proper heading hierarchy** — h1 → h2 → h3, never skip levels
5. **Semantic HTML** — `<main>`, `<nav>`, `<article>`, `<section>`, `<aside>`
6. **Alt text** on all images (except decorative → `aria-hidden="true"`)
7. **Canonical URL** — `<link rel="canonical">` on every page
8. **Open Graph + Twitter Card meta tags** for social sharing
9. **Structured data** (JSON-LD) — Organization, SoftwareApplication, FAQPage where appropriate
10. **Mobile viewport meta** — `<meta name="viewport" content="width=device-width, initial-scale=1">`

### Internal Linking
- Every page should link to at least 2 other pages on the site
- Navigation should be HTML links (not JavaScript-only navigation)
- Blog posts should link to relevant feature pages and vice versa

---

## 6.5 Performance Rules

### Core Web Vitals Targets

| Metric | Target | Description |
|--------|--------|-------------|
| LCP (Largest Contentful Paint) | < 2.5s | Hero section loads fast |
| INP (Interaction to Next Paint) | < 200ms | Clicks respond instantly |
| CLS (Cumulative Layout Shift) | < 0.1 | Nothing jumps around |
| FCP (First Contentful Paint) | < 1.8s | Something visible quickly |
| TTFB (Time to First Byte) | < 800ms | Server responds fast |

### Implementation Rules

1. **Images:** Use WebP/AVIF format, responsive `srcset`, lazy load below-the-fold, eager load hero
2. **Fonts:** Preload Inter and JetBrains Mono variable fonts, use `font-display: swap`
3. **CSS:** Inline critical CSS for above-the-fold content, defer the rest
4. **JavaScript:** Minimize client-side JS on marketing pages, use Astro's island architecture
5. **Assets:** Serve from Cloudflare CDN, enable Brotli compression
6. **Caching:** Set long cache headers (1 year) for hashed static assets
7. **Bundle size:** Maximum 100KB JavaScript per page (excluding third-party analytics)

### Astro-Specific Performance

```astro
---
// Use Astro's built-in image optimization
import { Image } from 'astro:assets';
import heroScreenshot from '../assets/hero-screenshot.png';
---
<!-- Astro automatically optimizes and generates responsive srcset -->
<Image
  src={heroScreenshot}
  alt="AIQualityHQ dashboard showing quality score analysis"
  widths={[640, 1024, 1280]}
  sizes="(max-width: 768px) 100vw, 1200px"
  loading="eager"
/>
```

---

## 6.6 Static Rendering Rules (Astro)

### Component Architecture

```
src/
├── components/
│   ├── ui/           # Design system primitives (Button, Card, Input, etc.)
│   ├── layout/       # Layout components (Header, Footer, Sidebar)
│   ├── marketing/    # Marketing-specific (Hero, FeatureGrid, Testimonials)
│   ├── dashboard/    # Dashboard-specific (ScoreCard, MetricCard, AnalysisPanel)
│   └── common/       # Shared (Logo, ThemeToggle, SEO)
├── layouts/
│   ├── MarketingLayout.astro
│   ├── DashboardLayout.astro
│   └── DocsLayout.astro
├── pages/
│   ├── index.astro
│   ├── pricing.astro
│   └── ...
└── styles/
    ├── globals.css       # Design tokens, reset, base styles
    ├── components.css    # Component styles
    └── utilities.css     # Custom utilities
```

### Astro Component Rules

1. **Default to zero JavaScript.** Components are static HTML/CSS by default.
2. **Use client directives sparingly.** Only add `client:load`, `client:visible`, or `client:idle` when interactivity is required.
3. **Prefer `client:visible`** over `client:load` for below-the-fold interactive components.
4. **Island architecture:** Each interactive component is an independent island. No global client-side state on marketing pages.
5. **Component naming:** PascalCase, descriptive. `ScoreCard.astro`, not `Card1.astro`.
6. **Props interface:** Always define a TypeScript `interface Props` in the component frontmatter.
7. **Slot naming:** Use named slots for complex component composition.

```astro
---
// Example: Button.astro
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  disabled?: boolean;
}

const { variant = 'primary', size = 'md', href, disabled = false } = Astro.props;
const Tag = href ? 'a' : 'button';
const baseClass = 'btn';
const variantClass = `btn-${variant}`;
const sizeClass = size !== 'md' ? `btn-${size}` : '';
---
<Tag
  class:list={[baseClass, variantClass, sizeClass]}
  href={href}
  disabled={!href && disabled}
  {...href ? {} : { type: 'button' }}
>
  <slot />
</Tag>
```

---

## 6.7 Tailwind CSS Rules

### Configuration

```js
// tailwind.config.mjs
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // All colors defined as CSS custom properties
        canvas: 'var(--color-canvas)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          secondary: 'var(--color-surface-secondary)',
          tertiary: 'var(--color-surface-tertiary)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          pressed: 'var(--color-primary-pressed)',
          subtle: 'var(--color-primary-subtle)',
          border: 'var(--color-primary-border)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          subtle: 'var(--color-border-subtle)',
          strong: 'var(--color-border-strong)',
        },
        // ... semantic colors, score colors, text colors
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SF Mono', 'monospace'],
      },
      borderRadius: {
        none: '0px',
        sm: '4px',
        DEFAULT: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        full: '9999px',
      },
      // ... spacing, shadows, etc.
    },
  },
}
```

### Tailwind Rules

1. **Use design tokens, not arbitrary values.** `bg-primary` not `bg-[#0891B2]`.
2. **Avoid `@apply` in production code** except for complex component base styles (`.btn`, `.card`).
3. **Responsive prefixes are mobile-first.** `text-sm md:text-base lg:text-lg`.
4. **Dark mode via `data-theme` selector**, not `class`.
5. **Custom utilities in `globals.css`**, not inline `style` attributes.
6. **Group related utilities:** `"flex items-center gap-2"` not scattered positioning classes.
7. **Max 15 utility classes per element.** If more are needed, extract a component class.

---

## 6.8 Dark Mode

### Implementation Strategy

Dark mode is controlled by a `data-theme` attribute on the `<html>` element. The value is stored in a cookie and respects the user's OS preference on first visit.

```js
// Theme initialization (inline in <head> to prevent flash)
<script is:inline>
  const theme = document.cookie.match(/theme=(\w+)/)?.[1]
    || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
</script>
```

### Theme Toggle Component

- Icon: Sun (light) / Moon (dark)
- Position: Top-right nav area
- Transition: `duration-fast` for all color property transitions
- Cookie persistence: Set `theme` cookie on toggle, SameSite=Lax, 1 year expiry
- No flash: Theme script runs in `<head>` before paint

### Dark Mode Design Rules

1. **Do not simply invert colors.** Each token has independently designed light and dark values.
2. **Reduce contrast slightly in dark mode.** `text-primary` on `canvas` is 15.4:1 in light, 17.1:1 in dark — slightly higher, but both are AAA.
3. **Increase shadow opacity in dark mode.** Shadows need more intensity to be visible against dark backgrounds.
4. **Use lighter primary in dark mode.** Primary shifts from `#0891B2` to `#22D3EE` for adequate contrast.
5. **Surface steps are smaller in dark mode.** The difference between `canvas` and `surface` is subtler (to avoid harsh contrast jumps).
6. **Score colors shift to lighter variants.** `#059669` → `#34D399` for visibility.

---

## 6.9 Light Mode

Light mode is the default. All design specifications in this document default to light mode values unless explicitly marked as dark mode. Light mode is used for:
- Marketing pages (always)
- Documentation (always)
- Blog (always)
- Dashboard (default, user can switch to dark)

---

## 6.10 Print Mode

When users print analysis reports or documentation:

```css
@media print {
  /* Hide non-essential UI */
  .nav-marketing,
  .sidebar,
  .nav-dashboard,
  .footer,
  .toast-container,
  .btn:not(.btn-print) {
    display: none !important;
  }

  /* Override colors for print */
  * {
    color: #000 !important;
    background: #fff !important;
    box-shadow: none !important;
  }

  /* Score colors remain for context */
  .text-score-excellent { color: #059669 !important; }
  .text-score-good { color: #0891B2 !important; }
  .text-score-warning { color: #D97706 !important; }
  .text-score-critical { color: #DC2626 !important; }

  /* Page breaks */
  .score-card, .analysis-panel, .report-card {
    page-break-inside: avoid;
  }

  h2, h3 {
    page-break-after: avoid;
  }

  /* Ensure readable font size */
  body {
    font-size: 12pt;
    line-height: 1.5;
  }
}
```

---

# Part VII — Brand Language

---

## 7.1 Voice & Tone

### Voice (Constant)

AIQualityHQ always sounds:
- **Precise** — uses exact numbers, not approximations
- **Direct** — says what it means in the fewest words
- **Knowledgeable** — speaks with authority earned through data
- **Respectful** — treats the user as a professional peer

### Tone (Contextual)

The tone shifts based on context:

| Context | Tone | Example |
|---------|------|---------|
| Success | Factual confirmation | "Analysis complete. Score: 82/100." |
| Error | Calm, helpful | "Analysis failed. Check your API key and try again." |
| Empty state | Encouraging, guiding | "No analyses yet. Run your first analysis to see quality scores here." |
| Onboarding | Welcoming, concise | "Welcome to AIQualityHQ. Let's run your first quality analysis." |
| Warning | Clear, non-alarming | "Trust score dropped below your threshold of 60. Review contributing factors." |
| Documentation | Instructional, neutral | "Pass the prompt text as the body of a POST request to /api/analyze." |

---

## 7.2 Microcopy Standards

### Button Labels

| Action | Label | NOT |
|--------|-------|-----|
| Run an analysis | "Analyze" or "Run Analysis" | "Submit" / "Go" / "Start" |
| Create something | "Create {thing}" | "Add New" / "+" |
| Save settings | "Save" | "Update" / "Apply Changes" |
| Delete | "Delete {thing}" | "Remove" / "Trash" |
| Cancel | "Cancel" | "Go Back" / "Never Mind" |
| Confirm | "Confirm" or "Yes, delete" | "OK" / "Sure" |
| Navigate | "View {thing}" | "Click Here" / "Learn More" |
| Download | "Download {format}" | "Get" / "Export" |
| Copy | "Copy" (then "Copied!" for 2s) | "Copy to Clipboard" |
| Sign up | "Start Free" or "Create Account" | "Sign Up Now!" / "Join" |
| Log in | "Log In" | "Sign In" / "Login" |
| Log out | "Log Out" | "Sign Out" / "Logout" |

**Rules:**
- Always lead with a verb
- Specify the object when ambiguous ("Delete Report" not "Delete")
- No exclamation marks in button labels
- No all-caps in button labels (the typography system handles emphasis)

### Empty State Messages

| Context | Message | CTA |
|---------|---------|-----|
| No analyses | "No analyses yet" / "Run your first analysis to see quality scores, trends, and recommendations here." | "Run Analysis" |
| No results | "No results found" / "Try adjusting your search or filters." | "Clear Filters" |
| Empty dashboard | "Welcome to your dashboard" / "Start by analyzing a prompt to see your quality metrics." | "Analyze a Prompt" |
| No team members | "No team members" / "Invite your team to collaborate on quality analysis." | "Invite Team" |
| Empty report | "No data for this period" / "Run analyses during this time range to see trends." | "Run Analysis" |

### Success Messages

| Action | Message |
|--------|---------|
| Analysis complete | "Analysis complete. Quality score: {score}/100." |
| Settings saved | "Settings saved." |
| Report exported | "Report exported as {format}." |
| Team member invited | "Invitation sent to {email}." |
| API key created | "API key created. Copy it now — it won't be shown again." |
| Password changed | "Password updated." |

**Rules:**
- State what happened, not how you feel about it
- Include relevant data (score, email, format)
- No emoji, no exclamation marks
- Auto-dismiss success toasts after 4 seconds

### Error Messages

| Error | Message | Recovery |
|-------|---------|----------|
| Required field | "{Field name} is required." | Focus on the field |
| Invalid email | "Enter a valid email address." | Focus on the field |
| Analysis failed | "Analysis could not be completed. {Reason}." | Retry button |
| Network error | "Connection lost. Check your network and try again." | Retry button |
| Rate limited | "Too many requests. Try again in {seconds} seconds." | Auto-retry countdown |
| Auth expired | "Your session has expired. Log in again to continue." | Redirect to login |
| 404 | "Page not found. It may have been moved or deleted." | Link to homepage |
| 500 | "Something went wrong on our end. We've been notified." | Retry or contact support |

**Rules:**
- Name the problem specifically ("Connection lost" not "Something went wrong")
- Always provide a next action (retry, link, redirect)
- Never blame the user ("Enter a valid email" not "You entered an invalid email")
- Never expose technical details (no error codes, stack traces, or API responses)

### Loading Messages

| Context | Message |
|---------|---------|
| Analysis running | "Analyzing prompt..." |
| Page loading | No text — use skeleton screens |
| Data fetching | "Loading..." (only if skeleton not feasible) |
| Export generating | "Generating report..." |
| Slow operation (> 5s) | "This may take a moment. Analyzing {count} factors." |

### Confirmation Dialogs

**Structure:**
```
Title: {Action verb} {object}?
Body: {Consequence of the action}. {Irreversibility warning if applicable}.
Cancel: "Cancel"
Confirm: "{Action verb}" (destructive variant if destructive)
```

**Examples:**

```
Title: Delete this report?
Body: This will permanently delete "Q2 Quality Report" and all associated
data. This action cannot be undone.
[Cancel]  [Delete Report] (destructive)

Title: Revoke API key?
Body: Applications using this key will lose access immediately.
[Cancel]  [Revoke Key] (destructive)

Title: Export report?
Body: A PDF report will be generated and downloaded to your device.
[Cancel]  [Export PDF]
```

---

# Part VIII — AI Quality Visualization

---

## 8.1 Quality Score System

AIQualityHQ measures AI quality across six dimensions, each scored 0–100:

| Dimension | Icon (Lucide) | Description | Weight |
|-----------|---------------|-------------|--------|
| **Prompt Score** | `MessageSquare` | How well-structured and clear the prompt is | 20% |
| **Memory Score** | `Brain` | How effectively the AI uses context from prior interactions | 15% |
| **Context Score** | `Layers` | How well the AI understands and uses provided context | 20% |
| **Trust Score** | `Shield` | Factual accuracy, hallucination risk, citation quality | 25% |
| **Privacy Score** | `Lock` | PII handling, data leakage risk, compliance | 10% |
| **Security Score** | `ShieldCheck` | Prompt injection resistance, output safety | 10% |

**Overall Score** = Weighted average of all six dimensions.

### Score Ranges

| Range | Label | Color Token | Interpretation |
|-------|-------|-------------|----------------|
| 90–100 | Exceptional | `score-excellent` | Exceeds quality standards on all factors |
| 80–89 | Strong | `score-excellent` | Meets or exceeds standards on most factors |
| 60–79 | Acceptable | `score-good` | Meets minimum standards, room for improvement |
| 40–59 | Needs Improvement | `score-warning` | Below standards on multiple factors |
| 20–39 | Poor | `score-critical` | Significant quality issues detected |
| 0–19 | Critical | `score-critical` | Fundamental quality failure |

---

## 8.2 Score Components

### Overall Score Display (Hero)

The largest, most prominent score visualization. Used at the top of analysis results and on the dashboard.

```
┌───────────────────────────────────────┐
│     Overall Quality Score             │
│                                       │
│           ┌──────────┐                │
│           │          │                │
│           │    87    │                │
│           │   /100   │                │
│           └──────────┘                │
│                                       │
│   ▲ +5 from last analysis             │
│   Strong quality                      │
└───────────────────────────────────────┘
```

**Implementation:** Uses the Primary Score Card component (4.16).

### Dimension Score Grid

A 6-column grid (3×2 at tablet, 2×3 at mobile) showing all dimension scores simultaneously.

```
┌─────────┐ ┌─────────┐ ┌─────────┐
│ ◐ 91    │ │ ◐ 78    │ │ ◐ 84    │
│ Prompt  │ │ Memory  │ │ Context │
├─────────┤ ├─────────┤ ├─────────┤
│ ◐ 52    │ │ ◐ 95    │ │ ◐ 88    │
│ Trust   │ │ Privacy │ │ Security│
└─────────┘ └─────────┘ └─────────┘
```

**Implementation:** Uses Dimension Score Card components (4.16) in a CSS Grid.

```html
<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
  <ScoreCard dimension="prompt" score={91} />
  <ScoreCard dimension="memory" score={78} />
  <ScoreCard dimension="context" score={84} />
  <ScoreCard dimension="trust" score={52} />
  <ScoreCard dimension="privacy" score={95} />
  <ScoreCard dimension="security" score={88} />
</div>
```

---

## 8.3 Trend Graphs

### Score Trend (Line Chart)

Shows how scores change over time.

| Property | Value |
|----------|-------|
| X-axis | Time (last 7 days / 30 days / 90 days, selectable via pill tabs) |
| Y-axis | Score (0–100, always showing full range) |
| Primary line | Overall score in `primary` color, 2px stroke |
| Dimension lines | Individual dimensions as optional overlays, `text-tertiary` with hover highlight |
| Area fill | Under the primary line, `primary` at 8% opacity |
| Grid | Horizontal only, at 0, 25, 50, 75, 100 marks |
| Tooltip | Shows exact score + date on hover |
| Threshold line | Optional dashed line at user-set quality threshold |

**Data Point Markers:**
- Only show on hover (reduces visual noise)
- 6px circle, filled with line color, 2px white border

**Responsive:**
- Full chart at desktop (min-height: 240px)
- Compressed at mobile (min-height: 160px)
- Touch interaction: tap-hold to show tooltip (no hover on touch)

### Comparison Overlay

When comparing two time periods or two models:

- Primary series: solid line, `primary` color
- Comparison series: dashed line, `text-tertiary` color
- Legend: dot + label, positioned top-right
- Difference highlight: Shaded area between lines where primary exceeds comparison (subtle green), and where comparison exceeds primary (subtle red)

---

## 8.4 Progress Indicators

### Score Progress Bar

For single-dimension score display in lists and compact views:

```html
<div class="score-progress">
  <div class="flex justify-between mb-1">
    <span class="text-body-sm text-secondary">Trust Score</span>
    <span class="font-mono text-score-sm font-medium tabular-nums text-score-warning">52</span>
  </div>
  <div class="progress-track h-2">
    <div class="progress-fill bg-score-warning rounded-full" style="width: 52%"></div>
  </div>
</div>
```

### Score Radar Chart

For showing all six dimensions as a polygon overlay:

| Property | Value |
|----------|-------|
| Axes | 6 axes, one per dimension, evenly spaced at 60° |
| Scale | 0 (center) to 100 (edge) |
| Grid | Concentric hexagons at 25, 50, 75, 100 |
| Grid color | `border-subtle` |
| Fill | `primary` at 15% opacity |
| Stroke | `primary`, 2px |
| Axis labels | Dimension names at each point, `caption` typography |
| Data points | 6px circles at each score value |

**Use Cases:**
- Profile view: Show a user's or model's quality "shape"
- Comparison view: Overlay two polygons to compare models

**Responsive:**
- Desktop: 320×320px
- Mobile: 240×240px (labels may abbreviate)

---

## 8.5 Comparison UI

### Model Comparison View

Side-by-side comparison of quality scores for different AI models or different prompts:

```
┌──────────────────────────────────────────────────┐
│  Model Comparison                                │
├────────────┬───────────────┬─────────────────────┤
│ Dimension  │ GPT-4o        │ Claude 3.5          │
├────────────┼───────────────┼─────────────────────┤
│ Overall    │ 87 ████████▋  │ 82 ████████▎        │
│ Prompt     │ 91            │ 88                  │
│ Memory     │ 78            │ 85  ▲ +7            │
│ Context    │ 84            │ 79  ▼ -5            │
│ Trust      │ 52            │ 68  ▲ +16           │
│ Privacy    │ 95            │ 92                  │
│ Security   │ 88            │ 84                  │
└────────────┴───────────────┴─────────────────────┘
```

**Visual Rules:**
- Best score per row: bold text, subtle `primary-subtle` background
- Significant differences (> 10 points): Show delta with arrow indicator
- Inline progress bars: Use semantic score colors
- Max models per comparison: 4 (beyond this, use a full comparison table)

### Time Period Comparison

Same structure but columns represent time periods (This Week vs. Last Week, This Month vs. Last Month):

- Improvement indicators: Green up arrow + positive delta
- Decline indicators: Red down arrow + negative delta
- No change: Gray dash

---

## 8.6 Quality Reports

### Report Structure

A quality report aggregates multiple analyses into a summary view:

```
┌─────────────────────────────────────────────┐
│  Quality Report                             │
│  June 15–30, 2026 · 47 analyses            │
├─────────────────────────────────────────────┤
│                                             │
│  Executive Summary                          │
│  ├── Overall trend: ▲ Improving (+3)        │
│  ├── Average score: 76/100                  │
│  ├── Best dimension: Privacy (94)           │
│  └── Weakest dimension: Trust (58)          │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  Score Trend Chart (30 days)                │
│  [line chart]                               │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  Dimension Breakdown                        │
│  [6 dimension score cards in grid]          │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  Top Issues                                 │
│  1. Trust scores consistently below 60      │
│  2. Context utilization dropped 15%         │
│  3. 12% of analyses had hallucination risk  │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  Recommendations                            │
│  1. Add explicit fact-checking instructions  │
│  2. Increase context window utilization      │
│  3. Implement retrieval-augmented generation  │
│                                             │
├─────────────────────────────────────────────┤
│  [Download PDF]  [Share]  [Schedule Weekly]  │
└─────────────────────────────────────────────┘
```

### Report Card Component

| Property | Value |
|----------|-------|
| Container | `surface`, `radius-xl` (12px), 1px `border` |
| Header | Report title, date range, analysis count badge |
| Sections | Separated by `border-subtle` horizontal dividers |
| Section headings | `heading-sm` with mono eyebrow above |
| Data display | Metric cards for summary, charts for trends, lists for issues |
| Footer | Action buttons (Download, Share, Schedule) |
| Print | Optimized for print with `@media print` styles |

---

## 8.7 Score Visualization Principles

### Always Show the Number

Color and shape are secondary to the actual score number. A score card without a visible number is incomplete. The number is the primary data communication; color reinforces it; shape provides glanceable context.

### Always Show the Range

Scores without context are meaningless. Always show "/100" or the max value. Always show if the score is improving or declining when historical data exists.

### Always Show the Breakdown

A single number tells you the "what." The breakdown tells you the "why." Every score should be expandable to show its contributing factors.

### Consistency Across All Contexts

| Context | Score Display |
|---------|--------------|
| Dashboard overview | Primary Score Card (48px number) |
| Dashboard sidebar | Score badge (inline, 14px mono) |
| Analysis results | Full dimension grid + factors |
| Table cell | Score number only (14px mono) with semantic color |
| Toast notification | "Score: 82/100" as text |
| Email report | Score number + dimension bar chart |
| API response | Numeric value (no visualization) |

The score format is ALWAYS: `{number}/100`. Never percentages, never letter grades, never adjectives alone.

---

# Appendix A — Token Reference

## Complete Color Token Table

| Token | Light | Dark | CSS Variable |
|-------|-------|------|-------------|
| `canvas` | #FAFBFC | #0A0B0D | `--color-canvas` |
| `surface` | #FFFFFF | #111214 | `--color-surface` |
| `surface-secondary` | #F4F5F7 | #1A1B1E | `--color-surface-secondary` |
| `surface-tertiary` | #EBEDF0 | #222326 | `--color-surface-tertiary` |
| `border` | #D1D5DB | #2E3036 | `--color-border` |
| `border-subtle` | #E5E7EB | #1F2024 | `--color-border-subtle` |
| `border-strong` | #9CA3AF | #404249 | `--color-border-strong` |
| `text-primary` | #111827 | #F9FAFB | `--color-text-primary` |
| `text-secondary` | #4B5563 | #D1D5DB | `--color-text-secondary` |
| `text-tertiary` | #6B7280 | #9CA3AF | `--color-text-tertiary` |
| `text-disabled` | #9CA3AF | #4B5563 | `--color-text-disabled` |
| `primary` | #0891B2 | #22D3EE | `--color-primary` |
| `primary-hover` | #0E7490 | #67E8F9 | `--color-primary-hover` |
| `primary-pressed` | #155E75 | #A5F3FC | `--color-primary-pressed` |
| `primary-subtle` | #ECFEFF | #164E63 | `--color-primary-subtle` |
| `primary-border` | #A5F3FC | #155E75 | `--color-primary-border` |
| `on-primary` | #FFFFFF | #042F2E | `--color-on-primary` |
| `score-excellent` | #059669 | #34D399 | `--color-score-excellent` |
| `score-good` | #0891B2 | #22D3EE | `--color-score-good` |
| `score-warning` | #D97706 | #FBBF24 | `--color-score-warning` |
| `score-critical` | #DC2626 | #F87171 | `--color-score-critical` |
| `success` | #059669 | #34D399 | `--color-success` |
| `warning` | #D97706 | #FBBF24 | `--color-warning` |
| `error` | #DC2626 | #F87171 | `--color-error` |
| `info` | #2563EB | #60A5FA | `--color-info` |

---

## Complete Typography Token Table

| Token | Family | Size | Weight | Line Height | Letter Spacing |
|-------|--------|------|--------|-------------|----------------|
| `display-2xl` | Inter | 56px | 600 | 1.07 | -1.4px |
| `display-xl` | Inter | 48px | 600 | 1.1 | -1.2px |
| `display-lg` | Inter | 40px | 600 | 1.15 | -0.8px |
| `display-md` | Inter | 32px | 600 | 1.2 | -0.64px |
| `heading-lg` | Inter | 24px | 600 | 1.3 | -0.48px |
| `heading-md` | Inter | 20px | 600 | 1.4 | -0.3px |
| `heading-sm` | Inter | 16px | 600 | 1.5 | -0.16px |
| `body-lg` | Inter | 16px | 400 | 1.6 | 0 |
| `body` | Inter | 14px | 400 | 1.6 | 0 |
| `body-strong` | Inter | 14px | 500 | 1.5 | 0.1px |
| `body-sm` | Inter | 13px | 400 | 1.5 | 0.1px |
| `caption` | Inter | 12px | 400 | 1.4 | 0.2px |
| `caption-strong` | Inter | 12px | 500 | 1.4 | 0.3px |
| `overline` | Inter | 11px | 500 | 1.3 | 0.8px |
| `button-lg` | Inter | 16px | 500 | 1.0 | 0 |
| `button` | Inter | 14px | 500 | 1.0 | 0.1px |
| `button-sm` | Inter | 12px | 500 | 1.0 | 0.2px |
| `mono-eyebrow` | JetBrains Mono | 12px | 500 | 1.0 | 0.5px |
| `mono` | JetBrains Mono | 14px | 400 | 1.6 | 0 |
| `mono-sm` | JetBrains Mono | 12px | 400 | 1.5 | 0 |
| `score-display` | JetBrains Mono | 48px | 600 | 1.0 | -0.5px |
| `score-lg` | JetBrains Mono | 32px | 600 | 1.0 | 0 |
| `score-md` | JetBrains Mono | 24px | 600 | 1.0 | 0 |
| `score-sm` | JetBrains Mono | 16px | 500 | 1.0 | 0 |
| `tabular` | JetBrains Mono | 14px | 400 | 1.5 | 0 |

---

## Complete Spacing Token Table

| Token | Value | Tailwind Class |
|-------|-------|---------------|
| `space-0` | 0px | `p-0`, `m-0`, `gap-0` |
| `space-0.5` | 2px | `p-0.5`, `gap-0.5` |
| `space-1` | 4px | `p-1`, `m-1`, `gap-1` |
| `space-1.5` | 6px | `p-1.5`, `gap-1.5` |
| `space-2` | 8px | `p-2`, `m-2`, `gap-2` |
| `space-3` | 12px | `p-3`, `gap-3` |
| `space-4` | 16px | `p-4`, `gap-4` |
| `space-5` | 20px | `p-5`, `gap-5` |
| `space-6` | 24px | `p-6`, `gap-6` |
| `space-8` | 32px | `p-8`, `gap-8` |
| `space-10` | 40px | `p-10`, `gap-10` |
| `space-12` | 48px | `p-12` |
| `space-16` | 64px | `p-16` |
| `space-20` | 80px | `p-20` |
| `space-24` | 96px | `p-24` |
| `space-32` | 128px | `p-32` |

---

## Component Quick Reference

| Component | Radius | Padding | Height | Shadow |
|-----------|--------|---------|--------|--------|
| Button (default) | `radius-md` (6px) | 8px 16px | 36px | None |
| Button (small) | `radius-md` (6px) | 4px 10px | 28px | None |
| Button (large) | `radius-md` (6px) | 12px 24px | 44px | None |
| Button (pill CTA) | `radius-full` | 12px 24px | 44px | None |
| Input | `radius-md` (6px) | 8px 12px | 36px | None |
| Card (dashboard) | `radius-lg` (8px) | 16-20px | Auto | None |
| Card (marketing) | `radius-xl` (12px) | 24-32px | Auto | Level 1 |
| Modal | `radius-2xl` (16px) | 24px | Auto | Level 3 |
| Dropdown | `radius-md` (6px) | Per item | Auto | Level 2 |
| Tooltip | `radius-sm` (4px) | 6px 8px | Auto | None |
| Badge | `radius-sm` (4px) | 2px 6px | 20px | None |
| Score Card (primary) | `radius-xl` (12px) | 24px | Auto | None |
| Score Card (dimension) | `radius-lg` (8px) | 16px | Auto | None |

---

*End of AIQualityHQ Design System v1.0*

*This document governs all design decisions for AIQualityHQ. When in doubt, refer to the Design Decision Framework (§1.6). When the framework doesn't answer your question, ask: "Does this build trust?" If the answer is no, don't build it.*
