@AGENTS.md

# temetro-app — patient wallet (Expo)

The **patient companion app** for temetro: a decentralized **wallet** that stores a patient's
medical record **on their own device, encrypted**, and shares it with a clinic only when the patient
approves a request on their phone. It is the device side of the "patient-owned data model" in the
clinic monorepo at `~/Desktop/temetro-mono` (see that repo's root `CLAUDE.md`).

## Hard requirements (do not deviate)

- **Build the UI with HeroUI Native** (`heroui-native`) — the React Native component library built
  on **Uniwind (Tailwind for React Native)**. Use its components (`Card`, `Button`, `BottomSheet`,
  `ListGroup`, `Surface`, `Switch`, `TextField`/`Input`, `RadioGroup`, `Separator`, …) styled with
  `className`, **not** `@expo/ui`. Use the **`heroui-native` skill** before writing UI (run its
  `scripts/get_component_docs.mjs <Name>` to fetch the exact anatomy/props) and follow the compound
  pattern (`Card.Body`, `ListGroup.Item`, …). Setup that must stay intact: `src/global.css`
  (`@import 'tailwindcss'/'uniwind'/'heroui-native/styles'`; the accent is HeroUI Native's
  **default blue** — we do NOT override `--accent`, and `src/lib/theme.ts` mirrors that blue),
  `metro.config.js` (`withUniwindConfig`, the **outermost** wrapper), and the root providers in
  `src/app/_layout.tsx` (`GestureHandlerRootView` → `HeroUINativeProvider`). Color icons
  (`lucide-react-native`) via the `color` prop using `useThemeColor(...)`, not `className`.
- **The native tab bar is one exception**: it uses expo-router's `NativeTabs`
  (`expo-router/unstable-native-tabs`) in `src/app/(tabs)/_layout.tsx` for a real UITabBar /
  Material BottomNavigation, with **SF Symbols** (`sf=`) on iOS and `drawable=` fallbacks on Android.
- **The home header icon buttons are the other exception**: the Settings + Notifications buttons on
  the home screen (`src/components/header-icon-button.tsx`) render Apple's native **Liquid Glass**
  material via **`expo-glass-effect`** (`GlassView`, guarded by `isLiquidGlassAvailable()`), with a
  `bg-surface` fallback on older iOS / Android. This was an explicit product decision. (`@expo/ui`
  was tried here but its universal `Button` can't render Liquid Glass, so it was removed — do not
  reintroduce `@expo/ui`.)
- **Icons are `lucide-react-native`** in-screen (clean SVG set) + SF Symbols on the tab bar. Do not
  reintroduce the old PNG tab icons.
- **Target Expo SDK 56.** All `expo-*` packages are pinned to `~56.x`. Before writing any Expo code,
  read the versioned docs at https://docs.expo.dev/versions/v56.0.0/ (see `AGENTS.md`).

## Architecture

- **Identity = an Ed25519 keypair.** Generated on first launch; the private key + a symmetric
  record key live in the OS keychain/keystore via `expo-secure-store` and never leave the device.
  The public key, base58check-encoded with a `tmw_` prefix, is the patient's **wallet number**.
  → `src/lib/wallet.ts`, `src/lib/crypto.ts`.
- **Record storage.** The patient's record (shape mirrors the clinic's `Patient`,
  `src/lib/types.ts`) is stored as a **single encrypted blob** (XChaCha20-Poly1305) in the document
  directory via `expo-file-system` — ciphertext at rest, decrypted only in memory.
  → `src/lib/records.ts`.
- **Sharing (WalletConnect-style relay).** The app connects over `socket.io-client` to the clinic
  backend's **`/wallet`** namespace (`src/lib/relay.ts`), proving control of the wallet by signing a
  server-issued challenge. When a clinic requests an import, the app shows an approval prompt; on
  approve it **signs** the record bundle (provenance) and **seals** it to the clinic's per-request
  ephemeral X25519 key (privacy) so the relay only ever forwards ciphertext. Temporary shares are
  auto-deleted by the clinic after their window.
- **Crypto wire format** in `src/lib/crypto.ts` is a deliberate mirror of the clinic backend's
  `backend/src/lib/wallet-crypto.ts` (same `@noble` primitives, base58check, sealed-box layout) so a
  bundle sealed + signed here decrypts + verifies there. Import `@noble/*` with explicit `.js`
  subpaths (e.g. `@noble/curves/ed25519.js`). `react-native-get-random-values` is imported at the
  top of `crypto.ts` to polyfill `crypto.getRandomValues`.
- **State.** `src/lib/wallet-context.tsx` is a React context that loads the identity + record,
  connects the relay, and exposes `ready`/`registered`/`register`/`approve`/`deny`/
  `respondToPairing`/`updateRecord`/`setRelayUrl`/`reset`.
- **Registration.** First launch runs onboarding (`src/lib/onboarding.ts`) then a **registration**
  screen (`src/app/register.tsx`) that captures name/DOB/sex and mints the first record via
  `register()` (seeded with `SAMPLE_PATIENT` demo data, see `src/lib/sample.ts`
  `buildPatientFromProfile`). The `temetro.registered` flag lives in `src/lib/registration.ts`;
  `reset()` wipes keys + record + flag so the user re-registers.

## UI — HeroUI Native (hard requirement)

Routing is a root **Stack** in `src/app/_layout.tsx` (with an auth-style `GateRedirector`:
onboarding → register → tabs) wrapping a `(tabs)` group:

- `src/app/(tabs)/index.tsx` — **Home**: settings button (top-left), copyable wallet-number chip
  (top-right), and a 2×2 grid of HeroUI `Card`s (Visits, Prescriptions, Appointments, Documents)
  that push detail routes.
- `src/app/(tabs)/camera.tsx` — **Scan**: `expo-camera` `CameraView` + a HeroUI `BottomSheet` that
  reviews exactly what will be shared before approving (reuses `parsePairingUri`/`respondToPairing`).
- `src/app/(tabs)/settings.tsx` — **Settings**: HeroUI `ListGroup` rows (wallet number/fingerprint
  copy, relay editor in a `BottomSheet`, dark-mode `Switch` via `Uniwind.setTheme`, reset wallet).
- Detail routes `src/app/{visits,prescriptions,appointments,documents}.tsx` share
  `src/components/detail-list.tsx` and read from the record / local demo data.

Screens are **single cross-platform files** (no `.ios`/`.android` splits). Shared bits:
`src/lib/{theme,identicon,format}.ts`.

## Config & relay discovery

- **Zero-config for users.** The relay URL is baked into `app.json` `expo.extra.relayUrl` (read via
  `expo-constants`). `src/lib/config.ts` resolves: in-app override (secure-store) → `EXPO_PUBLIC_API_URL`
  (**dev only**) → `extra.relayUrl` → `http://localhost:4000`. Users can change it on **Identity →
  Network**, or just **scan a clinic's QR** (the pairing URI carries that clinic's URL).
- **QR pairing.** `src/lib/relay.ts` `parsePairingUri` + `respondToPairing` connect to the scanned
  clinic's relay, authenticate, and submit the sealed bundle — no wallet number typed.

## Commands

```bash
npm run ios      # build + run on iOS (needs a dev build — HeroUI Native pulls in svg/gesture-handler)
npm run android
```

> HeroUI Native + Uniwind compute styles at build time via Metro; the `uniwind-types.d.ts` that
> makes `className` typecheck is **generated when Metro runs**. Run the app once before relying on
> `npx tsc --noEmit`.

## Not built yet

In-app record editing and a clinic→wallet push of signed updates. Appointments + documents are
local demo data (`src/lib/sample.ts`), not yet part of the shared record. The current flow seeds a
sample record at registration and focuses on the share-approval path.
