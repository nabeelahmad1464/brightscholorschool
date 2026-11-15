import {
  FeeRecord,
  Student,
  getDefaultMonthlyFee
} from '../types';

export interface SchoolFeeSummary {
  totalStudents: number;
  activeStudents: number;
  totalExpectedTuition: number;
  totalFinesAmount: number;
  totalExpectedFee: number;
  totalReceivedFee: number;
  totalRemainingFee: number;
  paidVoucherCount: number;
  partialVoucherCount: number;
  unpaidVoucherCount: number;
  missingVoucherStudentsCount: number;
  classBreakdown: Array<{
    className: string;
    studentCount: number;
    feePerStudentLabel: string;
    expectedTuition: number;
    receivedAmount: number;
    remainingAmount: number;
  }>;
}

function normalizeMonthKey(month: string | undefined): string {
  return (month || '').trim().toLowerCase();
}

/**
 * Deduplicates fee records by (studentId, month) and excludes records for non-existent/deleted students.
 * Keeps the record with the highest paidAmount (or most complete payment info) if duplicates exist.
 */
export function deduplicateAndCleanFeeRecords(
  feeRecords: FeeRecord[],
  students: Student[]
): FeeRecord[] {
  if (!Array.isArray(feeRecords)) return [];
  const validStudentMap = new Map(students.map(s => [s.id, s]));
  const map = new Map<string, FeeRecord>();

  feeRecords.forEach(fee => {
    if (!fee || !fee.studentId || !validStudentMap.has(fee.studentId)) return;
    const key = `${fee.studentId}__${normalizeMonthKey(fee.month)}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, fee);
      return;
    }

    const existingPaid = Number(existing.paidAmount) || 0;
    const incomingPaid = Number(fee.paidAmount) || 0;
    if (incomingPaid > existingPaid) {
      map.set(key, fee);
    } else if (incomingPaid === existingPaid) {
      // Prefer explicit timestamp/non-manual placeholder or latest paymentDate
      const existingHasDate = Boolean(existing.paymentDate);
      const incomingHasDate = Boolean(fee.paymentDate);
      if (incomingHasDate && !existingHasDate) {
        map.set(key, fee);
      }
    }
  });

  return Array.from(map.values());
}

/**
 * Calculates accurate student-wise, class-wise, and school-wide fee totals.
 * Always accounts for every registered student using their actual class & assigned monthlyFee,
 * while preventing duplicate vouchers or orphaned records from inflating totals.
 */
export function calculateSchoolFeeSummary(params: {
  students: Student[];
  feeRecords: FeeRecord[];
  monthFilter?: string;
}): SchoolFeeSummary {
  const { students, feeRecords, monthFilter } = params;
  const cleanStudents = Array.isArray(students) ? students : [];
  const cleanFees = deduplicateAndCleanFeeRecords(feeRecords, cleanStudents);

  const normalizedFilter = monthFilter && monthFilter !== 'All' ? normalizeMonthKey(monthFilter) : null;
  const scopedFees = normalizedFilter
    ? cleanFees.filter(f => normalizeMonthKey(f.month) === normalizedFilter)
    : cleanFees;

  // Group scoped vouchers per student
  const feesByStudent = new Map<string, FeeRecord[]>();
  scopedFees.forEach(f => {
    const arr = feesByStudent.get(f.studentId) || [];
    arr.push(f);
    feesByStudent.set(f.studentId, arr);
  });

  let totalExpectedTuition = 0;
  let totalFinesAmount = 0;
  let totalExpectedFee = 0;
  let totalReceivedFee = 0;
  let totalRemainingFee = 0;
  let paidVoucherCount = 0;
  let partialVoucherCount = 0;
  let unpaidVoucherCount = 0;
  let missingVoucherStudentsCount = 0;

  const classMap = new Map<
    string,
    {
      studentCount: number;
      feeValues: Set<number>;
      expectedTuition: number;
      receivedAmount: number;
      remainingAmount: number;
    }
  >();

  cleanStudents.forEach(st => {
    const assignedFee =
      typeof st.monthlyFee === 'number' && st.monthlyFee > 0
        ? st.monthlyFee
        : getDefaultMonthlyFee(st.className);

    const stVouchers = feesByStudent.get(st.id) || [];

    let stTuition = 0;
    let stFine = 0;
    let stPayable = 0;
    let stPaid = 0;
    let stRemaining = 0;

    if (stVouchers.length === 0) {
      missingVoucherStudentsCount += 1;
      unpaidVoucherCount += 1;
      stTuition = assignedFee;
      stFine = 0;
      stPayable = assignedFee;
      stPaid = 0;
      stRemaining = assignedFee;
    } else {
      stVouchers.forEach(v => {
        const paid = Math.max(0, Number(v.paidAmount) || 0);
        const fine = Math.max(0, Number(v.fineAmount) || 0);
        // Unpaid vouchers follow the student's actual assigned fee; paid/partial preserve recorded tuition if set
        const tuition =
          paid === 0
            ? assignedFee
            : Number(v.tuitionFee) > 0
            ? Number(v.tuitionFee)
            : assignedFee;
        const payable = tuition + fine;
        const clampedPaid = Math.min(payable, paid);
        const remaining = Math.max(0, payable - clampedPaid);

        stTuition += tuition;
        stFine += fine;
        stPayable += payable;
        stPaid += clampedPaid;
        stRemaining += remaining;

        if (remaining === 0) paidVoucherCount += 1;
        else if (clampedPaid > 0) partialVoucherCount += 1;
        else unpaidVoucherCount += 1;
      });
    }

    totalExpectedTuition += stTuition;
    totalFinesAmount += stFine;
    totalExpectedFee += stPayable;
    totalReceivedFee += stPaid;
    totalRemainingFee += stRemaining;

    const clsEntry = classMap.get(st.className) || {
      studentCount: 0,
      feeValues: new Set<number>(),
      expectedTuition: 0,
      receivedAmount: 0,
      remainingAmount: 0
    };
    clsEntry.studentCount += 1;
    clsEntry.feeValues.add(assignedFee);
    clsEntry.expectedTuition += stTuition;
    clsEntry.receivedAmount += stPaid;
    clsEntry.remainingAmount += stRemaining;
    classMap.set(st.className, clsEntry);
  });

  const classBreakdown = Array.from(classMap.entries()).map(([className, data]) => {
    const feeList = Array.from(data.feeValues).sort((a, b) => a - b);
    const feePerStudentLabel =
      feeList.length === 1
        ? `Rs. ${feeList[0].toLocaleString()}`
        : feeList.map(v => `Rs. ${v.toLocaleString()}`).join(' / ');
    return {
      className,
      studentCount: data.studentCount,
      feePerStudentLabel,
      expectedTuition: data.expectedTuition,
      receivedAmount: data.receivedAmount,
      remainingAmount: data.remainingAmount
    };
  });

  return {
    totalStudents: cleanStudents.length,
    activeStudents: cleanStudents.filter(s => s.isActive).length,
    totalExpectedTuition,
    totalFinesAmount,
    totalExpectedFee,
    totalReceivedFee,
    totalRemainingFee,
    paidVoucherCount,
    partialVoucherCount,
    unpaidVoucherCount,
    missingVoucherStudentsCount,
    classBreakdown
  };
}
