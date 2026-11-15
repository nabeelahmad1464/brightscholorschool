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
  FileText,
  Camera,
  Download,
  Eye,
  X
} from 'lucide-react';
import { useSchool, isDummyStudent } from '../context/SchoolContext';
import { Student, ClassLevel, SCHOOL_CLASSES, FeeRecord, StudentExamReport } from '../types';
import { downloadReceiptElementAsImage, generateAndDownloadReceiptCanvas } from '../utils/downloadReceiptImage';
import { downloadResultCardAsImage, printResultCard } from '../utils/resultCardExport';
import { normalizeDigits } from '../utils/schoolSync';
import { calculateGrade } from '../utils/resultCalculations';

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
    studentExamReports,
    syncNowWithCloud
  } = useSchool();

  const validStudents = students.filter(s => !isDummyStudent(s));

  // Find initial student if parent was already logged in with a valid non-dummy student
  const loggedInStudent = (currentParentStudentId
    ? validStudents.find(s => s.id === currentParentStudentId)
    : null) || null;

  const [inputClass, setInputClass] = useState<string>(
    loggedInStudent ? loggedInStudent.className : 'Play Group'
  );
  const [inputRollNo, setInputRollNo] = useState<string>(
    loggedInStudent ? loggedInStudent.rollNo : ''
  );
  const [searchedStudentId, setSearchedStudentId] = useState<string | null>(
    loggedInStudent ? loggedInStudent.id : null
  );
  const [hasSearched, setHasSearched] = useState<boolean>(!!loggedInStudent);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Auto-sync freshest cloud data when Parent opens portal
  useEffect(() => {
    syncNowWithCloud().catch(() => {});
  }, []);

  const handleResetSearch = () => {
    setSearchedStudentId(null);
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

  const [isSearching, setIsSearching] = useState(false);

  // Handle Search: Pull fresh cloud data directly and search strictly within selected class
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setLeaveSubmitted(false);

    const cleanRoll = normalizeDigits(inputRollNo).trim().toLowerCase();
    if (!cleanRoll) {
      setErrorMessage('Please enter student roll number (براہ کرم طالب علم کا رول نمبر درج فرمائیں)');
      setSearchedStudentId(null);
      setCurrentParentStudentId(null);
      setHasSearched(true);
      return;
    }

    setIsSearching(true);
    let latestStudents = validStudents;
    try {
      const pulled = await syncNowWithCloud();
      if (Array.isArray(pulled) && pulled.length > 0) {
        latestStudents = pulled.filter(s => !isDummyStudent(s));
      }
    } catch (err) {}
    setIsSearching(false);

    const cleanNum = cleanRoll.replace(/^0+/, '');
    const targetClass = inputClass.trim().toLowerCase();

    // STRICT SEARCH: ONLY in selected class using freshly fetched central database
    const match = latestStudents.find(s => {
      const sClass = (s.className || '').trim().toLowerCase();
      if (sClass !== targetClass) return false;
      const rollClean = normalizeDigits(s.rollNo || '').trim().toLowerCase();
      const rollNum = rollClean.replace(/^0+/, '');
      const admClean = normalizeDigits(s.admissionNo || '').trim().toLowerCase();
      const matchRoll = rollClean === cleanRoll || (cleanNum !== '' && rollNum === cleanNum);
      const matchAdm = admClean === cleanRoll;
      return matchRoll || matchAdm;
    }) || null;

    if (match) {
      setSearchedStudentId(match.id);
      setInputClass(match.className);
      setInputRollNo(match.rollNo);
      setCurrentParentStudentId(match.id);
      setHasSearched(true);
      setErrorMessage('');
    } else {
      setErrorMessage('Student not found. Please check the roll number and class.');
      setSearchedStudentId(null);
      setCurrentParentStudentId(null);
      setHasSearched(true);
    }
  };

  // Always derive activeStudent from live context students so edits/payments/attendance reflect immediately
  const activeStudent = (searchedStudentId
    ? validStudents.find(s => s.id === searchedStudentId)
    : loggedInStudent) || null;
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
    leaveDays: report.leaveDays,
    fineAmount: report.totalFineAmount,
    totalPayable: report.totalPayable,
    paidAmount: report.paidAmount,
    balanceRemaining: report.balanceRemaining,
    status: report.balanceRemaining === 0 ? 'Paid' : 'Unpaid',
    receiptNo: `REC-BSS-${activeStudent.id.slice(-4)}`
  } as FeeRecord) : null;

  const studentResults = activeStudent ? testResults.filter(r => r.studentId === activeStudent.id) : [];
  const studentReports = activeStudent ? dailyReports.filter(d => d.studentId === activeStudent.id) : [];
  // Only published examination reports for this child (Parents cannot see drafts or other children)
  const childExamReports = activeStudent
    ? studentExamReports.filter(r => r.studentId === activeStudent.id && r.isPublished)
    : [];
  const [selectedExamCard, setSelectedExamCard] = useState<StudentExamReport | null>(null);
  const liveSelectedExamCard = selectedExamCard
    ? childExamReports.find(r => r.id === selectedExamCard.id) || selectedExamCard
    : null;
  const [isExportingResultImage, setIsExportingResultImage] = useState<boolean>(false);

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

  const [isDownloadingImage, setIsDownloadingImage] = useState(false);

  const handleDownloadReceiptPicture = async () => {
    if (!activeStudent || !studentFeeRecord) return;
    setIsDownloadingImage(true);
    const fileName = `Fee_Receipt_${activeStudent.name.replace(/\s+/g, '_')}_Roll_${activeStudent.rollNo}`;

    // First try capturing the exact styled receipt card element
    let ok = await downloadReceiptElementAsImage('official-fee-receipt-card', fileName);

    // Fallback to high-res direct canvas generator if html2canvas had any issue
    if (!ok) {
      ok = generateAndDownloadReceiptCanvas(
        activeStudent,
        studentFeeRecord,
        settings.finePerAbsentDay || 50,
        settings.schoolName,
        settings.schoolAddress
      );
    }

    setIsDownloadingImage(false);
    if (ok) {
      alert(`رسید کی تصویر (Picture) کامیابی سے ڈاؤن لوڈ ہو گئی ہے!\nآپ اپنے موبائل کی گیلری یا ڈاؤن لوڈز فولڈر میں دیکھ سکتے ہیں۔`);
    } else {
      alert('تصویر ڈاؤن لوڈ کرنے میں دقت آئی، براہ کرم دوبارہ کوشش فرمائیں۔');
    }
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
      `ماہانہ ٹیوشن فیس: Rs. ${studentFeeRecord.tuitionFee}\n` +
      `منظور شدہ چھٹیاں (Leaves): ${report.leaveDays} دن (کوئی جرمانہ نہیں)\n` +
      `غیر حاضری فائن (${report.absentDays} دن @ Rs. ${finePerDay}): Rs. ${report.totalFineAmount}\n` +
      `کل واجب الادا فیس: *Rs. ${report.totalPayable}*\n` +
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
                onChange={(e) => {
                  setInputClass(e.target.value);
                  setSearchedStudentId(null);
                  setCurrentParentStudentId(null);
                  setErrorMessage('');
                  setHasSearched(false);
                }}
                className="w-full bg-slate-50 border-2 border-slate-300 focus:border-[#0D285F] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-extrabold text-[#0D285F] outline-none shadow-sm"
              >
                {SCHOOL_CLASSES.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
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
                onChange={(e) => {
                  setInputRollNo(e.target.value);
                  setSearchedStudentId(null);
                  setCurrentParentStudentId(null);
                  setErrorMessage('');
                  setHasSearched(false);
                }}
                placeholder="طالب علم کا رول نمبر (مثلاً: 01 یا 02)..."
                className="w-full bg-slate-50 border-2 border-slate-300 focus:border-[#0D285F] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-extrabold text-slate-900 outline-none shadow-sm"
              />
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-3 flex items-end">
              <button
                type="submit"
                disabled={isSearching}
                className="w-full bg-[#0D285F] hover:bg-[#07193B] text-amber-300 font-black text-xs sm:text-sm py-3 rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75"
              >
                <Search className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
                <span>{isSearching ? 'براہ راست تلاش...' : 'نتیجہ و رسید دیکھیں'}</span>
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

      {/* 3. PROMPT & SEARCH INSTRUCTIONS */}
      {!activeStudent && (
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-6 sm:p-8 text-center space-y-3 print:hidden">
          <GraduationCap className="w-12 h-12 text-[#0D285F] mx-auto opacity-75" />
          <h3 className="text-base font-extrabold text-slate-800">
            محترم والدین! بچے کا تعلیمی ریکارڈ، امتحانی نتیجہ اور فیس رسید
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            براہ کرم اوپر اپنے بچے کی کلاس منتخب کریں اور درست رول نمبر درج کر کے "نتیجہ و رسید دیکھیں" کا بٹن دبائیں۔ رازداری کے اصول کے تحت صرف آپ کے اپنے بچے کا ریکارڈ ظاہر ہوگا۔
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
          <div
            id="official-fee-receipt-card"
            className="bg-white rounded-3xl border-2 border-amber-400 shadow-xl overflow-hidden print:m-0 print:border-none print:shadow-none"
          >
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
                        Rs. {studentFeeRecord.tuitionFee.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-slate-800">
                        غیر حاضری جرمانہ (Unapproved Absence Fine)
                      </td>
                      <td className="p-3.5 text-center text-slate-500 font-medium">
                        {report.absentDays} دن غیر حاضر (@ Rs. {settings.finePerAbsentDay || 50}/day)
                        {report.leaveDays > 0 && (
                          <span className="block text-[11px] text-amber-700 font-semibold mt-0.5">
                            {report.leaveDays} منظور شدہ چھٹی (No Fine)
                          </span>
                        )}
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
                        Rs. {report.totalPayable.toLocaleString()}
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

                {/* Download Picture, Print, and WhatsApp Buttons */}
                <div className="flex flex-wrap items-center gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={handleDownloadReceiptPicture}
                    disabled={isDownloadingImage}
                    className="bg-amber-400 hover:bg-amber-500 text-[#07193B] font-black text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-70"
                    title="رسید کی تصویر (Picture / Image) اپنے موبائل میں ڈاؤن لوڈ کریں"
                  >
                    <Camera className="w-4 h-4 text-[#07193B]" />
                    <span>{isDownloadingImage ? 'تصویر بن رہی ہے...' : 'تصویر ڈاؤن لوڈ کریں (Download Picture)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="bg-[#0D285F] hover:bg-[#07193B] text-amber-300 font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>پرنٹ رسید (Print)</span>
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
                {report.presentDays} حاضری / {report.leaveDays} رخصت / {report.totalWorkingDays} کل دن
              </span>
            </div>

            {/* Absent Fine */}
            <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/20 shadow-sm text-center">
              <span className="text-[11px] font-bold text-red-800 block uppercase">غیر حاضری فائن</span>
              <span className="text-2xl sm:text-3xl font-black text-red-600 mt-1 block">
                Rs. {report.totalFineAmount}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">
                {report.absentDays} دن غیر حاضر (@ Rs. {settings.finePerAbsentDay || 50}) • {report.leaveDays} چھٹی
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
                ماہانہ فیس: Rs. {studentFeeRecord.tuitionFee}
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

          {/* SECTION 2: EXAM RESULTS & OFFICIAL MARKSHEETS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5 print:hidden">
            <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Award className="w-5 h-5 text-amber-500" />
                <span>امتحانی نتائج، کتاب وار مارک شیٹ و نتیجہ کارڈ (Official Marksheets)</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                صرف آپ کے بچے کے تصدیق شدہ نتائج
              </span>
            </div>

            {/* Official Term Exam Result Cards */}
            {childExamReports.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  آفیشل امتحانی مارک شیٹس (Official Exam Marksheets):
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {childExamReports.map(rep => (
                    <div
                      key={rep.id}
                      className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 border-2 border-amber-300 rounded-2xl p-4 shadow-sm hover:shadow transition space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="bg-[#0D285F] text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {rep.examTitle}
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-1">
                            تاریخ: {rep.examDate} • کلاس {rep.className}
                          </span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full font-black text-xs ${
                          rep.status === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {rep.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-200 text-center">
                        <div>
                          <span className="text-[10px] text-slate-500 block">حاصل کردہ / کل</span>
                          <strong className="text-xs font-black text-[#0D285F]">{rep.totalObtained} / {rep.grandTotal}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">فیصد %</span>
                          <strong className="text-xs font-black text-emerald-700">{rep.percentage}%</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">گریڈ</span>
                          <strong className="text-sm font-black text-amber-700">{rep.grade}</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedExamCard(rep)}
                        className="w-full bg-[#0D285F] hover:bg-[#10337A] text-amber-300 font-extrabold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>مکمل نتیجہ کارڈ دیکھیں، پرنٹ و ڈاؤن لوڈ کریں (View Result Card)</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Assessment Tests */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                ماہانہ ٹیسٹ ریکارڈز (Monthly Assessment Tests):
              </h4>
              {studentResults.length === 0 && childExamReports.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  اس طالب علم کا ابھی کوئی امتحانی نتیجہ یا ٹیسٹ رزلٹ شائع نہیں ہوا ہے۔
                </p>
              ) : studentResults.length > 0 ? (
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
              ) : null}
            </div>
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

      {/* MODAL: OFFICIAL RESULT CARD MARKSHEET (پرنٹ و تصویر ڈاؤن لوڈ) */}
      {liveSelectedExamCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full my-4 sm:my-6 overflow-hidden border border-slate-200 flex flex-col max-h-[94vh]">
            {/* Modal Top Control Bar */}
            <div className="bg-[#0D285F] text-white px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2.5 border-b-2 border-amber-400 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  آفیشل نتیجہ کارڈ مارک شیٹ (Official Marksheet)
                </h3>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => printResultCard('printable-parent-result-card')}
                  className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1 border border-white/20 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                  <span>پرنٹ کریں</span>
                </button>

                <button
                  type="button"
                  disabled={isExportingResultImage}
                  onClick={async () => {
                    setIsExportingResultImage(true);
                    await downloadResultCardAsImage(
                      'printable-parent-result-card',
                      liveSelectedExamCard.studentName,
                      liveSelectedExamCard.examTitle,
                      'png'
                    );
                    setIsExportingResultImage(false);
                  }}
                  className="bg-amber-400 hover:bg-amber-300 text-[#07193B] font-extrabold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExportingResultImage ? 'ڈاؤن لوڈ...' : 'تصویر محفوظ کریں'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const msg = `*BRIGHT SCHOLAR SCHOOL* - نتیجہ کارڈ\nطالب علم: *${liveSelectedExamCard.studentName}*\nکلاس: *${liveSelectedExamCard.className}* (Roll: ${liveSelectedExamCard.rollNo})\nامتحان: *${liveSelectedExamCard.examTitle}*\nنمبر: *${liveSelectedExamCard.totalObtained} / ${liveSelectedExamCard.grandTotal}* (${liveSelectedExamCard.percentage}%)\nگریڈ: *${liveSelectedExamCard.grade}* (${liveSelectedExamCard.status})`;
                    openWhatsApp('0302-5053993', msg);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>واٹس ایپ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedExamCard(null)}
                  className="text-slate-300 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Printable Marksheet Area */}
            <div className="p-3 sm:p-6 overflow-y-auto bg-slate-100 flex-1">
              <div
                id="printable-parent-result-card"
                className="bg-white rounded-2xl border-4 border-[#0D285F] shadow-lg p-4 sm:p-8 max-w-2xl mx-auto text-slate-800 space-y-5 relative"
              >
                <div className="absolute inset-1.5 border border-amber-400 rounded-xl pointer-events-none"></div>

                {/* Marksheet Header */}
                <div className="text-center pb-4 border-b-2 border-[#0D285F]">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#0D285F] border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-md flex-shrink-0">
                      <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-3xl font-black text-[#0D285F] tracking-tight uppercase font-serif-crest">
                        BRIGHT SCHOLAR SCHOOL
                      </h1>
                      <div className="text-[11px] sm:text-xs font-bold text-amber-700 tracking-wider">
                        “پہلے تربیت، پھر تعلیم” • Character First, Then Education
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Chak No. 47 GB, Samundri, Faisalabad, Punjab • Ph / WhatsApp: 0302-5053993
                  </p>
                  <div className="inline-block mt-3 bg-[#0D285F] text-amber-300 font-extrabold text-[11px] sm:text-xs px-4 sm:px-6 py-1.5 rounded-full shadow tracking-wider uppercase">
                    STUDENT PROGRESS REPORT & MARKSHEET (امتحانی نتیجہ کارڈ)
                  </div>
                </div>

                {/* Bio Grid */}
                <div className="bg-slate-50 border border-slate-300 rounded-xl p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium block text-[10px]">طالب علم کا نام (Student Name):</span>
                    <strong className="text-sm font-extrabold text-[#0D285F]">{liveSelectedExamCard.studentName}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block text-[10px]">ولدیت (Father's Name):</span>
                    <strong className="text-sm font-extrabold text-slate-800">{liveSelectedExamCard.fatherName}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block text-[10px]">کلاس (Class):</span>
                    <strong className="text-xs font-bold text-[#0D285F]">{liveSelectedExamCard.className}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block text-[10px]">رول نمبر (Roll No):</span>
                    <strong className="text-xs font-bold text-amber-700">Roll No. {liveSelectedExamCard.rollNo}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block text-[10px]">داخلہ نمبر (Admission No):</span>
                    <span className="text-xs font-mono font-semibold">{liveSelectedExamCard.admissionNo}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block text-[10px]">امتحان اور تاریخ (Examination & Date):</span>
                    <span className="text-xs font-bold text-slate-700">
                      {liveSelectedExamCard.examTitle} ({liveSelectedExamCard.examDate})
                    </span>
                  </div>
                </div>

                {/* Subjects Table */}
                <div className="border border-slate-300 rounded-xl overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[460px]">
                    <thead className="bg-[#0D285F] text-white">
                      <tr>
                        <th className="p-2.5 w-10 text-center">#</th>
                        <th className="p-2.5">مضمون / کتاب (Subject Name)</th>
                        <th className="p-2.5 w-20 text-center">کل نمبر</th>
                        <th className="p-2.5 w-24 text-center">حاصل کردہ</th>
                        <th className="p-2.5 w-20 text-center">فیصد</th>
                        <th className="p-2.5 w-16 text-center">گریڈ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {liveSelectedExamCard.subjects.map((sub, idx) => {
                        const pct =
                          sub.totalMarks > 0
                            ? Math.round((sub.obtainedMarks / sub.totalMarks) * 1000) / 10
                            : 0;
                        return (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                            <td className="p-2.5 text-center text-slate-500 font-bold">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-slate-800">{sub.subject}</td>
                            <td className="p-2.5 text-center font-semibold text-slate-600">{sub.totalMarks}</td>
                            <td className="p-2.5 text-center font-extrabold text-[#0D285F] text-sm">
                              {sub.obtainedMarks}
                            </td>
                            <td className="p-2.5 text-center font-bold text-slate-700">{pct}%</td>
                            <td className="p-2.5 text-center">
                              <span className="font-extrabold text-amber-700">
                                {sub.grade && sub.grade !== '-' ? sub.grade : calculateGrade(pct)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-amber-50 font-black border-t-2 border-[#0D285F] text-xs">
                      <tr>
                        <td colSpan={2} className="p-3 text-right uppercase tracking-wider text-[#0D285F]">
                          گرینڈ ٹوٹل (Grand Total):
                        </td>
                        <td className="p-3 text-center text-slate-800">{liveSelectedExamCard.grandTotal}</td>
                        <td className="p-3 text-center text-[#0D285F] text-base">{liveSelectedExamCard.totalObtained}</td>
                        <td className="p-3 text-center text-emerald-800">{liveSelectedExamCard.percentage}%</td>
                        <td className="p-3 text-center text-base text-amber-800">{liveSelectedExamCard.grade}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Performance Summary */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-500 block">امتحانی نتیجہ (Status)</span>
                    <strong
                      className={`text-xs sm:text-sm font-extrabold ${
                        liveSelectedExamCard.status === 'Pass' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {liveSelectedExamCard.status === 'Pass' ? 'کامیاب (PASSED)' : 'توجہ طلب (FAILED)'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">حاصل کردہ گریڈ (Overall Grade)</span>
                    <strong className="text-lg sm:text-xl font-black text-amber-600">{liveSelectedExamCard.grade}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">مجموعی فیصد (Percentage)</span>
                    <strong className="text-xs sm:text-sm font-extrabold text-[#0D285F]">{liveSelectedExamCard.percentage}%</strong>
                  </div>
                </div>

                {/* Remarks & Character Observation */}
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-amber-900 block text-[11px]">
                    استاد کے مشاہدات و اخلاقی تربیت (Teacher Remarks & Character Evaluation):
                  </span>
                  <p className="text-slate-700 italic">
                    "{liveSelectedExamCard.generalRemarks || 'Shows keen commitment to moral character and academic excellence.'}"
                  </p>
                </div>

                {/* Official Signatures & Seal (NO personal principal name - only PRINCIPAL stamp) */}
                <div className="pt-6 sm:pt-8 flex flex-wrap items-end justify-between gap-4 px-2 sm:px-4 text-center">
                  <div className="w-36 sm:w-44">
                    <div className="border-b-2 border-slate-800 pb-1 mb-1 font-serif text-slate-700 italic text-xs">
                      {liveSelectedExamCard.enteredByName && !/tasawar|principal/i.test(liveSelectedExamCard.enteredByName)
                        ? liveSelectedExamCard.enteredByName
                        : 'Class Teacher'}
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">
                      کلاس ٹیچر دستخط (Class Teacher)
                    </span>
                  </div>

                  {/* School Seal Stamp */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-double border-[#0D285F] p-1 flex items-center justify-center text-center">
                    <div className="text-[7px] sm:text-[8px] font-bold text-[#0D285F] leading-tight">
                      ★ BRIGHT SCHOLAR ★<br />
                      OFFICIAL SEAL<br />
                      CHAK 47 GB<br />
                      SAMUNDRI
                    </div>
                  </div>

                  <div className="w-36 sm:w-44">
                    <div className="inline-block border-2 border-[#0D285F] rounded-md px-3 py-0.5 mb-1.5 bg-[#0D285F]/5">
                      <span className="font-black text-[#0D285F] tracking-[0.2em] text-xs uppercase">
                        PRINCIPAL
                      </span>
                    </div>
                    <div className="border-b-2 border-slate-800 pb-1 mb-1"></div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">
                      پرنسپل مہر و دستخط (Principal Stamp)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
