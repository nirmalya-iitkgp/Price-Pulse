import { SurveyRespondent } from '../types/pricing';

const MAX_CSV_BYTES = 512 * 1024; // 512 KB
const MAX_CSV_ROWS = 2000;
const MAX_PRICE_BOUND = 100000;
const FORMULA_PREFIX_REGEX = /^[=+\-@\t\r]/;

/**
 * Neutralizes CSV formula injection (CWE-1236) by prefixing dangerous leading
 * characters with a single quote and stripping control characters.
 */
export function sanitizeCsvCell(value: string | number): string {
  const str = String(value ?? '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  if (FORMULA_PREFIX_REGEX.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Escapes a value for safe CSV output, neutralizing formulas and quoting commas/quotes.
 */
export function formatSafeCsvField(value: string | number): string {
  const safe = sanitizeCsvCell(value);
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

/**
 * Sanitizes free-text labels (e.g. segment names) against HTML/script injection
 * and strips formula prefixes.
 */
export function sanitizeTextLabel(input: string, fallback = 'General'): string {
  const cleaned = input
    .replace(/[<>`"'&]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 48);
  const withoutFormula = cleaned.replace(/^[=+\-@]+/, '').trim();
  return withoutFormula.length > 0 ? withoutFormula : fallback;
}

/**
 * Clamps and rounds a numeric price input to safe finite bounds.
 */
export function clampPrice(value: number, min = 0, max = MAX_PRICE_BOUND): number {
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.round(value * 100) / 100));
}

export interface CsvParseResult {
  respondents: SurveyRespondent[];
  warnings: string[];
  error?: string;
}

/**
 * Parses and validates survey CSV text with strict size, row, numeric, and
 * monotonic threshold checks.
 */
export function parseSurveyCsv(csvText: string): CsvParseResult {
  if (typeof csvText !== 'string' || csvText.trim().length === 0) {
    return { respondents: [], warnings: [], error: 'CSV input is empty.' };
  }

  if (csvText.length > MAX_CSV_BYTES) {
    return {
      respondents: [],
      warnings: [],
      error: 'CSV file exceeds the 512 KB safety limit.',
    };
  }

  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      respondents: [],
      warnings: [],
      error: 'CSV must include a header row and at least one respondent row.',
    };
  }

  if (lines.length - 1 > MAX_CSV_ROWS) {
    return {
      respondents: [],
      warnings: [],
      error: `CSV exceeds maximum allowed ${MAX_CSV_ROWS} respondent rows.`,
    };
  }

  const warnings: string[] = [];
  const respondents: SurveyRespondent[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawCols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    if (rawCols.length < 5) {
      warnings.push(`Row ${i}: skipped (expected at least 5 columns).`);
      continue;
    }

    // Support either (segment, tooCheap, bargain, expensive, tooExpensive, [maxWtp])
    // or (id, segment, tooCheap, bargain, expensive, tooExpensive, [maxWtp])
    const hasIdCol = rawCols.length >= 6 && Number.isNaN(Number(rawCols[1])) && !Number.isNaN(Number(rawCols[2]));
    const offset = hasIdCol ? 1 : 0;

    const segment = sanitizeTextLabel(rawCols[offset], `Segment ${i}`);
    const p1 = Number(rawCols[offset + 1]);
    const p2 = Number(rawCols[offset + 2]);
    const p3 = Number(rawCols[offset + 3]);
    const p4 = Number(rawCols[offset + 4]);
    const p5Raw = rawCols[offset + 5] !== undefined ? Number(rawCols[offset + 5]) : NaN;

    if ([p1, p2, p3, p4].some((n) => !Number.isFinite(n) || n < 0 || n > MAX_PRICE_BOUND)) {
      warnings.push(`Row ${i}: skipped (invalid or out-of-bounds price value).`);
      continue;
    }

    // Enforce monotonic order: tooCheap <= bargain <= expensive <= tooExpensive
    const sorted = [p1, p2, p3, p4].map((v) => clampPrice(v)).sort((a, b) => a - b);
    if (p1 !== sorted[0] || p2 !== sorted[1] || p3 !== sorted[2] || p4 !== sorted[3]) {
      warnings.push(`Row ${i}: normalized non-monotonic price thresholds.`);
    }

    const maxWtp = Number.isFinite(p5Raw) && p5Raw >= 0
      ? clampPrice(p5Raw)
      : Math.round(((sorted[1] + sorted[2]) / 2) * 100) / 100;

    respondents.push({
      id: `resp-${i}`,
      segment,
      tooCheap: sorted[0],
      bargain: sorted[1],
      expensive: sorted[2],
      tooExpensive: sorted[3],
      maxWillingnessToPay: maxWtp,
    });
  }

  if (respondents.length === 0) {
    return {
      respondents: [],
      warnings,
      error: 'No valid respondent rows could be parsed from the CSV.',
    };
  }

  return { respondents, warnings };
}

/**
 * Generates a formula-safe CSV string from respondent survey data.
 */
export function exportRespondentsToCsv(respondents: SurveyRespondent[]): string {
  const header = [
    'ID',
    'Segment',
    'Too Cheap ($)',
    'Bargain ($)',
    'Expensive ($)',
    'Too Expensive ($)',
    'Max WTP ($)',
  ].join(',');

  const rows = respondents.map((r) =>
    [
      formatSafeCsvField(r.id),
      formatSafeCsvField(r.segment),
      formatSafeCsvField(r.tooCheap),
      formatSafeCsvField(r.bargain),
      formatSafeCsvField(r.expensive),
      formatSafeCsvField(r.tooExpensive),
      formatSafeCsvField(r.maxWillingnessToPay),
    ].join(',')
  );

  return [header, ...rows].join('\n');
}
