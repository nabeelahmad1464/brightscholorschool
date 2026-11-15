import { SubjectMarkEntry } from '../types';
import { normalizeDigits } from './schoolSync';

export interface GradeRule {
  grade: string;
  minPercentage: number;
  label: string;
  status: 'Pass' | 'Fail';
}

export const GRADE_CRITERIA: GradeRule[] = [
  { grade: 'A+', minPercentage: 90, label: 'Outstanding (ممتاز)', status: 'Pass' },
  { grade: 'A', minPercentage: 80, label: 'Excellent (شاندار)', status: 'Pass' },
  { grade: 'B', minPercentage: 70, label: 'Very Good (بہت اچھا)', status: 'Pass' },
  { grade: 'C', minPercentage: 60, label: 'Good (اچھا)', status: 'Pass' },
  { grade: 'D', minPercentage: 50, label: 'Satisfactory (مناسب)', status: 'Pass' },
  { grade: 'E', minPercentage: 40, label: 'Pass (کامیاب)', status: 'Pass' },
  { grade: 'F', minPercentage: 0, label: 'Fail / Needs Practice (توجہ طلب)', status: 'Fail' }
];

export const PASS_PERCENTAGE_THRESHOLD = 40;

/**
 * Normalizes numeric mark inputs including Urdu/Arabic numerals (۰-۹ / ٠-٩).
 */
export function parseMarkInput(raw: string | number | null | undefined): number | '' {
  if (raw === '' || raw === null || raw === undefined) return '';
  const normalized = normalizeDigits(String(raw)).trim();
  if (!normalized) return '';
  const cleaned = normalized.replace(/,/g, '');
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return '';
  return Math.max(0, Math.round(parsed * 100) / 100);
}

/**
 * Assigns school grade consistently with the 40% passing threshold.
 */
export function calculateGrade(percentage: number): string {
  if (!Number.isFinite(percentage)) return '-';
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  if (percentage >= PASS_PERCENTAGE_THRESHOLD) return 'E';
  return 'F';
}

export function getAutoSubjectRemark(percentage: number): string {
  if (!Number.isFinite(percentage)) return '';
  if (percentage >= 80) return 'Very Good';
  if (percentage >= 60) return 'Good';
  if (percentage >= PASS_PERCENTAGE_THRESHOLD) return 'Satisfactory';
  return 'Needs Practice';
}

export interface SubjectCalculationResult {
  totalMarks: number | '';
  obtainedMarks: number | '';
  clampedObtained: number | '';
  wasClamped: boolean;
  exceededTotal: boolean;
  percentage: number | null;
  grade: string;
  autoRemark: string;
  status: 'Pass' | 'Fail' | 'Pending';
}

/**
 * Calculates single-subject marks, percentage = (Obtained ÷ Total) × 100, grade, and pass/fail status.
 * Guards against division by zero and clamps obtainedMarks to [0, totalMarks].
 */
export function calculateSubjectMetrics(
  rawTotal: number | string | '',
  rawObtained: number | string | ''
): SubjectCalculationResult {
  const totalMarks = parseMarkInput(rawTotal);
  const obtainedMarks = parseMarkInput(rawObtained);

  const hasValidTotal = typeof totalMarks === 'number' && totalMarks > 0;
  const hasObtained = typeof obtainedMarks === 'number';

  if (!hasValidTotal || !hasObtained) {
    const exceededTotal =
      typeof totalMarks === 'number' &&
      totalMarks > 0 &&
      typeof obtainedMarks === 'number' &&
      obtainedMarks > totalMarks;

    return {
      totalMarks,
      obtainedMarks,
      clampedObtained: obtainedMarks,
      wasClamped: false,
      exceededTotal,
      percentage: null,
      grade: '',
      autoRemark: '',
      status: 'Pending'
    };
  }

  const exceededTotal = obtainedMarks > totalMarks;
  const clampedObtained = Math.max(0, Math.min(totalMarks, obtainedMarks));
  const wasClamped = clampedObtained !== obtainedMarks;
  const percentage = Math.round((clampedObtained / totalMarks) * 1000) / 10;
  const grade = calculateGrade(percentage);
  const status: 'Pass' | 'Fail' = percentage >= PASS_PERCENTAGE_THRESHOLD ? 'Pass' : 'Fail';

  return {
    totalMarks,
    obtainedMarks,
    clampedObtained,
    wasClamped,
    exceededTotal,
    percentage,
    grade,
    autoRemark: getAutoSubjectRemark(percentage),
    status
  };
}

export interface ExamSummaryResult {
  grandTotal: number;
  totalObtained: number;
  percentage: number;
  grade: string;
  status: 'Pass' | 'Fail' | 'Pending';
  hasAnyTotalMarks: boolean;
  hasAnyObtainedMarks: boolean;
  validSubjectCount: number;
  blankMarksCount: number;
  invalidTotalCount: number;
}

/**
 * Computes aggregate Grand Total, Total Obtained, Percentage = (Obtained ÷ Total) × 100, Grade, and Pass/Fail Status.
 */
export function calculateExamSummary(
  subjects: Array<{
    subject: string;
    totalMarks: number | string | '';
    obtainedMarks: number | string | '';
  }>
): ExamSummaryResult {
  let grandTotal = 0;
  let totalObtained = 0;
  let hasAnyTotalMarks = false;
  let hasAnyObtainedMarks = false;
  let validSubjectCount = 0;
  let blankMarksCount = 0;
  let invalidTotalCount = 0;

  subjects.forEach(item => {
    const total = parseMarkInput(item.totalMarks);
    const obtained = parseMarkInput(item.obtainedMarks);

    if (typeof total === 'number' && total > 0) {
      hasAnyTotalMarks = true;
      grandTotal += total;
      validSubjectCount += 1;

      if (typeof obtained === 'number') {
        hasAnyObtainedMarks = true;
        const clamped = Math.max(0, Math.min(total, obtained));
        totalObtained += clamped;
      } else {
        blankMarksCount += 1;
      }
    } else {
      invalidTotalCount += 1;
    }
  });

  // Round floating point totals cleanly to max 2 decimals
  grandTotal = Math.round(grandTotal * 100) / 100;
  totalObtained = Math.round(totalObtained * 100) / 100;

  const percentage =
    grandTotal > 0 && hasAnyObtainedMarks
      ? Math.round((totalObtained / grandTotal) * 1000) / 10
      : 0;

  const status: 'Pass' | 'Fail' | 'Pending' =
    !hasAnyObtainedMarks || grandTotal <= 0
      ? 'Pending'
      : percentage >= PASS_PERCENTAGE_THRESHOLD
      ? 'Pass'
      : 'Fail';

  const grade =
    !hasAnyObtainedMarks || grandTotal <= 0 ? '-' : calculateGrade(percentage);

  return {
    grandTotal,
    totalObtained,
    percentage,
    grade,
    status,
    hasAnyTotalMarks,
    hasAnyObtainedMarks,
    validSubjectCount,
    blankMarksCount,
    invalidTotalCount
  };
}

/**
 * Sanitizes and recalculates all fields of a StudentExamReport payload before persistence.
 */
export function buildCleanSubjectEntries(
  subjects: Array<{
    subject: string;
    totalMarks: number | string | '';
    obtainedMarks: number | string | '';
    remarks?: string;
  }>
): SubjectMarkEntry[] {
  return subjects
    .filter(s => s.subject.trim() !== '')
    .map(s => {
      const metrics = calculateSubjectMetrics(s.totalMarks, s.obtainedMarks);
      const t = typeof metrics.totalMarks === 'number' ? metrics.totalMarks : 0;
      const o = typeof metrics.clampedObtained === 'number' ? metrics.clampedObtained : 0;
      return {
        subject: s.subject.trim(),
        totalMarks: t,
        obtainedMarks: o,
        grade: metrics.percentage !== null ? metrics.grade : '-',
        remarks: (s.remarks || '').trim() || metrics.autoRemark
      };
    });
}
