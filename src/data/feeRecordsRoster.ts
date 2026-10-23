import { FeeRecord } from '../types';
import { all51SchoolStudents } from './studentsRoster';

export const all51InitialFeeRecords: FeeRecord[] = all51SchoolStudents.map((st, index) => {
  const tuition = st.monthlyFee;
  return {
    id: `fee-rec-${st.id}`,
    studentId: st.id,
    studentName: st.name,
    fatherName: st.fatherName,
    className: st.className,
    month: 'October 2026',
    tuitionFee: tuition,
    absentDays: 0,
    fineAmount: 0,
    totalPayable: tuition,
    paidAmount: 0,
    balanceRemaining: tuition,
    status: 'Unpaid',
    receiptNo: `REC-BSS-${String(index + 1).padStart(3, '0')}`
  };
});
