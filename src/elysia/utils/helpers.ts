export const clamp = (value?: number, min?: number, max?: number) => {
  if (value === undefined) return value;
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
};
