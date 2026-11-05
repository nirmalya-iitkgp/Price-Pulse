import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  clampPrice,
  exportRespondentsToCsv,
  parseSurveyCsv,
  sanitizeCsvCell,
  sanitizeTextLabel,
} from '../src/engine/security';

describe('Security Red-Pill / Blue-Pill Tests', () => {
  it('Red-Pill: neutralizes CSV formula injection payloads (=, +, -, @, tab)', () => {
    assert.equal(sanitizeCsvCell('=CMD("calc")'), '\'=CMD("calc")');
    assert.equal(sanitizeCsvCell('+1+1'), '\'+1+1');
    assert.equal(sanitizeCsvCell('-2+3'), '\'-2+3');
    assert.equal(sanitizeCsvCell('@SUM(A1:A2)'), '\'@SUM(A1:A2)');
    assert.equal(sanitizeCsvCell('\tHYPERLINK("http://evil.com")'), '\'\tHYPERLINK("http://evil.com")');
  });

  it('Blue-Pill: preserves legitimate alphanumeric and numeric values', () => {
    assert.equal(sanitizeCsvCell('Enterprise SaaS'), 'Enterprise SaaS');
    assert.equal(sanitizeCsvCell(79.5), '79.5');
  });

  it('Red-Pill: strips XSS/HTML characters and formula prefixes from segment labels', () => {
    const xss = '<script>alert(1)</script>Enterprise';
    const clean = sanitizeTextLabel(xss);
    assert.ok(!clean.includes('<') && !clean.includes('>'), 'Must strip angle brackets');
    assert.equal(sanitizeTextLabel('=malicious'), 'malicious');
  });

  it('Red-Pill: rejects oversized or empty CSVs and normalizes non-monotonic thresholds', () => {
    const emptyRes = parseSurveyCsv('');
    assert.ok(emptyRes.error, 'Empty CSV must return an error');

    const oversized = 'seg,10,20,30,40\n'.repeat(2500);
    const overRes = parseSurveyCsv(oversized);
    assert.ok(overRes.error, 'CSV exceeding 2000 rows must be rejected');

    const nonMonotonic = 'segment,tooCheap,bargain,expensive,tooExpensive\n"<b>SMB</b>",80,20,60,40';
    const parsed = parseSurveyCsv(nonMonotonic);
    assert.equal(parsed.respondents.length, 1);
    assert.deepEqual(
      [
        parsed.respondents[0].tooCheap,
        parsed.respondents[0].bargain,
        parsed.respondents[0].expensive,
        parsed.respondents[0].tooExpensive,
      ],
      [20, 40, 60, 80]
    );
    assert.ok(!parsed.respondents[0].segment.includes('<'));
  });

  it('Red-Pill: clamps NaN, Infinity, and negative prices to safe finite bounds', () => {
    assert.equal(clampPrice(NaN), 0);
    assert.equal(clampPrice(Infinity), 0);
    assert.equal(clampPrice(-50), 0);
    assert.equal(clampPrice(9999999), 100000);
  });

  it('Red-Pill: exported CSV neutralizes dangerous segment names', () => {
    const csv = exportRespondentsToCsv([
      {
        id: '1',
        segment: '=IMPORTXML("http://evil.com","//a")',
        tooCheap: 10,
        bargain: 20,
        expensive: 30,
        tooExpensive: 40,
        maxWillingnessToPay: 25,
      },
    ]);
    assert.ok(csv.includes('\'=IMPORTXML'), 'Exported CSV must prefix formula with single quote');
  });
});
