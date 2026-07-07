import { Image } from 'expo-image';

// The temetro brand mark (the white fox). Renders the branded logo at a given
// size — used on the home header, onboarding, and the register screen. The art
// ships on a near-black field that blends into the app's dark background, so we
// render it "contain" with no cropping or corner rounding.
export function Logo({ size = 72 }: { size?: number }) {
  return (
    <Image
      source={require('@/assets/images/temetro-logo.png')}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}
