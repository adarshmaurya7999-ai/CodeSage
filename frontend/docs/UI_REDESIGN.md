# CodeSage UI Redesign Guide

Design refresh for engagement, clarity, and performance **without changing the existing color palette** (`--accent`, `--bg-*`, severity colors).

**Implementation paths:**
- Tokens & CSS: `frontend/styles/design-system.css`
- React primitives: `frontend/components/ui/`
- Wired in: `PRSelectorModal`, `GitHubSignInButton`, `FindingsDock`, `AIFindingsPanel`, `DangerScorePopover`

---

## 1. Buttons

### Description
Unified button primitive with variants (primary, secondary, ghost, danger), sizes, loading state, and GPU-friendly hover/active feedback (`transform` only).

### Annotated snippet

```tsx
// frontend/components/ui/Button.tsx
<Button
  variant="primary"      // uses --accent / --accent-hover
  size="md"              // sm | md | lg
  loading={analyzing}
  loadingLabel="Analyzing…"
  leftIcon={<Sparkle />}
  disabled={!canAnalyze}
  onClick={handleStart}
>
  Start analysis
</Button>
```

```css
/* design-system.css — motion on transform, not layout properties */
.cs-btn:hover:not(:disabled) {
  transform: translate3d(0, -1px, 0);
}
.cs-btn:active:not(:disabled) {
  transform: translate3d(0, 0, 0) scale(0.98);
}
```

### Performance notes
- `will-change: transform` on buttons limits repaints to compositor layer.
- No width/height transitions (avoids layout thrash).
- Loading state disables pointer events instead of double-submit handlers.

### Accessibility
- `aria-busy` when `loading`.
- `:focus-visible` via `.cs-focus-ring` (2px accent ring).
- `prefers-reduced-motion`: hover scale disabled.
- **Fallback:** flat buttons in older browsers still work; transforms are progressive enhancement.

---

## 2. Forms

### Description
Consistent field spacing, label hierarchy, and search styling aligned with PR selector flows.

### Annotated snippet

```tsx
<Input
  type="search"
  label="Repository"           // optional; wires htmlFor + id
  placeholder="Search repositories…"
  aria-label="Search repositories"
  inputClassName="cs-input--search"
  error={errorMessage}         // role="alert" on error text
/>
```

```css
.cs-input:focus {
  border-color: var(--accent);
  box-shadow: var(--focus-ring); /* 0 0 0 2px rgba(0, 212, 170, 0.35) */
}
```

### Performance notes
- Border/shadow transitions only (cheap).
- No JS validation framework required for simple flows.

### Accessibility
- Associated `<label>` when `label` prop set.
- `aria-invalid` + `aria-describedby` for errors.
- Search inputs get explicit `aria-label` when no visible label (PR modal).
- **Fallback:** native `<input>` semantics unchanged.

---

## 3. Modals

### Description
Portal dialog with backdrop fade, panel slide-in, Escape to close, body scroll lock, and focus restore on exit.

### Annotated snippet

```tsx
<Modal
  open={open}
  onClose={onClose}
  title="Select Repository"
  subtitle={<>Repo → PR breadcrumb</>}
  size="md"
  initialFocus="first-focusable"  // focuses search on open
>
  <Input type="search" … />
  <ul role="listbox" aria-label="Repositories">
    <button className="cs-modal-list-item">…</button>
  </ul>
</Modal>
```

```css
@supports (backdrop-filter: blur(4px)) {
  .cs-modal-backdrop { backdrop-filter: blur(4px); }
}
@keyframes cs-modal-in {
  from { opacity: 0; transform: translate3d(0, 12px, 0) scale(0.98); }
  to   { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}
```

### Performance notes
- Animations use `transform` + `opacity` (compositor-friendly).
- Single portal mount; no nested layout reads in animation loop.
- Mobile: sheet-style `cs-modal-in-mobile` (translateY only).

### Accessibility
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.
- Escape key handler; backdrop button `aria-label="Close dialog"`.
- Focus returns to trigger on close.
- List rows: `role="listbox"` on container (PR picker).
- **Fallback:** `@supports not (backdrop-filter)` → opaque `rgba(19,21,28,0.95)` backdrop.

---

## 4. Navigation

### Description
Three-zone top bar retained; chips and nav pills use `.nav-pop` / `.cs-nav-pop` lift on hover. Responsive rules stack center nav below 768px and hide context chips on small screens.

### Annotated snippet

```tsx
// TopBar — existing structure + design tokens
<ContextChip label="Repository" value={repo} />  {/* .top-bar__chip.nav-pop */}
<button className="top-bar__nav-item nav-pop nav-tab-hover">…</button>
```

```css
@media (max-width: 768px) {
  .top-bar { grid-template-columns: 1fr auto; }
  .top-bar__zone--center { grid-column: 1 / -1; order: 3; }
  .top-bar__context { display: none; }
}
```

### Performance notes
- Sticky bar uses `backdrop-filter` with solid fallback (see `@supports not`).
- Hover lift uses `translate3d` (no margin changes).

### Accessibility
- `<nav aria-label="Main">` preserved.
- Active tab: `top-bar__nav-item--active` (color + background, not color-only).
- Keyboard: focus rings on all interactive controls.
- **Fallback:** grid degrades to two-row layout without JS.

---

## 5. Loaders

### Description
Shimmer skeleton rows replace ad-hoc `animate-pulse` blocks; spinner for inline button loading.

### Annotated snippet

```tsx
<SkeletonList count={6} />   {/* role="status" aria-label="Loading content" */}

<Spinner size="sm" aria-label="Loading" />
```

```css
.cs-skeleton {
  background: linear-gradient(90deg, var(--bg-sidebar), var(--bg-card), var(--bg-sidebar));
  background-size: 200% 100%;
  animation: cs-shimmer 1.4s ease-in-out infinite;
}
```

### Performance notes
- CSS gradient animation (no React re-renders).
- `prefers-reduced-motion`: shimmer disabled; spinner slows slightly.

### Accessibility
- `role="status"` on skeleton lists and spinners.
- `aria-live="polite"` on analysis panel status text.
- **Fallback:** static gray blocks if animations disabled.

---

## Typography & spacing (global)

```css
:root {
  --text-body: 0.8125rem;
  --leading-body: 1.5;
  --space-1 … --space-8;
}
body {
  font-size: var(--text-body);
  line-height: var(--leading-body);
  -webkit-font-smoothing: antialiased;
}
```

**Why:** Slightly increased line-height improves scanability of findings and chat without new fonts.

---

## Responsiveness summary

| Breakpoint | Behavior |
|------------|----------|
| ≤768px | Top bar stacks; context chips hidden; sidebar max 85vw |
| ≤480px | Modals slide from bottom (sheet pattern) |

---

## Browser fallbacks checklist

| Feature | Strategy |
|---------|----------|
| `backdrop-filter` | Opaque background via `@supports not` |
| `transform` hover | Buttons remain clickable; no motion required |
| `prefers-reduced-motion` | Disable lifts, modal slide, shimmer |
| Portal modals | Progressive; core content still in DOM tree when open |

---

## Adoption checklist for new UI

1. Import from `@/components/ui`.
2. Prefer `.cs-*` classes over one-off Tailwind for shared patterns.
3. Add `cs-focus-ring` to custom interactive elements.
4. Test with keyboard (Tab, Escape) and VoiceOver/NVDA labels.
5. Verify at 375px, 768px, and 1280px widths.
