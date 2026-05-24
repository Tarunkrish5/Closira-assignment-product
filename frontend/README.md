# Closira Frontend — Business-Owner Mobile Dashboard

A React Native + Expo app that gives an SMB owner an at-a-glance view of
their customer conversations: incoming leads, escalations that need a human,
scheduled follow-ups, and full conversation detail with AI summary and a
status timeline.

> All data is mock — there's no real backend call. The shape of every mock
> object matches the backend's Pydantic schema, so swapping in real API calls
> is one file change (`src/mock` → `src/api`).

---

## Quick start

> Requires **Node 18+** and the **Expo Go** app on your phone (or an
> iOS/Android simulator).

```bash
cd frontend
npm install
npm start          # opens Expo dev tools
```

From the dev tools:

- **Phone** → scan the QR with Expo Go (recommended).
- **iOS simulator** → press `i`.
- **Android emulator** → press `a`.
- **Browser** → press `w` (works great for evaluators with no simulator
  installed — every screen renders in the browser too).

Type-check the project:

```bash
npm run lint       # runs tsc --noEmit (strict mode)
```

---

## Screens

| Screen | What it shows |
| --- | --- |
| **Dashboard (Home)** | KPI tiles (leads today, missed enquiries, open escalations, follow-ups due), quick-action shortcuts, scrollable recent activity feed |
| **Leads** | Filterable list of inbound conversations with channel + status pills, tap to open conversation detail |
| **Escalations** | Active escalation alerts sorted by urgency, high-urgency cards get a red accent stripe, in-card "Mark resolved" button |
| **Follow-ups** | Scheduled tasks sorted by due time, message preview, "Mark as done" button |
| **Conversation Detail** | Pushed as a stack screen from Leads / Escalations / Activity. Shows the customer header, AI summary, matched SOP, the full message thread (customer / AI / system bubbles), and the status timeline |

### Bottom-tab navigation

Four tabs — **Home / Leads / Escalations / Follow-ups** — with active/inactive
icon variants and red count badges on Escalations and Follow-ups. The
Conversation Detail screen pushes onto a stack above the tab bar.

---

## Folder structure

```
frontend/
├── App.tsx                       # SafeAreaProvider + RootNavigator
├── index.ts                      # Expo entrypoint
├── package.json
├── tsconfig.json                 # strict mode on
├── app.json                      # Expo config
└── src/
    ├── components/               # 13 reusable, single-purpose components
    │   ├── ChannelBadge.tsx      # WhatsApp / Email / Call pill
    │   ├── StatusPill.tsx        # New / Qualified / Escalated pill
    │   ├── UrgencyPill.tsx       # High / Medium / Low
    │   ├── LeadCard.tsx
    │   ├── EscalationCard.tsx
    │   ├── FollowupCard.tsx
    │   ├── StatCard.tsx          # KPI tile
    │   ├── QuickActionButton.tsx
    │   ├── ActivityItem.tsx
    │   ├── MessageBubble.tsx     # customer / AI / system variants
    │   ├── TimelineEntry.tsx     # vertical-rail status timeline row
    │   ├── ScreenHeader.tsx
    │   ├── SectionHeader.tsx
    │   ├── EmptyState.tsx
    │   └── index.ts              # barrel
    ├── screens/                  # 5 screens — every one a thin composition
    │   ├── DashboardScreen.tsx
    │   ├── LeadsScreen.tsx
    │   ├── EscalationsScreen.tsx
    │   ├── FollowupsScreen.tsx
    │   └── ConversationDetailScreen.tsx
    ├── navigation/
    │   ├── RootNavigator.tsx     # stack — Tabs + ConversationDetail
    │   ├── TabNavigator.tsx      # bottom tabs with badges
    │   └── types.ts              # typed param lists
    ├── theme/
    │   ├── colors.ts             # one place, every color
    │   ├── spacing.ts            # 4px scale + radii + shadows
    │   ├── typography.ts         # 8 text styles
    │   └── index.ts
    ├── types/index.ts            # mirrors backend Pydantic schemas
    ├── utils/time.ts             # relative + clock formatting
    └── mock/index.ts             # all mock data, API-shaped
```

No file exceeds ~250 lines; screens are pure composition of components.

---

## Styling choice — StyleSheet over NativeWind

The assignment offered both. We picked **`StyleSheet` + a centralised theme
module**, and here's why:

1. **Zero build setup.** NativeWind ships fine, but it adds a Tailwind +
   PostCSS pipeline that a reviewer might hit a snag on. With `StyleSheet`,
   `expo start` is the only command anyone needs to run, and the app comes up.
2. **TypeScript autocomplete on every token.** `colors.statusEscalated`,
   `spacing.lg`, `typography.heading` — every design token is typed, so
   refactors are safe and any typo fails at compile time.
3. **One file owns the design language.** `src/theme/colors.ts`,
   `spacing.ts`, and `typography.ts` are the entire visual system. Editing
   a brand color, tightening spacing, or scaling type up — all single-file
   changes. The same outcome with utility classes would be spread across
   every component.
4. **No magic numbers.** Every padding/margin in the app references the
   spacing scale, every color references the palette, every text style
   references the typography scale. The visual rhythm of the product stays
   consistent because the rules live in code, not in vibes.

If we needed to switch to NativeWind tomorrow, the tokens in `src/theme`
would translate directly to `tailwind.config.js` — the design system is the
hard part, the engine swap is mechanical.

---

## Design system

### Channel colors (consistent everywhere)

| Channel | Color | Soft background |
| --- | --- | --- |
| WhatsApp | `#16A34A` | `#DCFCE7` |
| Email | `#2563EB` | `#DBEAFE` |
| Call | `#D97706` | `#FEF3C7` |

### Status colors

| Status | Color |
| --- | --- |
| New | Blue (`#2563EB`) |
| Qualified | Green (`#16A34A`) |
| Escalated | Red (`#DC2626`) |
| Processing | Purple |
| Resolved | Slate |

### Type scale

`display` (28) → `title` (22) → `heading` (17) → `body` (15) → `caption` (13)
→ `tiny` (11). Three weights only — regular, medium, semibold — so titles
feel weighty without going full-bold everywhere.

### Spacing

4px base scale: `xs (4)`, `sm (8)`, `md (12)`, `lg (16)`, `xl (20)`,
`xxl (24)`, `xxxl (32)`, `huge (48)`.

Every margin and padding in the app pulls from this scale.

---

## Attention to detail

The little things that elevate a UI from "looks fine" to "feels like a real
product":

- **Empty states everywhere.** Filter to a status with no leads → a friendly
  empty state with a "try a different filter" hint. No blank screens.
- **Tab badges** on Escalations and Follow-ups so the owner sees pending
  work without opening the tab.
- **Active vs. inactive icon variants** in the tab bar (`home` ↔ `home-outline`).
- **High-urgency escalations** get a red top-border stripe so the eye finds
  them on a fast scroll.
- **Resolved / done states** dim the card and swap the action button for a
  green "Resolved" pill — the screen stays informative but feels like
  progress.
- **AI summary card** with a sparkle icon and brand tint to visually
  distinguish AI-generated content from raw conversation.
- **Mock timestamps are computed relative to "now"** at app start, so the
  feed always reads "4m ago / 12m ago / 23m ago" — it never looks stale
  when an evaluator opens the app.
- **Strict TypeScript** — every prop typed, every navigation route typed.

---

## API-readiness

Every mock entity in `src/mock/index.ts` is shaped exactly like the
corresponding backend response — `id`, `customer`, `channel`, `status`,
`receivedAt` (ISO), `messages`, etc. To go live:

1. Replace `import { mockLeads } from '../mock'` with a fetch hook.
2. Map the response into the same `Lead[]` / `Escalation[]` / `Followup[]`
   types from `src/types`.
3. Components stay untouched — they only consume props typed against those
   interfaces.

The backend in this same repo returns objects that satisfy these types,
including the `GET /enquiry/{id}/history` payload that maps 1:1 onto the
Conversation Detail screen.

---

## Trade-offs & known limitations

- **No real API calls.** Per the assignment, we focused on UI quality. The
  mock layer is structured so swapping it for `fetch` is a single-file
  change.
- **No animations beyond the default stack push transition.** A production
  build would add small Reanimated touches (stat counter rolls, pill
  enter-animations). Out of scope for an assignment focused on UI quality
  and architecture.
- **No infinite scroll / pagination.** The lists are short by design.
  `FlatList` is already in place, so wiring `onEndReached` to a paginated
  API is mechanical.
- **No persistence.** Mark-as-resolved / mark-as-done flips local component
  state. With a real backend the same handler would POST to
  `/enquiry/{id}/escalate` or update the follow-up record.
- **No icons asset bundle.** Uses `@expo/vector-icons` (Ionicons) which is
  bundled with Expo — no custom icon files needed.
- **App icon / splash use Expo defaults.** Branding is out of scope for the
  assignment.

---

## Engineering decisions, in one place

1. **Expo over bare React Native** — one-command setup for any reviewer
   without Xcode / Android Studio configured.
2. **TypeScript strict mode** — every prop, every route, every theme token
   is type-checked.
3. **Thin screens, fat components** — no screen file exceeds ~200 lines.
   Every section of a screen is its own component.
4. **Typed navigation** — `RootStackParamList` + `TabParamList` mean every
   `navigate(...)` call is type-checked.
5. **Centralised theme** — colors / spacing / typography live in
   `src/theme`. Components reference tokens, never magic numbers.
6. **Mock layer shaped like the API** — swapping mocks for live data is a
   one-file change.
7. **Empty states + loading states baked in** — the lists handle zero items
   gracefully, which is the smallest detail that separates "demo" from
   "product".

---

## Capturing screenshots / recordings

To capture the screens for your submission:

- **iOS Simulator**: `Cmd+S` saves a screenshot to your Desktop. For a
  recording: File → New Screen Recording.
- **Expo Go on a real phone**: take a screenshot the normal way; use
  iOS's built-in screen recorder or Android's "Screen record" tile.
- **Browser (`npm start` + `w`)**: any OS-level screenshot/recording tool.

Drop captures into `frontend/screenshots/` and link them from this README.
