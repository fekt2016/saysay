export const safeFontSize = (value, fallback = 14) => {

  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }

  if (value == null) {
    return fallback;
  }

  if (typeof value === 'string') {

    const cleaned = value.replace(/px|%|\s/g, '');
    const parsed = parseFloat(cleaned);

    return !isNaN(parsed) && parsed > 0 ? parsed : fallback;
  }

  const parsed = Number(value);
  return !isNaN(parsed) && parsed > 0 ? parsed : fallback;
};

export default safeFontSize;


