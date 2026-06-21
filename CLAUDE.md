@AGENTS.md

# temetro-app — patient wallet (Expo)

The **patient companion app** for temetro: a decentralized **wallet** that stores a patient's
medical record **on their own device, encrypted**, and shares it with a clinic only when the patient
approves a request on their phone. It is the device side of the "patient-owned data model" in the
clinic monorepo at `~/Desktop/temetro-mono` (see that repo's root `CLAUDE.md`).

## Hard requirements (do not deviate)

- **Build the UI with `@expo/ui`** (the universal native components — `Host`, `Column`, `Row`,
  `Text`, `Button`, `List`/`ListItem`, `Switch`, `Picker`, `Spacer`, `ScrollView`), so the app renders
  **real native UI** (SwiftUI on iOS, Jetpack Compose on Android) rather than styled `View`s. Every
  `@expo/ui` tree must be wrapped in `<Host>`. Use the `expo:expo-ui` skill before writing UI, and
  read the installed component `.d.ts` in `node_modules/@expo/ui/build/universal/*` — the API is
  versioned with the SDK and is the source of truth.
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
  connects the relay, and exposes `approve`/`deny`/`updateRecord`/`reset`. The two tabs
  (`src/app/index.tsx` = Wallet, `src/app/explore.tsx` = Identity) consume it.

## Config

- The backend relay URL comes from `EXPO_PUBLIC_API_URL` (`src/lib/config.ts`, default
  `http://localhost:4000`). On a physical device set it to your machine's LAN IP.

## Commands

```bash
npm run ios      # build + run on iOS (SDK 56 @expo/ui works in Expo Go too: npm start)
npm run android
npx tsc --noEmit # typecheck (the two pre-existing *.css side-effect-import errors are from the starter)
```

## Not built yet

Manual record editing in-app, QR pairing, and a clinic→wallet push of signed updates. The current
flow seeds a sample record and focuses on the share-approval path.
