export function debounce<T extends (...args: any[]) => any>(fn: T, wait = 200) {
  let t: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}
