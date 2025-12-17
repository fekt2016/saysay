import colors from './colors';
import spacing from './spacing';
import typography from './typography';
import borderRadius from './borderRadius';
import shadows from './shadows';

export const theme = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,

  gradients: {
    primary: ['#ffc400', '#e29800'],
    accent: ['#0078cc', '#005fa5'],
  },

  transitions: {
    fast: 150,
    base: 300,
    normal: 300,
    slow: 500,
  },
};

export default theme;
export { colors, spacing, typography, borderRadius, shadows };


