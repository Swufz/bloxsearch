const requests = new Map<string, number>();

export function canFetchGame(key: string, windowMs = 10 * 60 * 1000) {
  const last = requests.get(key) ?? 0;
  if (Date.now() - last < windowMs) return false;
  requests.set(key, Date.now());
  return true;
}
