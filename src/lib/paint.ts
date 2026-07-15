// Yield long enough for React to commit and the UI to actually paint before the
// caller starts blocking the JS thread.
//
// Needed because our key derivation (scrypt, N=2**14) blocks Hermes for a second
// or more, and @noble/hashes' own `nextTick` is an empty async function — it
// yields only to the microtask queue, which drains to exhaustion without ever
// returning to the event loop. React's scheduler posts its work as a *macrotask*,
// so a `setBusy(true)` right before scrypt never gets painted: the spinner mounts
// for zero frames and the app just looks frozen. Awaiting a real frame plus a
// macrotask gets the spinner on screen first.
export function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve, 0));
  });
}
