import { BellOff } from 'lucide-react-native';
import { Text, View } from 'react-native';

// Notifications inbox. There's no notifications backend yet — a clinic would
// push alerts (record updates, share requests) here in the full vision. For now
// this is an empty state reachable from the home header bell.
export default function NotificationsScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-background px-10">
      <BellOff size={40} color="#9aa0a6" />
      <Text className="text-center text-base text-muted">No notifications yet.</Text>
      <Text className="text-center text-sm text-muted">
        Clinic updates and share requests will appear here.
      </Text>
    </View>
  );
}
