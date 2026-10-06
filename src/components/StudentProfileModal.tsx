import React, { useState } from 'react';
import {
  X,
  User,
  Calendar,
  DollarSign,
  Award,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Printer,
  Share2,
  MessageCircle,
  Clock,
  Camera,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Student } from '../types';
import { downloadStudentPhotoDirectly, downloadReceiptElementAsImage } from '../utils/downloadReceiptImage';

interface StudentProfileModalProps {
  student: Student | null;
  onClose: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ student, onClose }) => {
  const { getStudentFullReport, openWhatsApp, updateStudent } = useSchool();
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);

  if (!student) return null;

  const report = getStudentFullReport(student.id);
  if (!report) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPhoto = () => {
    const ok = downloadStudentPhotoDirectly(student);
    if (ok) {
      alert(`طالب علم ${student.name} کی تصویر (Photo) کامیابی سے ڈاؤن لوڈ ہو گئی!`);
    }
  };

  const handleDownloadCard = async () => {
    setIsDownloadingCard(true);
    const fileName = `Student_Card_${student.name.replace(/\s+/g, '_')}_${student.className}`;
    const ok = await downloadReceiptElementAsImage('printable-student-card', fileName);
    setIsDownloadingCard(false);
    if (ok) {
      alert(`طالب علم ${student.name} کا مکمل تعلیمی کارڈ (ID Card Image) کامیابی سے ڈاؤن لوڈ ہو گیا!`);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      updateStudent({
        ...student,
        photo: base64
      });
      alert(`طالب علم ${student.name} کی نئی تصویر محفوظ ہو گئی!`);
    };
    reader.readAsDataURL(file);
  };

  const handleWhatsAppShare = () => {
    const text = `*BRIGHT SCHOLAR SCHOOL - STUDENT REPORT CARD*
---------------------------------------
Student: ${student.name}
Father: ${student.fatherName}
Class: ${student.className} | Roll No: ${student.rollNo}
Admission No: ${student.admissionNo}

*ATTENDANCE SUMMARY:*
Working Days: ${report.totalWorkingDays}
Present: ${report.presentDays} | Absent: ${report.absentDays}
Attendance: ${report.attendancePercentage}%
Absence Fine (${report.absentDays} days x Rs. 30): Rs. ${report.totalFineAmount}

*FEES SUMMARY:*
Monthly Tuition Fee: Rs. ${report.monthlyFee.toLocaleString()}
Total Payable: Rs. ${report.totalPayable.toLocaleString()}
Paid Amount: Rs. ${report.paidAmount.toLocaleString()}
Current Balance: Rs. ${report.balanceRemaining.toLocaleString()} (${report.feeStatus})

*LATEST REMARKS:*
${report.recentDailyReports[0]?.teacherRemarks || 'Consistent in attendance and moral conduct.'}

“Pehle Tarbiyat, Phir Taleem”
Chak No. 47 GB, Samundri | Ph: 0302-5053993`;

    openWhatsApp(student.whatsappNo || student.contactNo, text);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 print:border-none print:shadow-none print:max-h-none print:w-full">
        {/* Modal Top Bar */}
        <div className="bg-[#0D285F] text-white p-5 flex items-center justify-between border-b-2 border-amber-400 print:bg-transparent print:text-slate-900 print:border-b-2 print:border-slate-800 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="relative group">
              {student.photo ? (
                <img
                  src={student.photo}
                  alt={student.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-md bg-white flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-amber-400 text-[#07193B] flex items-center justify-center font-bold font-serif-crest text-xl flex-shrink-0 shadow-md border-2 border-amber-300">
                  {student.name.charAt(0)}
                </div>
              )}
              <label
                htmlFor="profile-photo-upload"
                className="absolute -bottom-1 -right-1 bg-[#0D285F] hover:bg-[#07193B] text-amber-300 p-1 rounded-full border border-amber-400 cursor-pointer shadow print:hidden"
                title="طالب علم کی تصویر اپلوڈ یا تبدیل کریں"
              >
                <Camera className="w-3 h-3" />
              </label>
              <input
                id="profile-photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">{student.name}</h2>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-semibold px-2 py-0.5 rounded-full print:text-slate-800">
                  {student.className}
                </span>
              </div>
              <p className="text-xs text-slate-300 print:text-slate-600">
                S/O {student.fatherName} • Roll No: {student.rollNo} • Adm #{student.admissionNo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden flex-wrap">
            {/* Download Student Photo */}
            <button
              onClick={handleDownloadPhoto}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-[#07193B] px-3 py-1.5 rounded-lg text-xs font-black transition shadow-sm active:scale-95"
              title="طالب علم کی تصویر ڈاؤن لوڈ کریں (Download Photo)"
            >
              <Camera className="w-4 h-4 text-[#07193B]" />
              <span>تصویر ڈاؤن لوڈ</span>
            </button>

            {/* Download Official ID Card Image */}
            <button
              onClick={handleDownloadCard}
              disabled={isDownloadingCard}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-75"
              title="مکمل اسٹوڈنٹ کارڈ بطور تصویر ڈاؤن لوڈ کریں"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloadingCard ? 'ڈاؤن لوڈ...' : 'کارڈ تصویر (ID Card)'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              title="Print Student Report"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20b858] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div id="printable-student-card" className="p-6 overflow-y-auto space-y-6 bg-white">
          {/* Printable School Crest Title for official slips */}
          <div className="hidden print:block text-center border-b pb-4 mb-4">
            <h1 className="text-2xl font-bold tracking-wider font-serif-crest text-[#0D285F]">
              BRIGHT SCHOLAR SCHOOL
            </h1>
            <p className="text-xs font-semibold text-amber-700">“Pehle Tarbiyat, Phir Taleem”</p>
            <p className="text-xs text-slate-500">Chak No. 47 GB, Samundri, Faisalabad • Ph: 0302-5053993</p>
            <p className="text-sm font-bold uppercase mt-2 text-slate-800 underline">Official Student Academic & Discipline Dossier</p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-center">
              <span className="text-[11px] font-semibold text-blue-700 block uppercase tracking-wider">
                Attendance Rate
              </span>
              <span className="text-2xl font-black text-blue-900 mt-1 block">
                {report.attendancePercentage}%
              </span>
              <span className="text-[11px] text-blue-600">
                {report.presentDays} Present / {report.totalWorkingDays} Days
              </span>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-center">
              <span className="text-[11px] font-semibold text-red-700 block uppercase tracking-wider">
                Absence Fine
              </span>
              <span className="text-2xl font-black text-red-900 mt-1 block">
                Rs. {report.totalFineAmount}
              </span>
              <span className="text-[11px] text-red-600">
                {report.absentDays} Absents (Rs. 30/day)
              </span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-center">
              <span className="text-[11px] font-semibold text-emerald-700 block uppercase tracking-wider">
                Monthly Tuition
              </span>
              <span className="text-2xl font-black text-emerald-900 mt-1 block">
                Rs. {report.monthlyFee.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-600">
                {student.className} Tier
              </span>
            </div>

            <div className={`border rounded-xl p-3.5 text-center ${
              report.balanceRemaining === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <span className="text-[11px] font-semibold block uppercase tracking-wider">
                Current Fee Due
              </span>
              <span className="text-2xl font-black mt-1 block">
                Rs. {report.balanceRemaining.toLocaleString()}
              </span>
              <span className="text-[11px] font-bold">
                {report.balanceRemaining === 0 ? '✓ Paid & Cleared' : 'Payment Due'}
              </span>
            </div>
          </div>

          {/* Student Profile Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#0D285F]" />
                Bio & Contact Information (طالب علم کی تفصیلات و تصویر)
              </h3>
              <button
                type="button"
                onClick={handleDownloadPhoto}
                className="bg-amber-400 hover:bg-amber-500 text-[#07193B] text-[11px] font-black px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-sm print:hidden"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>تصویر ڈاؤن لوڈ کریں (Download Photo)</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Photo Display */}
              <div className="flex-shrink-0 text-center sm:text-left mx-auto sm:mx-0">
                {student.photo ? (
                  <img
                    src={student.photo}
                    alt={student.name}
                    className="w-24 h-28 object-cover rounded-xl border-2 border-slate-300 shadow-sm bg-white"
                  />
                ) : (
                  <div className="w-24 h-28 rounded-xl bg-slate-200 border-2 border-dashed border-slate-400 flex flex-col items-center justify-center text-slate-500 p-2 text-center">
                    <User className="w-8 h-8 text-slate-400 mb-1" />
                    <span className="text-[10px] font-bold">No Photo</span>
                  </div>
                )}
                <div className="mt-1 text-[10px] font-bold text-slate-600">
                  Roll #{student.rollNo}
                </div>
              </div>

              {/* Info Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs flex-1 w-full">
                <div>
                  <span className="text-slate-500">Father's Name:</span>
                  <p className="font-semibold text-slate-800">{student.fatherName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Date of Birth:</span>
                  <p className="font-semibold text-slate-800">{student.dob} ({student.gender})</p>
                </div>
                <div>
                  <span className="text-slate-500">Admission Date:</span>
                  <p className="font-semibold text-slate-800">{student.admissionDate}</p>
                </div>
                <div>
                  <span className="text-slate-500">Contact Number:</span>
                  <p className="font-semibold text-slate-800">{student.contactNo}</p>
                </div>
                <div>
                  <span className="text-slate-500">WhatsApp Number:</span>
                  <p className="font-semibold text-slate-800">{student.whatsappNo || student.contactNo}</p>
                </div>
                <div>
                  <span className="text-slate-500">Home Address:</span>
                  <p className="font-semibold text-slate-800">{student.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Test Performance & Examinations */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Examination & Monthly Assessment Records
            </h3>
            {report.testScores.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg">
                No test marks uploaded for this student yet.
              </p>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#07193B] text-white">
                    <tr>
                      <th className="p-3">Test Title</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Obtained / Total</th>
                      <th className="p-3">Percentage</th>
                      <th className="p-3">Grade</th>
                      <th className="p-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.testScores.map(t => {
                      const pct = Math.round((t.marksObtained / t.totalMarks) * 100);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-800">{t.testTitle}</td>
                          <td className="p-3 text-slate-600">{t.subject}</td>
                          <td className="p-3 font-bold text-slate-900">{t.marksObtained} / {t.totalMarks}</td>
                          <td className="p-3">{pct}%</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded font-black text-xs bg-amber-100 text-amber-900">
                              {t.grade}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 italic">{t.remarks}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tarbiyat & Daily Homework Tracking */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Tarbiyat, Akhlaqiat & Daily Homework Observations
            </h3>
            {report.recentDailyReports.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg">
                No daily teacher reports submitted yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {report.recentDailyReports.map(dr => (
                  <div key={dr.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-[#0D285F]">{dr.date}</span>
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                          Homework: {dr.homework}
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                          Discipline: {dr.behaviour}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-700 italic">“{dr.teacherRemarks}”</p>
                    <p className="text-[10px] text-slate-400 mt-1.5 text-right">— Teacher: {dr.teacherName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fee Invoices & Absence Fine Ledger */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-600" />
              Fee Records & Absence Fine Vouchers
            </h3>
            {report.feeHistory.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg">
                No fee history found.
              </p>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-3">Month</th>
                      <th className="p-3">Tuition</th>
                      <th className="p-3">Absent Days</th>
                      <th className="p-3">Fine (Rs.30/day)</th>
                      <th className="p-3">Total Payable</th>
                      <th className="p-3">Paid</th>
                      <th className="p-3">Balance</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.feeHistory.map(f => (
                      <tr key={f.id} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-800">{f.month}</td>
                        <td className="p-3">Rs. {f.tuitionFee.toLocaleString()}</td>
                        <td className="p-3 text-red-600 font-semibold">{f.absentDays} days</td>
                        <td className="p-3 text-red-700 font-bold">Rs. {f.fineAmount}</td>
                        <td className="p-3 font-bold text-slate-900">Rs. {f.totalPayable.toLocaleString()}</td>
                        <td className="p-3 text-emerald-600 font-bold">Rs. {f.paidAmount.toLocaleString()}</td>
                        <td className="p-3 font-bold text-slate-900">Rs. {f.balanceRemaining.toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : f.status === 'Partial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {f.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="text-xs text-slate-600">
            Official records maintained under Bright Scholar School Management System.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Share Slip on WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-xl text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
