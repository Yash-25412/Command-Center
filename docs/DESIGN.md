# Design system: Runway

**Direction:** adult luxury glass, laid out as a runway. An obsidian ground with faint
ambient light, frosted panels with 1px translucent borders, a pearl/moonstone accent, and
**scarlet only for carried (overdue) items**. Time reads left to right.

Source of truth: `src/app/globals.css` (tokens and component classes) and
`tailwind.config.ts` (Tailwind names mapped to the tokens). The interactive prototype is
board 03 on the design canvas (see `CLAUDE.md` §6).

## Tokens (CSS variables on `:root`)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#07080a` | Page ground (plus three faint radial glows on `body`) |
| `--glass` | `rgba(18,20,24,0.55)` | Panel fill, always with `backdrop-filter: blur(28px) saturate(150%)` |
| `--glass-line` / `--glass-line2` | `rgba(255,255,255,.08)` / `.18` | Panel border / control border |
| `--ink` / `--ink2` / `--ink3` | `#e9ecef` / `#aeb5bc` / `#9aa3ab` | Text: primary / secondary / labels and meta |
| `--accent` | `#dce8ef` (pearl) | Interactive state, completion, rings. Primary buttons use the gradient `#f4f7f9 → #c9dae4` with dark text `#07080a`. |
| `--red` | `#ff8c8f` (glow `rgba(255,90,95,…)`) | **Only** carried / overdue items and destructive actions |
| `--amber` | `#e9c38a` | Follow-ups, waiting, stale, "needs attention" |
| `--teal` / `--green` | `#9dd3c8` | Decisions ("why"), recovery, low load |
| Life skill tints | piano `#e9d9c3`, handstand `#9dd3c8`, dragon flag `#f2b8a0`, marathon `#b8c7e8` | Only inside Life Mastery |

**Type:** Manrope (`font-sans`, also aliased as `font-serif` so old headings pick it up)
and DM Mono (`font-mono`) for numbers, dates and eyebrow labels.

- **Page title:** `text-[clamp(30px,3.8vw,52px)] font-light tracking-[-0.03em]`, with an
  `eyebrow` above it.
- **Body text:** 14px.
- **Meta text:** 12–12.5px in `ink3`.

**Radius:** day columns 26px · panels 22–24px · cards 14–16px · pills and buttons 999px.

## Component classes (`globals.css`)

| Class | What it is |
|---|---|
| `glass` | A frosted panel. Pair it with `rounded-[24px] p-5`. |
| `card` | Legacy panel class, also restyled as glass. Used by older pages (task and project detail). |
| `eyebrow` | Small mono uppercase label (11px, 0.18em tracking, ink3). |
| `seg`, `seg-on` | Segmented-control item. The on state is the pearl gradient pill. Used for top nav, Work/Life, tabs. |
| `pill`, `pill-on` | Filter chip / option toggle. |
| `btn`, `btn-pri`, `btn-sm` | Pill buttons; `btn-pri` = pearl gradient. |
| `field` | Inputs, selects and textareas. Native `<select>` options are forced dark. |
| `chk`, `chk-on`, `chk-late` | Round checkbox; on = pearl glow; late = pulsing scarlet ring. |
| `carried` | Scarlet tint and pulse for carried items. Combined with `is-done` it settles to pearl. |
| `is-done` (+ `.ttl` inside) | Dims the row and strikes through the title. |
| `col-card` | Hover lift for cards. |
| `runway` | Horizontal scroll-snap container for day columns. |
| `rise` | Entrance animation. Respects `prefers-reduced-motion`. |
| `chip`, `chip-*` | Legacy status chips, still used on task detail. |

## Patterns

- **Section card:** `glass rounded-[24px] p-5` → an `eyebrow` header row (label on the
  left, mono meta on the right) → content.
- **Day column:** `glass w-[260px] min-h-[520px] rounded-[26px] p-5`: an eyebrow weekday,
  then a 46px light date.
- **Instant toggles:** flip local state first, then call the server action (see `useLocal`).
- **Rings:** SVG with `r=34`, `stroke-dasharray = (2πr·p) (2πr)`, rotated −90°.
- **Empty states** use one calm line in `ink3` ("Open runway", "Inbox zero…"), never an
  illustration.

## Do and don't

- **Do** reuse the classes above. **Don't** introduce new hues; the palette is deliberately
  small.
- **Don't** use scarlet for anything except carried items and delete.
- **Don't** add decorative widgets or numbers that aren't backed by real data.
- **Don't** use Tailwind opacity modifiers on token colours (`bg-red/40`); they compile to
  nothing. Use `bg-[rgba(…)]` instead.
- Keep touch targets at 44px or more for primary actions, give icon-only buttons an
  `aria-label`, and use real `<button>` / `<a>` elements.

## The other direction: Midnight Noir

Near-black glass with a warm champagne accent (`#D9BE86`), Inter Tight and JetBrains Mono.
It was the close runner-up and is saved as a standalone **Design System** artifact for
future projects (link in `CLAUDE.md` §6). Don't mix it into this app.
