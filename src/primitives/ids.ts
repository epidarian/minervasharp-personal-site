import { useId } from "react";

// React.useId() contains ":" which is awkward inside url(#...) references.
export function useSvgId(prefix: string): string {
  return prefix + useId().replace(/:/g, "");
}
