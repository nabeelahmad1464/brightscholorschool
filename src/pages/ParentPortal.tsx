import React, { useState, useEffect } from 'react';
import {
  User,
  Calendar,
  DollarSign,
  Award,
  BookOpen,
  Printer,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Sparkles,
  Phone,
  FileText
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Student, ClassLevel, SCHOOL_CLASSES, FeeRecord } from '../types';
import { FeeReceiptModal } from '../components/FeeReceiptModal';

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
    dailyReports
  } = useSchool();

  // Find initial class based on currentParentStudentId or default to Class 5
  const getInitialClass = (): ClassLevel => {
    if (currentParentStudentId) {
      const match = students.find(s => s.id === currentParentStudentId);
      if (match) return match.className;
    }
    return 'Class 5';
  };

  const [selectedClass, setSelectedClass] = useState<ClassLevel>(getInitialClass);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(() => {
    if (currentParentStudentId && students.some(s => s.id === currentParentStudentId)) {
      return currentParentStudentId;
    }
    const inClass = students.filter(s => s.className === 'Class 5');
    return inClass[0]?.id || students[0]?.id || null;
  });

  const [rollSearchInput, setRollSearchInput] = useState<string>('');
  const [viewingReceipt, setViewingReceipt] = useState<FeeRecord | null>(null);

  // Leave Form state
  const [leaveDays, setLeaveDays] = useState(1);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveFrom, setLeaveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [leaveTo, setLeaveTo] = useState(new Date().toISOString().split('T')[0]);
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);

  // All students belonging to the chosen class
  const classStudents = students.filter(s => s.className === selectedClass);

  // When class changes, automatically pick the first student in that class
  const handleClassChange = (newClass: ClassLevel) => {
    setSelectedClass(newClass);
    setRollSearchInput('');
    const inClass = students.filter(s => s.className === newClass);
    if (inClass.length > 0) {
      setSelectedStudentId(inClass[0].id);
      setCurrentParentStudentId(inClass[0].id);
    } else {
      setSelectedStudentId(null);
    }
  };

  // When parent selects student from dropdown
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentParentStudentId(studentId);
    const found = students.find(s => s.id === studentId);
    if (found) {
      setSelectedClass(found.className);
      setRollSearchInput(found.rollNo);
    }
  };

  // When parent types a roll number or name
  const handleRollSearch = (val: string) => {
    setRollSearchInput(val);
    const clean = val.trim().toLowerCase();
    if (!clean) return;

    const cleanNum = clean.replace(/^0+/, '');

    // Search in current class first
    let match = classStudents.find(s => {
      const rollClean = s.rollNo.trim().toLowerCase();
      const rollNum = rollClean.replace(/^0+/, '');
      return rollClean === clean || (cleanNum !== '' && rollNum === cleanNum) || s.name.toLowerCase().includes(clean);
    });

    // If not found in current class, search across all school students
    if (!match) {
      match = students.find(s => {
        const rollClean = s.rollNo.trim().toLowerCase();
        const rollNum = rollClean.replace(/^0+/, '');
        return rollClean === clean || (cleanNum !== '' && rollNum === cleanNum) || s.name.toLowerCase().includes(clean);
      });
      if (match) {
        setSelectedClass(match.className);
      }
    }

    if (match) {
      setSelectedStudentId(match.id);
      setCurrentParentStudentId(match.id);
    }
  };

  // Ensure activeStudent is always populated if students exist
  const activeStudent =
    students.find(s => s.id === selectedStudentId) ||
    classStudents[0] ||
    students[0] ||
    null;

  const report = activeStudent ? getStudentFullReport(activeStudent.id) : null;

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

  const handleWhatsAppPaymentProof = () => {
    if (!activeStudent || !report) return;
    const text = `*BRIGHT SCHOLAR SCHOOL - CHAK 47 GB SAMUNDRI*\n` +
      `السلام علیکم! میں نے اپنے بچے کی فیس کے حوالے سے رابطہ کیا ہے۔\n` +
      `طالب علم: *${activeStudent.name}*\n` +
      `ولدیت: *${activeStudent.fatherName}*\n` +
      `کلاس: *${activeStudent.className}* | رول نمبر: *${activeStudent.rollNo}*\n` +
      `داخلہ نمبر: *${activeStudent.admissionNo}*\n` +
      `ماہانہ فیس: Rs. ${report.monthlyFee}\n` +
      `واجب الادا بقیہ رقم: Rs. ${report.balanceRemaining}\n` +
      `براہ کرم فیس کی تصدیق اور رسید جاری فرمائیں۔ شکریہ!`;

    openWhatsApp(settings.schoolWhatsApp, text);
  };

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* 1. Official School Header */}
      <div className="bg-[#0D285F] text-white rounded-2xl p-5 sm:p-7 shadow-md border-b-4 border-amber-400 text-center space-y-2.5">
        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-white p-1 border-2 border-amber-400 overflow-hidden shadow">
          <img
            src="/school_logo.jpg"
            alt="Bright Scholar School"
            className="w-full h-full object-cover rounded-full"
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
        </div>
        <h1 className="text-xl sm:text-3xl font-black font-serif-crest uppercase tracking-tight">
          Parent & Student Portal (پیرنٹ پورٹل)
        </h1>
        <div className="inline-block bg-amber-400 text-[#07193B] text-xs sm:text-sm font-extrabold px-4 py-1 rounded-full shadow-sm">
          “Pehle Tarbiyat, Phir Taleem” • Chak 47 GB Samundri • Est. 2017
        </div>
        <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto font-medium">
          نیچے اپنی کلاس اور بچے کا رول نمبر منتخب کریں، طالب علم کا مکمل تعلیمی ریکارڈ، فیس رسید، حاضری اور رزلٹ سامنے آ جائے گا۔
        </p>
      </div>

      {/* 2. SIMPLE, DIRECT CLASS & ROLL NUMBER SELECTOR */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-[#0D285F]/20 shadow-md space-y-4">
        {/* Step 1: Select Class */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-extrabold text-[#0D285F] flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-[#0D285F] text-amber-300 text-xs flex items-center justify-center font-black">1</span>
              <span>کلاس منتخب کریں (Select Class):</span>
            </label>
            <span className="text-[11px] text-slate-500 font-bold">
              اس کلاس میں {classStudents.length} طلباء موجود ہیں
            </span>
          </div>

          {/* Class Buttons Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
            {SCHOOL_CLASSES.map(cls => {
              const isSelected = selectedClass === cls;
              const count = students.filter(s => s.className === cls).length;

              return (
                <button
                  key={cls}
                  onClick={() => handleClassChange(cls)}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition border ${
                    isSelected
                      ? 'bg-[#0D285F] text-amber-300 border-[#0D285F] shadow-md scale-105'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{cls}</span>
                  <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-amber-400 text-[#07193B]' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select Student by Roll Number or Name */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-8 space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#0D285F] text-amber-300 text-[11px] flex items-center justify-center font-bold">2</span>
              <span>طالب علم کا نام منتخب کریں (Select Child):</span>
            </label>
            <select
              value={activeStudent ? activeStudent.id : ''}
              onChange={(e) => handleStudentSelect(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-300 hover:border-[#0D285F] focus:border-[#0D285F] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-extrabold text-[#0D285F] outline-none shadow-sm transition"
            >
              {classStudents.length === 0 ? (
                <option value="">اس کلاس میں کوئی طالب علم نہیں ہے</option>
              ) : (
                classStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    رول نمبر #{s.rollNo}: {s.name} (ولدیت: {s.fatherName})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="sm:col-span-4 space-y-1">
            <label className="text-xs font-bold text-slate-700">
              یا رول نمبر لکھیں (Or Type Roll #):
            </label>
            <input
              type="text"
              value={rollSearchInput}
              onChange={(e) => handleRollSearch(e.target.value)}
              placeholder="e.g. 01 یا نام لکھیں..."
              className="w-full bg-slate-50 border-2 border-slate-300 focus:border-[#0D285F] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none shadow-sm transition"
            />
          </div>
        </div>
      </div>

      {/* 3. DIRECT AND FULL DETAILS OF THE SELECTED CHILD */}
      {!activeStudent || !report ? (
        <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-800">
            اس کلاس میں ابھی کوئی طالب علم رجسٹرڈ نہیں ہے
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            براہ کرم اوپر دی گئی کلاسز میں سے دوسری کلاس منتخب کریں، یا اسکول آفس کے آفیشل واٹس ایپ پر رابطہ فرمائیں۔
          </p>
          <button
            onClick={() => handleClassChange('Class 5')}
            className="bg-[#0D285F] text-amber-300 font-bold text-xs px-4 py-2 rounded-xl shadow"
          >
            Class 5 کے طلباء دیکھیں
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Main Student Header Banner */}
          <div className="bg-[#0D285F] text-white rounded-2xl p-5 sm:p-6 shadow-md border-b-4 border-amber-400 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-400 text-[#07193B] font-black text-2xl flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-white">
                {activeStudent.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-black">{activeStudent.name}</h2>
                  <span className="bg-amber-400 text-[#07193B] text-xs font-black px-3 py-0.5 rounded-full">
                    {activeStudent.className}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  ولدیت: <strong>{activeStudent.fatherName}</strong> • رول نمبر: <strong>{activeStudent.rollNo}</strong> • داخلہ نمبر: <strong>{activeStudent.admissionNo}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onSelectStudent(activeStudent)}
                className="bg-amber-400 hover:bg-amber-300 text-[#07193B] font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>پرنٹ ایبل رپورٹ کارڈ (Dossier)</span>
              </button>
            </div>
          </div>

          {/* 4 Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
              <span className="text-[11px] font-bold text-red-800 block uppercase">غیر حاضری جرمانہ</span>
              <span className="text-2xl sm:text-3xl font-black text-red-600 mt-1 block">
                Rs. {report.totalFineAmount}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">
                {report.absentDays} چھٹیاں (@ Rs. {settings.finePerAbsentDay})
              </span>
            </div>

            {/* Fee Status */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-[11px] font-bold text-slate-500 block uppercase">ماہانہ فیس اسٹیٹس</span>
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

          {/* SECTION 1: FEE VOUCHER & PRINTABLE RECEIPT */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>ماہانہ اسکول فیس اور واؤچر رسید (Fee Voucher & Official Receipt)</span>
              </div>

              <div className="flex items-center gap-2">
                {studentFeeRecord && (
                  <button
                    onClick={() => setViewingReceipt(studentFeeRecord)}
                    className="bg-[#0D285F] hover:bg-[#07193B] text-amber-300 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>فیس رسید دیکھیں / پرنٹ کریں (Receipt)</span>
                  </button>
                )}
                <button
                  onClick={handleWhatsAppPaymentProof}
                  className="bg-[#25D366] hover:bg-[#20b858] text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                  <span>واٹس ایپ فیس رابطہ</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">ماہانہ ٹیوشن فیس:</span>
                <span className="text-base font-black text-slate-900">Rs. {report.monthlyFee.toLocaleString()}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-red-50/50 border border-red-200">
                <span className="text-red-700 block text-[11px]">غیر حاضری جرمانہ ({report.absentDays} دن @ Rs. {settings.finePerAbsentDay}):</span>
                <span className="text-base font-black text-red-600">Rs. {report.totalFineAmount.toLocaleString()}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200">
                <span className="text-emerald-800 block text-[11px]">کل واجب الادا رقم:</span>
                <span className="text-base font-black text-emerald-800">
                  Rs. {(report.monthlyFee + report.totalFineAmount).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: EXAM RESULTS & TEST MARKS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
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
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
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
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b pb-3">
              <Calendar className="w-5 h-5 text-amber-500" />
              <span>آن لائن رخصت کی درخواست (Apply Online Leave)</span>
            </div>

            <p className="text-xs text-slate-500">
              بغیر پیشگی اطلاع چھٹی کرنے پر اسکول قوانین کے مطابق یومیہ Rs. {settings.finePerAbsentDay} جرمانہ لاگو ہوتا ہے۔ چھٹی کی پیشگی درخواست یہاں جمع کروائیں۔
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
                className="bg-[#0D285F] hover:bg-[#07193B] text-white px-6 py-2.5 rounded-xl font-bold transition shadow"
              >
                درخواست بھیجیں (Submit Leave)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RENDER FEE RECEIPT MODAL */}
      <FeeReceiptModal
        feeRecord={viewingReceipt}
        onClose={() => setViewingReceipt(null)}
      />
    </div>
  );
};
