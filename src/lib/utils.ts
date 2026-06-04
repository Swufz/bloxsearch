export const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, Math.round(value)));

export const formatNumber = (value: number) =>
  Intl.NumberFormat("en-US", { notation: value >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export const daysAgo = (value: string) =>
  Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));

export const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");
