# Ask Sage — UI & Animation Guide

Branded chat entry: circular Sage avatar (`SageAvatar`) inside `AskSageButton`, wired from `TopBar`. Thinking state mirrors existing `isSending` via `SageSendingMirror` (read-only, no API changes).

**Files:** `SageAvatar.tsx`, `AskSageButton.tsx`, `ask-sage.css`, `lib/sage-ui-store.ts`, `public/sage-avatar.png`.

---

## Idle

**Description:** Subtle breathe on avatar image, orb glow pulse, dashed hair-sway ring.

```tsx
<SageAvatar isThinking={false} isResponding={false} isInteract={false} />
```

```css
.sage-avatar__img { animation: sage-breathe 4s ease-in-out infinite; }
.sage-avatar__orb-glow { animation: sage-orb-pulse 3.5s ease-in-out infinite; }
.sage-avatar__hair-sway { animation: sage-hair-sway 6s ease-in-out infinite; }
```

**Performance:** `transform` + `opacity` only (`scale3d`, `translate3d`, `rotate`); `will-change` on animated layers.

**Accessibility:** `role="img"` + `aria-label="Sage bot avatar"` on frame; decorative layers `aria-hidden`.

---

## Interaction (hover / focus / click)

**Description:** Frame tilt + accent ring, orb flare, `--interact` class from pointer/keyboard.

```tsx
<SageAvatar isInteract={isHoveredOrFocused} />
```

```css
.sage-avatar--interact .sage-avatar__frame {
  transform: rotate(-6deg) scale(1.04);
}
.sage-avatar--interact .sage-avatar__orb-glow {
  animation: sage-orb-flare 0.28s ease-out forwards;
}
```

**Performance:** 220–280ms; no width/height/top/left animation.

**Accessibility:** `:focus-visible` on parent button mirrors hover; Enter/Space triggers `onClick` only (unchanged).

---

## Response / Thinking

**Description:** Status ring pulses while `isSending`; blink + speech bubble after reply.

```tsx
// AIChatPanel — read-only mirror (does not touch handleSend)
<SageSendingMirror isSending={isSending} />

// TopBar — consumes mirrored flag
const isThinking = useSageUiThinking();
<AskSageButton isThinking={isThinking} onClick={openAiChat} />
```

```css
.sage-avatar--thinking .sage-avatar__status-ring {
  animation: sage-ring-pulse 1.2s ease-in-out infinite;
}
.sage-avatar--reply .sage-avatar__img {
  animation: sage-blink 0.45s ease-out;
}
```

**Performance:** `useSyncExternalStore` updates UI without blocking fetch; bubble uses `transform`/`opacity`.

**Accessibility:** Bubble `role="status"` + `aria-live="polite"`; reduced-motion disables keyframes.

---

## Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .sage-avatar__img, .sage-avatar__orb-glow { animation: none !important; }
}
```

**Fallback:** Static avatar; bubble text still updates via `aria-live`.
