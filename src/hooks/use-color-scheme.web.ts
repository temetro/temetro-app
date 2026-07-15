import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 *
 * `useSyncExternalStore` is the hydration handshake: the server snapshot is
 * false and the client re-reads on hydration, which reaches the same result as
 * the old mount effect without the extra render. Support never changes for the
 * life of the page, so the subscription is a no-op.
 */
const emptySubscribe = () => () => {};

export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const colorScheme = useRNColorScheme();
  return hasHydrated ? colorScheme : 'light';
}
