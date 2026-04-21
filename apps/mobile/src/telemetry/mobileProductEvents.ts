type CaptureFn = (event: string, props?: Record<string, string | number | boolean>) => void;

let captureRef: CaptureFn | null = null;

/** Called from `PostHogMount` when the PostHog client is ready. */
export function setMobileProductCapture(fn: CaptureFn | null): void {
  captureRef = fn;
}

export function mobileCapture(
  event: string,
  props?: Record<string, string | number | boolean>,
): void {
  captureRef?.(event, props);
}
