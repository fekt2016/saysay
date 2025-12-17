import { shadows } from '../theme/shadows';export const applyShadow = (size = 'md') => {
  const shadow = shadows[size] || shadows.md;

  return {
    shadowColor: shadow.shadowColor,
    shadowOffset: shadow.shadowOffset,
    shadowOpacity: shadow.shadowOpacity,
    shadowRadius: shadow.shadowRadius,
    elevation: shadow.elevation,
  };
};export const getShadowObject = (size = 'md') => {
  return shadows[size] || shadows.md;
};

export default { applyShadow, getShadowObject };


