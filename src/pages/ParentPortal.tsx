import React, { useState } from 'react';
import {
  User,
  Calendar,
  DollarSign,
  Award,
  BookOpen,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Printer,
  MessageCircle,
  Clock,
  Search,
  Filter,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  HeartHandshake
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

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    currentParentStudentId && students.some(s => s.id === currentParentStudentId)
      ? currentParentStudentId
      : null
  );

  const [classFilter, setClassFilter] = useState<ClassLevel | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingReceipt, setViewingReceipt] = useState<FeeRecord | null>(null);

  // Leave Form state
  const [leaveDays, setLeaveDays] = useState(1);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveFrom, setLeaveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [leaveTo, setLeaveTo] = useState(new Date().toISOString().split('T')[0]);
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);

  const activeStudent = students.find(s => s.id === selectedStudentId);
  const report = activeStudent ? getStudentFullReport(activeStudent.id) : null;

  // Filter students for the directory search with smart multi-attribute matching
  const filteredStudents = students.filter(s => {
    const matchClass = classFilter === 'All' || s.className === classFilter;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchClass;

    const cleanNum = q.replace(/^0+/, '');
    const rollClean = s.rollNo.trim().toLowerCase();
    const rollNum = rollClean.replace(/^0+/, '');
    const matchRoll = rollClean === q || (cleanNum !== '' && rollNum === cleanNum);
    const matchAdm = s.admissionNo.toLowerCase().includes(q);
    const matchName = s.name.toLowerCase().includes(q) || s.fatherName.toLowerCase().includes(q);

    return matchClass && (matchRoll || matchAdm || matchName);
  });

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

  // 1. IF NO STUDENT IS SELECTED OR PARENT WANTS TO BROWSE DIRECTORY
  if (!activeStudent || !report) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome Header */}
        <div className="bg-[#0D285F] text-white rounded-2xl p-6 sm:p-8 shadow-md border-b-4 border-amber-400 text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-white p-1 border-2 border-amber-400 overflow-hidden shadow">
            <img
              src="/school_logo.jpg"
              alt="Bright Scholar School"
              className="w-full h-full object-cover rounded-full"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-serif-crest uppercase">
            Parent & Student Portal (پیرنٹ پورٹل)
          </h1>
          <div className="inline-block bg-amber-400 text-[#07193B] text-xs sm:text-sm font-extrabold px-4 py-1 rounded-full">
            “Pehle Tarbiyat, Phir Taleem” • Chak 47 GB Samundri
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            اپنے بچے کا روزمرہ تعلیمی ریکارڈ، حاضری، فیس واؤچر، امتحانی رزلٹ اور اخلاقی تربیت دیکھنے کے لیے اپنا بچہ منتخب کریں۔
          </p>
        </div>

        {/* Search & Class Filter Box */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="طالب علم کا نام یا رول نمبر لکھیں..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0D285F] outline-none"
              />
            </div>

            {/* Class Pill Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
              <button
                onClick={() => setClassFilter('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  classFilter === 'All' ? 'bg-[#0D285F] text-amber-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                تمام کلاسز (All)
              </button>
              {SCHOOL_CLASSES.map(cls => (
                <button
                  key={cls}
                  onClick={() => setClassFilter(cls)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    classFilter === cls ? 'bg-[#0D285F] text-amber-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Student Cards Grid */}
          <div className="pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs text-slate-600 font-bold">
              <span>
                دستیاب طلباء کی فہرست ({filteredStudents.length} بچے) • اسکول رجسٹر میں کل {students.length} طلباء
              </span>
              <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                اپنے بچے کے نام پر کلک کر کے پورٹل کھولیں
              </span>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 bg-amber-50/40 rounded-2xl border-2 border-dashed border-amber-300 p-6 space-y-3">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                <h3 className="text-base font-extrabold text-slate-800">
                  کوئی طالب علم نہیں ملا (No Student Found)
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  {searchQuery ? `سرچ "${searchQuery}" کے مطابق` : classFilter !== 'All' ? `کلاس "${classFilter}" میں` : ''} کوئی طالب علم نہیں ملا۔ براہ کرم املا چیک کریں یا نیچے بٹن پر کلک کریں۔
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => { setClassFilter('All'); setSearchQuery(''); }}
                    className="bg-[#0D285F] text-amber-300 px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#07193B] transition shadow"
                  >
                    تمام طلباء دیکھیں (Show All {students.length} Students)
                  </button>
                  <button
                    onClick={() => openWhatsApp(settings.schoolWhatsApp, `السلام علیکم! مجھے پورٹل پر اپنے بچے کا ریکارڈ نہیں مل رہا۔ برائے مہربانی رہنمائی فرمائیں۔`)}
                    className="bg-[#25D366] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#20b858] transition flex items-center gap-1.5 shadow"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>اسکول واٹس ایپ پر رابطہ کریں</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredStudents.map(st => {
                  const studentFee = feeRecords.find(f => f.studentId === st.id);
                  const isPaid = studentFee ? studentFee.balanceRemaining === 0 : false;

                  return (
                    <div
                      key={st.id}
                      onClick={() => {
                        setSelectedStudentId(st.id);
                        setCurrentParentStudentId(st.id);
                      }}
                      className="bg-white border-2 border-slate-200 hover:border-[#0D285F] rounded-2xl p-4 cursor-pointer transition shadow-sm hover:shadow-md group space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-[#0D285F] text-amber-300 font-black text-sm flex flex-col items-center justify-center flex-shrink-0 group-hover:scale-105 transition shadow-sm border border-amber-400/40">
                              <span className="text-[9px] uppercase tracking-tighter text-amber-200">Roll</span>
                              <span>{st.rollNo}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-[#0D285F] truncate">
                                {st.name}
                              </h4>
                              <p className="text-xs text-slate-500 truncate">
                                ولدیت: <strong className="text-slate-700">{st.fatherName}</strong>
                              </p>
                            </div>
                          </div>

                          <span className="bg-blue-50 text-blue-900 text-[11px] font-extrabold px-2.5 py-1 rounded-lg border border-blue-200 whitespace-nowrap">
                            {st.className}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>داخلہ نمبر: <strong className="text-slate-700">{st.admissionNo}</strong></span>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {isPaid ? '✓ فیس ادا شدہ' : 'فیس واجب الادا'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400">Chak 47 GB</span>
                        <span className="font-extrabold text-[#0D285F] bg-amber-400/20 group-hover:bg-amber-400 group-hover:text-[#07193B] px-3 py-1 rounded-lg flex items-center gap-1 transition">
                          <span>پورٹل کھولیں</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. WHEN A STUDENT IS SELECTED: FULL INTERACTIVE STUDENT DOSSIER
  const studentFeeRecord = feeRecords.find(f => f.studentId === activeStudent.id) || {
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
  } as FeeRecord;

  const studentResults = testResults.filter(r => r.studentId === activeStudent.id);
  const studentReports = dailyReports.filter(d => d.studentId === activeStudent.id);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Top Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-3 rounded-2xl border border-slate-200">
        <button
          onClick={() => setSelectedStudentId(null)}
          className="bg-white hover:bg-slate-50 text-[#0D285F] border border-slate-300 font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm transition"
        >
          <ArrowLeft className="w-4 h-4 text-amber-500" />
          <span>دوسرا طالب علم منتخب کریں (Change Child)</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 hidden sm:inline">منتخب بچہ:</span>
          <select
            value={activeStudent.id}
            onChange={(e) => {
              setSelectedStudentId(e.target.value);
              setCurrentParentStudentId(e.target.value);
            }}
            className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-extrabold text-[#0D285F]"
          >
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.className} - Roll #{s.rollNo})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Student Header Banner */}
      <div className="bg-[#0D285F] text-white rounded-2xl p-6 shadow-md border-b-4 border-amber-400 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-400 text-[#07193B] font-black text-2xl flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-white">
            {activeStudent.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black">{activeStudent.name}</h1>
              <span className="bg-amber-400 text-[#07193B] text-xs font-black px-3 py-0.5 rounded-full">
                {activeStudent.className}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              ولدیت: <strong>{activeStudent.fatherName}</strong> • رول نمبر: <strong>{activeStudent.rollNo}</strong> • داخلہ نمبر: <strong>{activeStudent.admissionNo}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectStudent(activeStudent)}
            className="bg-amber-400 hover:bg-amber-300 text-[#07193B] font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>پرنٹ ایبل رپورٹ کارڈ (Dossier)</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Attendance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">حاضری کا تناسب</span>
          <span className="text-2xl sm:text-3xl font-black text-[#0D285F] mt-1 block">
            {report.attendancePercentage}%
          </span>
          <span className="text-[11px] text-slate-500">
            {report.presentDays} حاضری / {report.totalWorkingDays} کل دن
          </span>
        </div>

        {/* Absent Fine */}
        <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/20 shadow-sm text-center">
          <span className="text-[11px] font-bold text-red-800 block uppercase">غیر حاضری جرمانہ</span>
          <span className="text-2xl sm:text-3xl font-black text-red-600 mt-1 block">
            Rs. {report.totalFineAmount}
          </span>
          <span className="text-[11px] text-slate-500">
            {report.absentDays} دن غیر حاضر (@ Rs. {settings.finePerAbsentDay})
          </span>
        </div>

        {/* Fee Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">ماہانہ فیس اسٹیٹس</span>
          <span className={`text-xl sm:text-2xl font-black mt-1 block ${
            report.balanceRemaining === 0 ? 'text-emerald-600' : 'text-amber-600'
          }`}>
            {report.balanceRemaining === 0 ? '✓ ادا شدہ (Paid)' : `Rs. ${report.balanceRemaining} باقی`}
          </span>
          <span className="text-[11px] text-slate-500">
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
            <span>ماہانہ اسکول فیس و آفیشل واؤچر رسید</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewingReceipt(studentFeeRecord)}
              className="bg-[#0D285F] hover:bg-[#07193B] text-amber-300 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>فیس رسید دیکھیں / پرنٹ کریں (Receipt)</span>
            </button>
            <button
              onClick={handleWhatsAppPaymentProof}
              className="bg-[#25D366] hover:bg-[#20b858] text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              <span>واٹس ایپ رابطہ</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px]">ماہانہ ٹیوشن فیس:</span>
            <span className="text-base font-black text-slate-900">Rs. {report.monthlyFee.toLocaleString()}</span>
          </div>
          <div className="p-3 rounded-xl bg-red-50/50 border border-red-200">
            <span className="text-red-700 block text-[11px]">غیر حاضری جرمانہ ({report.absentDays} دن @ Rs. {settings.finePerAbsentDay}):</span>
            <span className="text-base font-black text-red-600">Rs. {report.totalFineAmount.toLocaleString()}</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
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
            اس طالب علم کا ابھی کوئی ٹیسٹ رزلٹ درج نہیں کیا گیا ہے۔
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
            آج کا کوئی منفی یا خاص ریمارک درج نہیں، بچہ پابندی سے کلاس میں حاضر ہے۔
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

      {/* RENDER FEE RECEIPT MODAL */}
      <FeeReceiptModal
        feeRecord={viewingReceipt}
        onClose={() => setViewingReceipt(null)}
      />
    </div>
  );
};
