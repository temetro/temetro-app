import { Image } from 'expo-image';

// The temetro app mark (rounded blue chevron). Renders the branded app icon at
// a given size with matching corner rounding — used on the home header,
// onboarding, and the register screen.
export function Logo({ size = 72 }: { size?: number }) {
  return (
    <Image
      source={require('@/assets/images/icon.png')}
      style={{ width: size, height: size, borderRadius: size * 0.22 }}
      contentFit="cover"
    />
  );
}
