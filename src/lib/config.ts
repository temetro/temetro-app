// Base URL of the clinic backend that hosts the encrypted-share relay. On a
// physical device, set EXPO_PUBLIC_API_URL to your machine's LAN IP (e.g.
// http://192.168.1.20:4000) since `localhost` resolves to the device itself.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
