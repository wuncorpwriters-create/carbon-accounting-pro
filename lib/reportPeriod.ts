const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const MONTH_LOOKUP: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

export type ReportingPeriodParts = {
  year: number;
  month: number;
};

function padMonth(month: number) {
  return String(month).padStart(2, "0");
}

function isValidYear(year: number) {
  return Number.isInteger(year) && year >= 2000 && year <= 2100;
}

function isValidMonth(month: number) {
  return Number.isInteger(month) && month >= 1 && month <= 12;
}

export function toCanonicalReportingPeriod(year: number, month: number) {
  if (!isValidYear(year) || !isValidMonth(month)) return null;
  return `${year}-${padMonth(month)}`;
}

export function parseReportingPeriod(value: string | null | undefined): ReportingPeriodParts | null {
  if (!value) return null;

  const raw = value.trim();
  if (!raw) return null;

  const canonicalMatch = raw.match(/^(\d{4})-(\d{2})$/);
  if (canonicalMatch) {
    const year = Number(canonicalMatch[1]);
    const month = Number(canonicalMatch[2]);
    if (!isValidYear(year) || !isValidMonth(month)) return null;
    return { year, month };
  }

  const isoDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateMatch) {
    const year = Number(isoDateMatch[1]);
    const month = Number(isoDateMatch[2]);
    if (!isValidYear(year) || !isValidMonth(month)) return null;
    return { year, month };
  }

  const monthYearMatch = raw.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const month = MONTH_LOOKUP[monthYearMatch[1].toLowerCase()];
    const year = Number(monthYearMatch[2]);
    if (!month || !isValidYear(year)) return null;
    return { year, month };
  }

  return null;
}

export function normalizeReportingPeriod(value: string | null | undefined) {
  const parsed = parseReportingPeriod(value);
  if (!parsed) return null;
  return toCanonicalReportingPeriod(parsed.year, parsed.month);
}

export function buildReportingPeriodFromParts(monthInput: string | number, yearInput: string | number) {
  const year = Number(yearInput);

  let month: number | null = null;

  if (typeof monthInput === "number") {
    month = monthInput;
  } else {
    const trimmed = monthInput.trim();

    if (/^\d{1,2}$/.test(trimmed)) {
      month = Number(trimmed);
    } else {
      month = MONTH_LOOKUP[trimmed.toLowerCase()] ?? null;
    }
  }

  if (month == null) return null;
  return toCanonicalReportingPeriod(year, month);
}

export function formatReportingPeriodLabel(value: string | null | undefined) {
  const parsed = parseReportingPeriod(value);
  if (!parsed) return value?.trim() || "Unknown period";
  return `${MONTH_LABELS[parsed.month - 1]} ${parsed.year}`;
}

export function compareReportingPeriods(a: string | null | undefined, b: string | null | undefined) {
  const left = normalizeReportingPeriod(a);
  const right = normalizeReportingPeriod(b);

  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;

  return left === right ? 0 : left > right ? -1 : 1;
}

export function isSameReportingPeriod(a: string | null | undefined, b: string | null | undefined) {
  const left = normalizeReportingPeriod(a);
  const right = normalizeReportingPeriod(b);
  return Boolean(left && right && left === right);
}
