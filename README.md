# temetro wallet

The **patient companion app** for [temetro](https://github.com/temetro/temetro) —
the open-source AI middleman between clinicians and patient data. This app makes
the **patient-owned data model** real: a patient's record lives **encrypted on
their own device**, and clinics can only read or change it with the patient's
explicit, on-device approval.

This is its **own repository**, separate from the product monorepo.

## How it works

- 🔑 **Your identity is a keypair.** The patient holds an **Ed25519** keypair;
  the public key (base58check, `tmw_…`) is their **wallet number**.
- 🔒 **Records are encrypted on-device.** The record never leaves the phone in
  the clear. Sharing seals it to a clinic's ephemeral key over the temetro
  relay, which only ever forwards **ciphertext**.
- ✅ **Patient approves every share.** A clinic requests a record; the patient
  approves on their phone; the sealed record is delivered. Temporary shares can
  auto-delete — possible precisely because records are **off-chain**.

> "Decentralization" here means keys and data live on the patient's device and
> the relay forwards only ciphertext — it is **not** a literal blockchain. The
> wire format mirrors the backend's `wallet-crypto` exactly.

## Stack

An **Expo (SDK 56)** app. The UI **must be built with [HeroUI
Native](https://www.heroui.com/)** (`heroui-native` + Uniwind/Tailwind) — a hard
requirement; the only exception is the native tab bar (expo-router
`NativeTabs`). See [`CLAUDE.md`](./CLAUDE.md) for details.

## Develop

```bash
npm install
npx expo start
```

From the Expo output, open the app in a development build, an iOS simulator, an
Android emulator, or Expo Go. Development is file-based routing under `app/`.

## Related repositories

- **Product (monorepo):** <https://github.com/temetro/temetro>
- **Documentation:** <https://docs.temetro.com>

## License

[MIT](./LICENSE).
