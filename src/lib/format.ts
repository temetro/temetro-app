// Truncate a wallet number for display, MetaMask-style (tmw_ABCD…WXYZ).
export function shortWallet(walletNumber: string): string {
  if (walletNumber.length <= 18) return walletNumber;
  return `${walletNumber.slice(0, 12)}…${walletNumber.slice(-6)}`;
}

// Format an ISO date (YYYY-MM-DD) as a short, human label, e.g. "May 20, 2026".
// Falls back to the raw string if it can't be parsed.
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Human label for a share mode + duration.
export function shareModeLabel(
  mode: 'permanent' | 'temporary',
  durationHours?: number | null,
): string {
  if (mode === 'temporary') {
    return durationHours ? `Temporary · ${durationHours}h` : 'Temporary';
  }
  return 'Permanent';
}
