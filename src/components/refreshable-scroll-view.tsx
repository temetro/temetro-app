import { useThemeColor } from 'heroui-native';
import { forwardRef, useCallback, useState } from 'react';
import { RefreshControl, ScrollView, type ScrollViewProps } from 'react-native';

type Props = ScrollViewProps & {
  // Re-load the screen's data. The spinner shows until this resolves (with a
  // short floor so the pull reads as intentional).
  onRefresh?: () => void | Promise<void>;
};

// Drop-in ScrollView with pull-to-refresh. Screens pass `onRefresh` to re-load
// their data; a spinner appears at the top as the user pulls down.
export const RefreshableScrollView = forwardRef<ScrollView, Props>(
  function RefreshableScrollView({ onRefresh, children, ...props }, ref) {
    const [accent, muted] = useThemeColor(['accent', 'muted']);
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
      if (!onRefresh) return;
      setRefreshing(true);
      try {
        await Promise.all([
          Promise.resolve(onRefresh()),
          new Promise((resolve) => setTimeout(resolve, 500)),
        ]);
      } finally {
        setRefreshing(false);
      }
    }, [onRefresh]);

    return (
      <ScrollView
        ref={ref}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={muted}
              colors={[accent]}
            />
          ) : undefined
        }
        {...props}>
        {children}
      </ScrollView>
    );
  },
);
