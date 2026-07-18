import { toSVG } from 'bwip-js';
import { useMemo } from 'react';
import { SvgXml } from 'react-native-svg';

// A compact 2D "barcode" (GS1 DataMatrix) for values too long to render as a
// clean 1D barcode — e.g. a ~50-char tmw_ wallet number. bwip-js emits an SVG
// (its React Native build) which react-native-svg draws crisply at any size.
export function DataMatrix({
  value,
  size = 200,
}: {
  value: string;
  size?: number;
}) {
  const svg = useMemo(() => {
    try {
      return toSVG({
        bcid: 'datamatrix',
        text: value,
        scale: 5,
        paddingwidth: 2,
        paddingheight: 2,
      });
    } catch {
      return null;
    }
  }, [value]);

  if (!svg) return null;
  return <SvgXml height={size} width={size} xml={svg} />;
}
