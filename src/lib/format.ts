// Truncate a wallet number for display, MetaMask-style (tmw_ABCD…WXYZ).
export function shortWallet(walletNumber: string): string {
  if (walletNumber.length <= 18) return walletNumber;
  return `${walletNumber.slice(0, 12)}…${walletNumber.slice(-6)}`;
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
