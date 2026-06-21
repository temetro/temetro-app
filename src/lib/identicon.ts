// Deterministic two-color gradient derived from a public key — a lightweight,
// dependency-free MetaMask-style avatar. Same key always yields the same colors.

function hslToHex(h: number, s: number, l: number): string {
  const ll = l / 100;
  const a = (s * Math.min(ll, 1 - ll)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = ll - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function identiconColors(publicKeyHex: string): { from: string; to: string } {
  const h1 = parseInt(publicKeyHex.slice(0, 4) || '0', 16) % 360;
  const h2 = (h1 + 45) % 360;
  return { from: hslToHex(h1, 78, 58), to: hslToHex(h2, 74, 44) };
}
