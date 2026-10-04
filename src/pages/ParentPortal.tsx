import React, { useState, useEffect } from 'react';
import {
  Printer,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Calendar,
  DollarSign,
  Award,
  BookOpen,
  Phone,
  Search,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Student, ClassLevel, SCHOOL_CLASSES, FeeRecord } from '../types';

interface ParentPortalProps {
  onSelectStudent: (student: Student) => void;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({ onSelectStudent }) => {
  const {
    students,
    currentParentStudentId,
    setCurrentParentStudentId,
    getStudentFullReport,
    submitLeave,
    openWhatsApp,
    settings,
    feeRecords,
    testResults,
    dailyReports,
    syncNowWithCloud
  } = useSchool();

  // Find initial student if parent was already logged in
  const loggedInStudent = currentParentStudentId
    ? students.find(s => s.id === currentParentStudentId)
    : null;

  const [inputClass, setInputClass] = useState<ClassLevel>(
    loggedInStudent ? loggedInStudent.className : 'Class 5'
  );
  const [inputRollNo, setInputRollNo] = useState<string>(
    loggedInStudent ? loggedInStudent.rollNo : ''
  );
  const [searchedStudent, setSearchedStudent] = useState<Student | null>(loggedInStudent || null);
  const [hasSearched, setHasSearched] = useState<boolean>(!!loggedInStudent);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleResetSearch = () => {
    setSearchedStudent(null);
    setHasSearched(false);
    setInputRollNo('');
    setErrorMessage('');
    setCurrentParentStudentId(null);
  };

  // Leave Form state
  const [leaveDays, setLeaveDays] = useState(1);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveFrom, setLeaveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [leaveTo, setLeaveTo] = useState(new Date().toISOString().split('T')[0]);
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);

  // If currentParentStudentId changes or logs in, sync searched student
  useEffect(() => {
    if (currentParentStudentId) {
      const match = students.find(s => s.id === currentParentStudentId);
      if (match) {
        setSearchedStudent(match);
        setInputClass(match.className);
        setInputRollNo(match.rollNo);
        setHasSearched(true);
        setErrorMessage('');
      }
    }
  }, [currentParentStudentId, students]);

  // Handle Search: Searches in selected class first, and if found in another class, auto-switches and opens receipt!
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setLeaveSubmitted(false);

    // Ensure freshest cloud data is pulled
    syncNowWithCloud();

    const cleanRoll = inputRollNo.trim().toLowerCase();
    if (!cleanRoll) {
      setErrorMessage('براہ کرم طالب علم کا رول نمبر یا نام درج کریں۔');
      setSearchedStudent(null);
      setHasSearched(true);
      return;
    }

    const cleanNum = cleanRoll.replace(/^0+/, '');

    // 1. Search strictly within the selected class first
    let match = students.find(s => {
      if (s.className !== inputClass) return false;
      const rollClean = s.rollNo.trim().toLowerCase();
      const rollNum = rollClean.replace(/^0+/, '');
      return (
        rollClean === cleanRoll ||
        (cleanNum !== '' && rollNum === cleanNum) ||
        s.admissionNo.toLowerCase() === cleanRoll ||
        s.admissionNo.toLowerCase().includes(cleanRoll) ||
        s.name.toLowerCase().includes(cleanRoll) ||
        (s.contactNo && s.contactNo.replace(/\D/g, '').includes(cleanRoll.replace(/\D/g, '')))
      );
    });

    // 2. If not found in selected class, search across ALL classes automatically!
    if (!match) {
      match = students.find(s => {
        const rollClean = s.rollNo.trim().toLowerCase();
        const rollNum = rollClean.replace(/^0+/, '');
        return (
          rollClean === cleanRoll ||
          (cleanNum !== '' && rollNum === cleanNum) ||
          s.admissionNo.toLowerCase() === cleanRoll ||
          s.admissionNo.toLowerCase().includes(cleanRoll) ||
          s.name.toLowerCase().includes(cleanRoll) ||
          (s.contactNo && s.contactNo.replace(/\D/g, '').includes(cleanRoll.replace(/\D/g, '')))
        );
      });

      if (match) {
        // Automatically switch class to the child's class so everything aligns
        setInputClass(match.className as ClassLevel);
      }
    }

    if (match) {
      setSearchedStudent(match);
      setCurrentParentStudentId(match.id);
      setHasSearched(true);
      setErrorMessage('');
    } else {
      setErrorMessage(
        `رول نمبر / نام "${inputRollNo}" کا کوئی طالب علم نہیں ملا۔ براہ کرم رول نمبر یا نام درست درج فرمائیں یا اسکول واٹس ایپ پر رابطہ کریں۔`
      );
      setSearchedStudent(null);
      setHasSearched(true);
    }
  };

  const activeStudent = searchedStudent;
  const report = activeStudent ? getStudentFullReport(activeStudent.id) : null;

  // Fee Record for Receipt
  const studentFeeRecord = activeStudent && report ? (feeRecords.find(f => f.studentId === activeStudent.id) || {
    id: `fee-${activeStudent.id}`,
    studentId: activeStudent.id,
    studentName: activeStudent.name,
    fatherName: activeStudent.fatherName,
    className: activeStudent.className,
    month: 'October 2026',
    tuitionFee: activeStudent.monthlyFee,
    absentDays: report.absentDays,
    fineAmount: report.totalFineAmount,
    totalPayable: activeStudent.monthlyFee + report.totalFineAmount,
    paidAmount: report.paidAmount,
    balanceRemaining: report.balanceRemaining,
    status: report.balanceRemaining === 0 ? 'Paid' : 'Unpaid',
    receiptNo: `REC-BSS-${activeStudent.id.slice(-4)}`
  } as FeeRecord) : null;

  const studentResults = activeStudent ? testResults.filter(r => r.studentId === activeStudent.id) : [];
  const studentReports = activeStudent ? dailyReports.filter(d => d.studentId === activeStudent.id) : [];

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent || !leaveReason.trim()) return;

    submitLeave({
      applicantId: activeStudent.id,
      applicantName: activeStudent.name,
      role: 'student',
      className: activeStudent.className,
      fromDate: leaveFrom,
      toDate: leaveTo,
      numberOfDays: Number(leaveDays),
      reason: leaveReason.trim(),
      status: 'Pending'
    });

    setLeaveSubmitted(true);
    setLeaveReason('');
    alert('رخصت کی درخواست اسکول انتظامیہ کو بھیج دی گئی ہے!');
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleWhatsAppPaymentProof = () => {
    if (!activeStudent || !report || !studentFeeRecord) return;
    const finePerDay = settings.finePerAbsentDay || 50;
    const text = `*BRIGHT SCHOLAR SCHOOL - CHAK 47 GB SAMUNDRI*\n` +
      `*OFFICIAL FEE RECEIPT / فیس رسید*\n\n` +
      `طالب علم کا نام: *${activeStudent.name}*\n` +
      `ولدیت: *${activeStudent.fatherName}*\n` +
      `کلاس: *${activeStudent.className}* | رول نمبر: *${activeStudent.rollNo}*\n` +
      `داخلہ نمبر: *${activeStudent.admissionNo}*\n` +
      `مہینہ: *${studentFeeRecord.month}*\n` +
      `رسید نمبر: *${studentFeeRecord.receiptNo || 'BSS-REC-01'}*\n` +
      `--------------------------------\n` +
      `ماہانہ ٹیوشن فیس: Rs. ${report.monthlyFee}\n` +
      `غیر حاضری فائن (${report.absentDays} دن @ Rs. ${finePerDay}): Rs. ${report.totalFineAmount}\n` +
      `کل واجب الادا فیس: *Rs. ${report.monthlyFee + report.totalFineAmount}*\n` +
      `ادا شدہ رقم: *Rs. ${report.paidAmount}*\n` +
      `بقیہ واجبات: *Rs. ${report.balanceRemaining}*\n` +
      `اسٹیٹس: *${report.balanceRemaining === 0 ? 'ادا شدہ (Paid)' : 'واجب الادا (Unpaid)'}*\n` +
      `--------------------------------\n` +
      `پہلے تربیت، پھر تعلیم • برائٹ اسکالر اسکول چک 47 گ ب سمندری`;

    openWhatsApp(settings.schoolWhatsApp, text);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* 1. Official School Brand Header */}
      <div className="bg-[#0D285F] text-white rounded-2xl p-5 sm:p-7 shadow-md border-b-4 border-amber-400 text-center space-y-2.5 print:hidden">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-white p-1 border-2 border-amber-400 overflow-hidden shadow-lg flex items-center justify-center">
          <img
            src="/school_logo.jpg"
            alt="Bright Scholar School Logo"
            className="w-full h-full object-cover rounded-full"
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
        </div>
        <h1 className="text-xl sm:text-3xl font-black font-serif-crest uppercase tracking-tight">
          Parent & Student Portal (پیرنٹ پورٹل)
        </h1>
        <div className="inline-block bg-amber-400 text-[#07193B] text-xs sm:text-sm font-extrabold px-4 py-1 rounded-full shadow-sm">
          “Pehle Tarbiyat, Phir Taleem” • Chak 47 GB Samundri • Since 2017 (سنس 2017)
        </div>
        <p className="text-xs sm:text-sm text-slate-200 max-w-lg mx-auto font-medium">
          اپنے بچے کی فیس رسید، امتحانی نتائج اور حاضری دیکھنے کے لیے نیچے کلاس اور رول نمبر درج کریں۔
        </p>
      </div>

      {/* 2. STRICT CLASS & ROLL NUMBER SEARCH BOX (NO OTHER STUDENT LIST SHOWN) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-[#0D285F] shadow-lg space-y-4 print:hidden">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3 text-slate-900 font-extrabold text-sm sm:text-base flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-[#0D285F]" />
              <span>طالب علم کا رول نمبر اور کلاس درج کریں:</span>
            </div>
            {activeStudent && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1 rounded-lg border transition"
              >
                نیا رول نمبر درج کریں (Clear)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            {/* Step 1: Select Class */}
            <div className="sm:col-span-5 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                1. کلاس منتخب کریں (Select Class):
              </label>
              <select
                value={inputClass}
                onChange={(e) => setInputClass(e.target.value as ClassLevel)}
                className="w-full bg-slate-50 border-2 border-slate-300 focus:border-[#0D285F] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-extrabold text-[#0D285F] outline-none shadow-sm"
              >
                {SCHOOL_CLASSES.map(cls => {
                  const count = students.filter(s => s.className === cls).length;
                  return (
                    <option key={cls} value={cls}>
                      {cls} ({count} طلباء)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Step 2: Enter Roll Number */}
            <div className="sm:col-span-4 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                2. رول نمبر لکھیں (Enter Roll Number):
              </label>
              <input
                type="text"
                required
                value={inputRollNo}
                onChange={(e) => setInputRollNo(e.target.value)}
                placeholder="رول نمبر (01, 1) یا نام درج کریں..."
                className="w-full bg-slate-50 border-2 border-slate-300 focus:border-[#0D285F] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-extrabold text-slate-900 outline-none shadow-sm"
              />
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-3 flex items-end">
              <button
                type="submit"
                className="w-full bg-[#0D285F] hover:bg-[#07193B] text-amber-300 font-black text-xs sm:text-sm py-3 rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>رسید دیکھیں</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </form>
      </div>

      {/* 3. PROMPT IF NOT SEARCHED YET */}
      {!hasSearched && !activeStudent && (
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-2.5 print:hidden">
          <GraduationCap className="w-12 h-12 text-[#0D285F] mx-auto opacity-70" />
          <h3 className="text-base font-extrabold text-slate-800">
            محترم والدین! بچے کا تعلیمی ریکارڈ اور فیس رسید محفوظ ہے
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            اوپر کلاس اور رول نمبر درج کر کے "رسید دیکھیں" پر کلک کریں تاکہ صرف آپ کے بچے کا فیس واؤچر اور ریکارڈ کھل سکے۔
          </p>
        </div>
      )}

      {/* 4. ONLY THAT CHILD'S COMPLETE DETAILS & COMPLETE FEE RECEIPT (رسید کی رسید) */}
      {activeStudent && report && studentFeeRecord && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Quick Active Student Bar */}
          <div className="flex items-center justify-between bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 text-xs print:hidden shadow-sm flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="font-extrabold text-slate-800 text-sm">
                طالب علم: <strong className="text-[#0D285F]">{activeStudent.name}</strong> ولد <strong className="text-slate-700">{activeStudent.fatherName}</strong> • کلاس: <strong className="text-emerald-700">{activeStudent.className}</strong> • رول نمبر: <strong className="text-[#0D285F]">#{activeStudent.rollNo}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetSearch}
              className="bg-[#0D285F] hover:bg-[#07193B] text-amber-300 font-extrabold px-3.5 py-1.5 rounded-xl transition shadow flex items-center gap-1 cursor-pointer"
            >
              <span>دوسرا رول نمبر چیک کریں</span>
              <span>←</span>
            </button>
          </div>

          {/* THE OFFICIAL FEE RECEIPT VOUCHER (رسید کی رسید براہ راست سامنے) */}
          <div className="bg-white rounded-3xl border-2 border-amber-400 shadow-xl overflow-hidden print:m-0 print:border-none print:shadow-none">
            {/* Receipt Header Banner */}
            <div className="bg-[#0D285F] text-white p-5 sm:p-6 border-b-4 border-amber-400">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-full bg-white p-0.5 border-2 border-amber-400 overflow-hidden flex-shrink-0 shadow">
                    <img
                      src="/school_logo.jpg"
                      alt="Bright Scholar School Logo"
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-2xl font-black font-serif-crest uppercase tracking-tight text-white">
                        Bright Scholar School
                      </h2>
                      <span className="bg-amber-400 text-[#07193B] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        Since 2017 (سنس 2017)
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-amber-300 font-bold">
                      “پہلے تربیت، پھر تعلیم” • Chak 47 GB Samundri
                    </p>
                    <p className="text-[11px] text-slate-300">
                      فون و واٹس ایپ: 0302-5053993 • رجسٹرڈ پرائمری و مڈل ایجوکیشن
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="inline-block bg-amber-400 text-[#07193B] font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-1">
                    آفیشل فیس واؤچر رسید
                  </span>
                  <div className="text-xs text-slate-300">
                    رسید نمبر: <strong className="text-amber-300 font-mono">{studentFeeRecord.receiptNo || 'BSS-REC-01'}</strong>
                  </div>
                  <div className="text-xs text-slate-300">
                    مہینہ: <strong className="text-white">{studentFeeRecord.month}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt Body & Student Particulars */}
            <div className="p-5 sm:p-7 space-y-5 bg-gradient-to-b from-white to-slate-50/50">
              {/* Student Details Grid */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">طالب علم کا نام (Student Name):</span>
                  <strong className="text-sm text-slate-900 font-extrabold">{activeStudent.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">ولدیت (Father Name):</span>
                  <strong className="text-sm text-slate-900 font-extrabold">{activeStudent.fatherName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">کلاس (Class):</span>
                  <strong className="text-sm text-[#0D285F] font-black">{activeStudent.className}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">رول نمبر / داخلہ نمبر:</span>
                  <strong className="text-sm text-[#0D285F] font-black">Roll #{activeStudent.rollNo} • Adm: {activeStudent.admissionNo}</strong>
                </div>
              </div>

              {/* Itemized Fee Breakdown Table */}
              <div className="border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#07193B] text-white">
                    <tr>
                      <th className="p-3.5">تفصیلات (Fee Description)</th>
                      <th className="p-3.5 text-center">شرح / حساب (Details)</th>
                      <th className="p-3.5 text-right">رقم (Amount PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr>
                      <td className="p-3.5 font-bold text-slate-800">ماہانہ ٹیوشن فیس (Monthly Tuition Fee)</td>
                      <td className="p-3.5 text-center text-slate-500 font-medium">ماہ {studentFeeRecord.month}</td>
                      <td className="p-3.5 text-right font-black text-slate-900">
                        Rs. {report.monthlyFee.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-slate-800">
                        غیر حاضری جرمانہ (Unapproved Absence Fine)
                      </td>
                      <td className="p-3.5 text-center text-slate-500 font-medium">
                        {report.absentDays} دن غیر حاضر (@ Rs. {settings.finePerAbsentDay || 50}/day)
                      </td>
                      <td className="p-3.5 text-right font-black text-red-600">
                        Rs. {report.totalFineAmount.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/80 font-black">
                      <td colSpan={2} className="p-3.5 text-slate-900 text-sm">
                        کل واجب الادا رقم (Total Payable Fee):
                      </td>
                      <td className="p-3.5 text-right text-base text-[#0D285F]">
                        Rs. {(report.monthlyFee + report.totalFineAmount).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/50">
                      <td colSpan={2} className="p-3.5 font-bold text-emerald-800">
                        ادا شدہ رقم (Paid Amount):
                      </td>
                      <td className="p-3.5 text-right font-black text-emerald-700 text-sm">
                        Rs. {report.paidAmount.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-amber-50/70 border-t-2 border-slate-300">
                      <td colSpan={2} className="p-4 font-black text-slate-900 text-sm sm:text-base">
                        بقایا واجبات (Remaining Balance Due):
                      </td>
                      <td className={`p-4 text-right font-black text-base sm:text-lg ${
                        report.balanceRemaining === 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        Rs. {report.balanceRemaining.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Status Stamp & Note */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="space-y-1">
                  <div className="text-xs text-slate-600 font-medium">
                    اسٹیٹس: <strong className={`px-3 py-1 rounded-full text-xs font-black ${
                      report.balanceRemaining === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {report.balanceRemaining === 0 ? '✓ ادا شدہ (PAID IN FULL)' : 'واجب الادا (UNPAID / PENDING)'}
                    </strong>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    یہ برائٹ اسکالر اسکول کی مصدقہ کمپیوٹرائزڈ فیس رسید ہے۔
                  </p>
                </div>

                {/* Print and WhatsApp Buttons */}
                <div className="flex items-center gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="bg-[#0D285F] hover:bg-[#07193B] text-amber-300 font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>پرنٹ فیس رسید (Print)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleWhatsAppPaymentProof}
                    className="bg-[#25D366] hover:bg-[#20b858] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>واٹس ایپ رسید شیئر کریں</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4 SUMMARY STAT CARDS OF THIS STUDENT */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
            {/* Attendance */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-[11px] font-bold text-slate-500 block uppercase">حاضری کا تناسب</span>
              <span className="text-2xl sm:text-3xl font-black text-[#0D285F] mt-1 block">
                {report.attendancePercentage}%
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">
                {report.presentDays} حاضری / {report.totalWorkingDays} کل دن
              </span>
            </div>

            {/* Absent Fine */}
            <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/20 shadow-sm text-center">
              <span className="text-[11px] font-bold text-red-800 block uppercase">غیر حاضری فائن</span>
              <span className="text-2xl sm:text-3xl font-black text-red-600 mt-1 block">
                Rs. {report.totalFineAmount}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">
                {report.absentDays} دن غیر حاضر (@ Rs. {settings.finePerAbsentDay || 50})
              </span>
            </div>

            {/* Fee */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-[11px] font-bold text-slate-500 block uppercase">فیس اسٹیٹس</span>
              <span className={`text-xl sm:text-2xl font-black mt-1 block ${
                report.balanceRemaining === 0 ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {report.balanceRemaining === 0 ? '✓ ادا شدہ (Paid)' : `Rs. ${report.balanceRemaining} واجب`}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">
                ماہانہ فیس: Rs. {report.monthlyFee}
              </span>
            </div>

            {/* Tarbiyat */}
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm text-center">
              <span className="text-[11px] font-bold text-emerald-800 block uppercase">تربیت و اخلاقیات</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 block">
                شاندار (Good)
              </span>
              <span className="text-[11px] text-emerald-800 font-semibold">
                ناظرہ قرآن و اخلاقیات
              </span>
            </div>
          </div>

          {/* SECTION 2: EXAM RESULTS & TEST MARKS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4 print:hidden">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b pb-3">
              <Award className="w-5 h-5 text-amber-500" />
              <span>امتحانی نمبرات و ٹیسٹ جائزہ (Examination & Monthly Tests)</span>
            </div>

            {studentResults.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                اس طالب علم کا ابھی کوئی نیا ٹیسٹ رزلٹ درج نہیں کیا گیا ہے۔
              </p>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#07193B] text-white">
                    <tr>
                      <th className="p-3">مضمون (Subject)</th>
                      <th className="p-3">ٹیسٹ کا نام (Test Title)</th>
                      <th className="p-3">حاصل کردہ نمبر (Marks)</th>
                      <th className="p-3">گریڈ (Grade)</th>
                      <th className="p-3">استاد کا تبصرہ (Remarks)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentResults.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{r.subject}</td>
                        <td className="p-3 text-slate-600">{r.testTitle}</td>
                        <td className="p-3 font-black text-[#0D285F]">
                          {r.marksObtained} / {r.totalMarks}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                            r.grade === 'A+' || r.grade === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.grade === 'F'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {r.grade}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 italic">{r.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 3: DAILY TARBIYAT & CONDUCT OBSERVATIONS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4 print:hidden">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b pb-3">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>“پہلے تربیت، پھر تعلیم” روزمرہ اخلاقیات و ہوم ورک ڈائری</span>
            </div>

            {studentReports.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                بچہ باقاعدگی سے کلاس میں حاضر ہے اور اسکول ڈسپلن کی پابندی کر رہا ہے۔
              </p>
            ) : (
              <div className="space-y-3">
                {studentReports.map(dr => (
                  <div key={dr.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="font-bold text-[#0D285F]">{dr.date}</span>
                      <span className="text-[11px] text-slate-400">Teacher: {dr.teacherName}</span>
                    </div>
                    <p className="text-slate-800 italic font-medium">“{dr.teacherRemarks}”</p>
                    <div className="flex gap-2 pt-1 text-[10px]">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                        Homework: {dr.homework}
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                        Akhlaq: {dr.behaviour}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 4: ONLINE LEAVE APPLICATION */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4 print:hidden">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b pb-3">
              <Calendar className="w-5 h-5 text-amber-500" />
              <span>آن لائن رخصت کی درخواست (Apply Online Leave)</span>
            </div>

            <p className="text-xs text-slate-500">
              بغیر پیشگی اطلاع چھٹی کرنے پر اسکول قوانین کے مطابق یومیہ Rs. {settings.finePerAbsentDay || 50} جرمانہ لاگو ہوتا ہے۔ چھٹی کی پیشگی درخواست یہاں جمع کروائیں۔
            </p>

            {leaveSubmitted && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>آپ کی درخواست کامیابی سے جمع ہو گئی ہے اور اسکول ریکارڈ میں درج کر لی گئی ہے۔</span>
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="space-y-3 text-xs max-w-xl">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">چھٹی شروع ہونے کی تاریخ</label>
                  <input
                    type="date"
                    required
                    value={leaveFrom}
                    onChange={(e) => setLeaveFrom(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">چھٹی کے دن (Days)</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    required
                    value={leaveDays}
                    onChange={(e) => setLeaveDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">چھٹی کی وجہ (Reason)</label>
                <textarea
                  required
                  rows={2}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="مثال: بیماری کی وجہ سے، یا ضروری گھریلو کام..."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="bg-[#0D285F] hover:bg-[#07193B] text-white px-6 py-2.5 rounded-xl font-bold transition shadow cursor-pointer"
              >
                درخواست بھیجیں (Submit Leave)
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
