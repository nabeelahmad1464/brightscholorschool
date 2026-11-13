import {
  Student,
  StudentAttendance,
  LeaveRequest,
  FeeRecord,
  SystemSettings,
  getDefaultMonthlyFee
} from '../types';

/**
 * Extracts clean root JSON object from raw HTTP response text.
 * Strips appended HTML/script footers added by public JSON storage providers (e.g. ExtendsClass).
 */
export function extractCleanJson<T = any>(rawText: string): T | null {
  if (!rawText || typeof rawText !== 'string') return null;
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Fall back to balanced JSON object scan to strip trailing HTML/garbage
  }

  const start = trimmed.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\' && inString) {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(trimmed.slice(start, i + 1)) as T;
          } catch {
            return null;
          }
        }
      }
    }
  }
  return null;
}

/**
 * Normalizes Urdu/Persian/Arabic-Indic numerals (۰-۹, ٠-٩) and punctuation to ASCII digits.
 */
export function normalizeDigits(input: string): string {
  if (!input) return '';
  return String(input)
    .replace(/[۰-۹]/g, ch => String(ch.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, ch => String(ch.charCodeAt(0) - 0x0660))
    .replace(/[０-９]/g, ch => String(ch.charCodeAt(0) - 0xff10));
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function getCurrentMonthLabel(date: Date = new Date()): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function monthLabelToYearMonth(monthLabel: string): string | null {
  if (!monthLabel) return null;
  const trimmed = monthLabel.trim();
  if (/^\d{4}-\d{2}$/.test(trimmed)) return trimmed;
  const parts = trimmed.split(/\s+/);
  if (parts.length !== 2) return null;
  const monthIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === parts[0].toLowerCase());
  const year = parts[1];
  if (monthIdx === -1 || !/^\d{4}$/.test(year)) return null;
  const mm = String(monthIdx + 1).padStart(2, '0');
  return `${year}-${mm}`;
}

/**
 * Checks whether a student has an Approved leave covering `date` (YYYY-MM-DD).
 */
export function isDateCoveredByApprovedLeave(
  studentId: string,
  date: string,
  leaves: LeaveRequest[]
): boolean {
  if (!studentId || !date || !Array.isArray(leaves)) return false;
  return leaves.some(
    l =>
      l.status === 'Approved' &&
      l.applicantId === studentId &&
      (!l.role || l.role === 'student') &&
      l.fromDate <= date &&
      date <= l.toDate
  );
}

/**
 * Deduplicates attendance entries by (studentId, date), keeping the most recent entry.
 */
export function deduplicateAttendance(records: StudentAttendance[]): StudentAttendance[] {
  if (!Array.isArray(records)) return [];
  const seen = new Map<string, StudentAttendance>();
  // Iterate so first-encountered (most recent via unshift) or latest explicit update wins consistently;
  // callers always unshift/update the latest record at the head or update in-place.
  records.forEach(rec => {
    if (!rec || !rec.studentId || !rec.date) return;
    const key = `${rec.studentId}__${rec.date}`;
    if (!seen.has(key)) {
      seen.set(key, rec);
    }
  });
  return Array.from(seen.values());
}

/**
 * Reconciles fee vouchers deterministically with attendance, approved leaves, student class tiers, and fine settings.
 * - Preserves paidAmount, paymentDate, receiptNo, and existing payment history.
 * - Avoids duplicate fine calculation across repeated runs.
 * - Respects manualFineOverride when admin explicitly sets a custom fine.
 * - Creates missing vouchers for active students if targetMonth is specified and voucher list is non-empty or requested.
 */
export function reconcileFeesWithAttendance(params: {
  students: Student[];
  feeRecords: FeeRecord[];
  attendance: StudentAttendance[];
  leaves: LeaveRequest[];
  settings: SystemSettings;
  targetMonth?: string;
  createMissingForStudents?: boolean;
}): FeeRecord[] {
  const {
    students,
    feeRecords,
    attendance,
    leaves,
    settings,
    targetMonth,
    createMissingForStudents = false
  } = params;

  const fineRate = Number(settings?.finePerAbsentDay ?? 50) || 0;
  const chargeLeaveFine = Boolean(settings?.chargeFineOnApprovedLeave);
  const cleanAtt = deduplicateAttendance(attendance);
  const studentMap = new Map(students.map(s => [s.id, s]));

  // Count vouchers per student to decide month scoping vs active-voucher reconciliation
  const voucherCountByStudent = new Map<string, number>();
  feeRecords.forEach(f => {
    voucherCountByStudent.set(f.studentId, (voucherCountByStudent.get(f.studentId) || 0) + 1);
  });

  const reconciled = feeRecords.map(fee => {
    const st = studentMap.get(fee.studentId);
    const hasMultipleMonths = (voucherCountByStudent.get(fee.studentId) || 0) > 1;
    const feeYearMonth = monthLabelToYearMonth(fee.month);

    const relevantAtt = cleanAtt.filter(a => {
      if (a.studentId !== fee.studentId) return false;
      if (hasMultipleMonths && feeYearMonth) {
        return (a.month || a.date.substring(0, 7)) === feeYearMonth;
      }
      return true;
    });

    let unapprovedAbsents = 0;
    let leaveCount = 0;

    relevantAtt.forEach(a => {
      const onApprovedLeave = isDateCoveredByApprovedLeave(a.studentId, a.date, leaves);
      if (a.status === 'Leave' || (a.status === 'Absent' && onApprovedLeave)) {
        leaveCount++;
      } else if (a.status === 'Absent') {
        unapprovedAbsents++;
      }
    });

    const billableDays = chargeLeaveFine ? unapprovedAbsents + leaveCount : unapprovedAbsents;
    const computedFine = fee.manualFineOverride ? fee.fineAmount : billableDays * fineRate;

    // Preserve tuitionFee if already paid or custom; sync class/name updates cleanly
    const tuition =
      fee.tuitionFee && fee.tuitionFee > 0
        ? fee.tuitionFee
        : st
        ? st.monthlyFee || getDefaultMonthlyFee(st.className)
        : 0;

    const paid = Number(fee.paidAmount) || 0;
    const totalPayable = tuition + computedFine;
    const balanceRemaining = Math.max(0, totalPayable - paid);
    const status: 'Paid' | 'Partial' | 'Unpaid' =
      balanceRemaining === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';

    return {
      ...fee,
      studentName: st ? st.name : fee.studentName,
      fatherName: st ? st.fatherName : fee.fatherName,
      className: st ? st.className : fee.className,
      tuitionFee: tuition,
      absentDays: unapprovedAbsents,
      leaveDays: leaveCount,
      fineAmount: computedFine,
      totalPayable,
      balanceRemaining,
      status
    };
  });

  if (createMissingForStudents && targetMonth) {
    const existingStudentIds = new Set(reconciled.map(f => f.studentId));
    const created: FeeRecord[] = [];

    students.forEach(st => {
      if (existingStudentIds.has(st.id)) return;
      const relevantAtt = cleanAtt.filter(a => a.studentId === st.id);
      let unapprovedAbsents = 0;
      let leaveCount = 0;
      relevantAtt.forEach(a => {
        const onApprovedLeave = isDateCoveredByApprovedLeave(a.studentId, a.date, leaves);
        if (a.status === 'Leave' || (a.status === 'Absent' && onApprovedLeave)) {
          leaveCount++;
        } else if (a.status === 'Absent') {
          unapprovedAbsents++;
        }
      });
      const billableDays = chargeLeaveFine ? unapprovedAbsents + leaveCount : unapprovedAbsents;
      const fine = billableDays * fineRate;
      const tuition = st.monthlyFee || getDefaultMonthlyFee(st.className);
      const total = tuition + fine;
      created.push({
        id: `fee-${Date.now()}-${st.id}`,
        studentId: st.id,
        studentName: st.name,
        fatherName: st.fatherName,
        className: st.className,
        month: targetMonth,
        tuitionFee: tuition,
        absentDays: unapprovedAbsents,
        leaveDays: leaveCount,
        fineAmount: fine,
        totalPayable: total,
        paidAmount: 0,
        balanceRemaining: total,
        status: 'Unpaid',
        receiptNo: `REC-BSS-${st.id.slice(-4)}`
      });
    });

    return [...created, ...reconciled];
  }

  return reconciled;
}
