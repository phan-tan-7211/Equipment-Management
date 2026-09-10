import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import "./custom.css";

/**
 * CEV.PhanTan Help Center theme — default VitePress + Mission Control tokens.
 * Token mirror lives in CEV.PhanTan-tokens.css / custom.css (see deployment.md).
 */
const theme: Theme = {
  extends: DefaultTheme,
};

export default theme;

