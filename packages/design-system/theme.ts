// packages/design-system/theme.ts
import { colors } from "./colors";
import { spacing } from "./spacing";
import { radius } from "./radius";
import { shadow } from "./shadows";

export interface Theme {
  palette: typeof colors;
  spacing: typeof spacing;
  radius: typeof radius;
  shadow: typeof shadow;
  typography: {
    headings: string;
    body: string;
  };
}

export const baseTheme: Theme = {
  palette: colors,
  spacing: spacing,
  radius: radius,
  shadow: shadow,
  typography: {
    headings: "Playfair Display",
    body: "Inter",
  },
};
