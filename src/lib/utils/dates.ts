export const isUpcoming = (iso: string): boolean => {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return t > Date.now();
};
