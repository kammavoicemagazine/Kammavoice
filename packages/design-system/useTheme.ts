// packages/design-system/useTheme.ts
import { baseTheme, Theme } from "./theme";

/** Simple hook that returns the shared design tokens */
export const useTheme = (): Theme => {
  return baseTheme;
};
