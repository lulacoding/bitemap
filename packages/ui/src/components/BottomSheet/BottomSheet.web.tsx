'use client';

import type { SheetProps } from '../Sheet/Sheet.web';
import { Sheet } from '../Sheet/Sheet.web';

export type BottomSheetProps = SheetProps;

export function BottomSheet(props: BottomSheetProps) {
  return <Sheet {...props} />;
}
