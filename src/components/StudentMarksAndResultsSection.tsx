import React, { useState, useMemo } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  GraduationCap,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Share2,
  Trash2,
  X,
  AlertCircle,
  Check,
  Send
} from 'lucide-react';
import { useSchool, isDummyStudent } from '../context/SchoolContext';
import {
  Student,
  ClassLevel,
  SCHOOL_CLASSES,
  StudentExamReport,
  SubjectMarkEntry
} from '../types';
import { downloadResultCardAsImage, printResultCard } from '../utils/resultCardExport';

interface StudentMarksAndResultsSectionProps {
  role: 'admin' | 'teacher';
  teacherAssignedClasses?: string;
  teacherName?: string;
}

// Default standard subjects recommended per class level (fully customizable)
const DEFAULT_PRIMARY_SUBJECTS: { subject: string; totalMarks: number }[] = [
  { subject: 'English (انگریزی)', totalMarks: 100 },
  { subject: 'Urdu (اردو)', totalMarks: 100 },
  { subject: 'Mathematics (ریاضی)', totalMarks: 100 },
  { subject: 'General Science (سائنس)', totalMarks: 100 },
  { subject: 'Islamiat (اسلامیات / اخلاقیات)', totalMarks: 50 },
  { subject: 'Nazra Quran & Tarbiyat (ناظرہ قرآن و تربیت)', totalMarks: 50 }
];

const DEFAULT_PLAYGROUP_SUBJECTS: { subject: string; totalMarks: number }[] = [
  { subject: 'English Alphabets & Oral (انگریزی)', totalMarks: 50 },
  { subject: 'Urdu Huroof & Nazm (اردو نظم)', totalMarks: 50 },
  { subject: 'Mathematics Numbers & Counting (گنتی)', totalMarks: 50 },
  { subject: 'General Knowledge & Tarbiyat (معلومات عامہ)', totalMarks: 50 }
];

const DEFAULT_MIDDLE_SUBJECTS: { subject: string; totalMarks: number }[] = [
  { subject: 'English Compulsory (انگریزی)', totalMarks: 100 },
  { subject: 'Urdu Compulsory (اردو)', totalMarks: 100 },
  { subject: 'Mathematics (ریاضی)', totalMarks: 100 },
  { subject: 'General Science (سائنس)', totalMarks: 100 },
  { subject: 'Islamiat (اسلامیات)', totalMarks: 50 },
  { subject: 'Social Studies / Pak Studies (مطالعہ پاکستان)', totalMarks: 50 },
  { subject: 'Computer Education (کمپیوٹر)', totalMarks: 50 },
  { subject: 'Tarjuma-tul-Quran (ترجمۃ القرآن)', totalMarks: 50 }
];

function getDefaultSubjectsForClass(className: string): { subject: string; totalMarks: number }[] {
  const c = className.toLowerCase();
  if (c.includes('play') || c.includes('nursery') || c.includes('prep')) {
    return DEFAULT_PLAYGROUP_SUBJECTS;
  }
  if (c.includes('6') || c.includes('7') || c.includes('8') || c.includes('middle')) {
    return DEFAULT_MIDDLE_SUBJECTS;
  }
  return DEFAULT_PRIMARY_SUBJECTS;
}

export const StudentMarksAndResultsSection: React.FC<StudentMarksAndResultsSectionProps> = ({
  role,
  teacherAssignedClasses,
  teacherName = 'Authorized Teacher'
}) => {
  const {
    students,
    studentExamReports,
    saveStudentExamReport,
    deleteStudentExamReport,
    togglePublishExamReport,
    openWhatsApp
  } = useSchool();

  // Filter students to real enrolled students only
  const validStudents = useMemo(() => {
    return students.filter(s => !isDummyStudent(s));
  }, [students]);

  // Determine allowed classes for this role
  const availableClasses = useMemo(() => {
    if (role === 'admin' || !teacherAssignedClasses || teacherAssignedClasses.toLowerCase().includes('all')) {
      return SCHOOL_CLASSES;
    }
    const assigned = teacherAssignedClasses
      .split(',')
      .map(c => c.trim().toLowerCase());
    const filtered = SCHOOL_CLASSES.filter(c =>
      assigned.some(a => c.toLowerCase().includes(a) || a.includes(c.toLowerCase()))
    );
    return filtered.length > 0 ? filtered : SCHOOL_CLASSES;
  }, [role, teacherAssignedClasses]);

  // View state: 'list' | 'entry'
  const [currentView, setCurrentView] = useState<'list' | 'entry'>('list');
  const [filterClass, setFilterClass] = useState<string>('All');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [selectedExamCard, setSelectedExamCard] = useState<StudentExamReport | null>(null);

  // Marks Entry Form state
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [formClass, setFormClass] = useState<ClassLevel>(availableClasses[0] || 'Class 5');
  const [formStudentId, setFormStudentId] = useState<string>('');
  const [studentSearchInput, setStudentSearchInput] = useState<string>('');
  const [formExamTitle, setFormExamTitle] = useState<string>('First Term Examination 2026');
  const [formExamDate, setFormExamDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formRemarks, setFormRemarks] = useState<string>('Hardworking and morally disciplined.');
  const [formSubjects, setFormSubjects] = useState<SubjectMarkEntry[]>([]);
  const [formIsPublished, setFormIsPublished] = useState<boolean>(true);

  // New custom subject inputs
  const [newSubjectName, setNewSubjectName] = useState<string>('');
  const [newSubjectTotal, setNewSubjectTotal] = useState<number>(100);

  // Filter students belonging to formClass
  const classStudents = useMemo(() => {
    return validStudents.filter(s => s.className === formClass);
  }, [validStudents, formClass]);

  // Selected student object
  const selectedStudent = useMemo(() => {
    return validStudents.find(s => s.id === formStudentId) || null;
  }, [validStudents, formStudentId]);

  // Filtered reports for list view
  const filteredReports = useMemo(() => {
    return studentExamReports.filter(rep => {
      if (filterClass !== 'All' && rep.className !== filterClass) return false;
      if (filterSearch.trim()) {
        const q = filterSearch.toLowerCase().trim();
        const matchName = rep.studentName.toLowerCase().includes(q);
        const matchRoll = (rep.rollNo || '').toLowerCase().includes(q);
        const matchExam = rep.examTitle.toLowerCase().includes(q);
        const matchAdm = (rep.admissionNo || '').toLowerCase().includes(q);
        if (!matchName && !matchRoll && !matchExam && !matchAdm) return false;
      }
      return true;
    });
  }, [studentExamReports, filterClass, filterSearch]);

  // Initialize new marks entry
  const startNewEntry = (preselectedStudent?: Student) => {
    setEditingReportId(null);
    const initialClass = preselectedStudent ? (preselectedStudent.className as ClassLevel) : (availableClasses[0] || 'Class 5');
    setFormClass(initialClass);
    setFormStudentId(preselectedStudent ? preselectedStudent.id : (validStudents.find(s => s.className === initialClass)?.id || ''));
    setStudentSearchInput(preselectedStudent ? `${preselectedStudent.name} (Roll ${preselectedStudent.rollNo})` : '');
    setFormExamTitle('First Term Examination 2026');
    setFormExamDate(new Date().toISOString().split('T')[0]);
    setFormRemarks('Demonstrated good discipline and regular studies.');
    setFormIsPublished(true);

    // Populate default subjects
    const defaults = getDefaultSubjectsForClass(initialClass);
    setFormSubjects(
      defaults.map(d => ({
        subject: d.subject,
        totalMarks: d.totalMarks,
        obtainedMarks: Math.round(d.totalMarks * 0.75), // sensible starter marks
        grade: 'A',
        remarks: 'Good'
      }))
    );

    setCurrentView('entry');
  };

  // Start editing existing report
  const startEditReport = (report: StudentExamReport) => {
    setEditingReportId(report.id);
    setFormClass(report.className as ClassLevel);
    setFormStudentId(report.studentId);
    setStudentSearchInput(`${report.studentName} (Roll ${report.rollNo})`);
    setFormExamTitle(report.examTitle);
    setFormExamDate(report.examDate);
    setFormRemarks(report.generalRemarks || 'Hardworking and well behaved.');
    setFormIsPublished(report.isPublished);
    setFormSubjects([...report.subjects]);
    setCurrentView('entry');
  };

  // Handle class change in entry form
  const handleFormClassChange = (newCls: ClassLevel) => {
    setFormClass(newCls);
    const firstInClass = validStudents.find(s => s.className === newCls);
    setFormStudentId(firstInClass ? firstInClass.id : '');
    setStudentSearchInput(firstInClass ? `${firstInClass.name} (Roll ${firstInClass.rollNo})` : '');

    // Reset default subjects for this class level
    const defaults = getDefaultSubjectsForClass(newCls);
    setFormSubjects(
      defaults.map(d => ({
        subject: d.subject,
        totalMarks: d.totalMarks,
        obtainedMarks: 0,
        grade: 'F',
        remarks: ''
      }))
    );
  };

  // Calculate Grade from percentage
  const calculateGrade = (pct: number): string => {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
  };

  // Update marks for a subject
  const updateSubjectMarks = (index: number, obtained: number, total?: number) => {
    setFormSubjects(prev => {
      const copy = [...prev];
      const sub = { ...copy[index] };
      if (total !== undefined) sub.totalMarks = Math.max(1, total);
      sub.obtainedMarks = Math.max(0, Math.min(sub.totalMarks, obtained));
      const pct = Math.round((sub.obtainedMarks / sub.totalMarks) * 100);
      sub.grade = calculateGrade(pct);
      sub.remarks = pct >= 80 ? 'Very Good' : pct >= 50 ? 'Satisfactory' : 'Needs Practice';
      copy[index] = sub;
      return copy;
    });
  };

  // Add custom book/subject
  const handleAddCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    const cleanName = newSubjectName.trim();
    const cleanTotal = Number(newSubjectTotal) || 100;
    setFormSubjects(prev => [
      ...prev,
      {
        subject: cleanName,
        totalMarks: cleanTotal,
        obtainedMarks: Math.round(cleanTotal * 0.7),
        grade: 'B',
        remarks: 'Good'
      }
    ]);
    setNewSubjectName('');
    setNewSubjectTotal(100);
  };

  // Remove subject
  const handleRemoveSubject = (index: number) => {
    if (formSubjects.length <= 1) {
      alert('کم از کم ایک مضمون (کتاب) لازمی ہونا چاہیے۔');
      return;
    }
    setFormSubjects(prev => prev.filter((_, i) => i !== index));
  };

  // Live Calculations
  const calculatedGrandTotal = useMemo(() => {
    return formSubjects.reduce((sum, s) => sum + s.totalMarks, 0);
  }, [formSubjects]);

  const calculatedTotalObtained = useMemo(() => {
    return formSubjects.reduce((sum, s) => sum + s.obtainedMarks, 0);
  }, [formSubjects]);

  const calculatedPercentage = useMemo(() => {
    if (calculatedGrandTotal === 0) return 0;
    return Math.round((calculatedTotalObtained / calculatedGrandTotal) * 1000) / 10;
  }, [calculatedGrandTotal, calculatedTotalObtained]);

  const calculatedGrade = useMemo(() => {
    return calculateGrade(calculatedPercentage);
  }, [calculatedPercentage]);

  const calculatedStatus = useMemo<'Pass' | 'Fail'>(() => {
    return calculatedPercentage >= 40 ? 'Pass' : 'Fail';
  }, [calculatedPercentage]);

  // Save report
  const handleSaveReport = (publishImmediate: boolean) => {
    if (!selectedStudent) {
      alert('براہ کرم طالب علم کا انتخاب کریں!');
      return;
    }
    if (formSubjects.length === 0) {
      alert('براہ کرم کم از کم ایک مضمون (کتاب) کے نمبرات درج کریں!');
      return;
    }

    const report: StudentExamReport = {
      id: editingReportId || `exam-${Date.now()}-${selectedStudent.id}`,
      examTitle: formExamTitle.trim() || 'Term Examination 2026',
      examDate: formExamDate,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      fatherName: selectedStudent.fatherName,
      className: selectedStudent.className,
      rollNo: selectedStudent.rollNo,
      admissionNo: selectedStudent.admissionNo,
      subjects: formSubjects,
      grandTotal: calculatedGrandTotal,
      totalObtained: calculatedTotalObtained,
      percentage: calculatedPercentage,
      grade: calculatedGrade,
      status: calculatedStatus,
      generalRemarks: formRemarks.trim() || 'Good performance and ethical tarbiyat.',
      isPublished: publishImmediate,
      updatedAt: new Date().toISOString(),
      enteredByRole: role === 'admin' ? 'Admin' : 'Teacher',
      enteredByName: teacherName
    };

    saveStudentExamReport(report);

    const msg = publishImmediate
      ? `امتحانی نتیجہ کامیابی سے محفوظ ہو گیا اور پیرنٹ پورٹل پر شائع ہو گیا ہے!\nطالب علم: ${selectedStudent.name} (${selectedStudent.className})\nکل نمبر: ${calculatedTotalObtained} / ${calculatedGrandTotal} (${calculatedPercentage}%) • گریڈ: ${calculatedGrade}`
      : `امتحانی نتیجہ بطور ڈرافٹ محفوظ ہو گیا ہے! والدین کو صرف اس وقت نظر آئے گا جب آپ شائع (Publish) کریں گے۔`;

    alert(msg);
    setCurrentView('list');
    setSelectedExamCard(report); // Open result card preview immediately
  };

  // Image & Print Download State
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleDownloadImage = async (format: 'png' | 'jpg' = 'png') => {
    if (!selectedExamCard) return;
    setIsExporting(true);
    const success = await downloadResultCardAsImage(
      'printable-result-card-element',
      selectedExamCard.studentName,
      selectedExamCard.examTitle,
      format
    );
    setIsExporting(false);
    if (!success) {
      alert('تصویر تیار نہیں ہو سکی۔ براہ کرم پرنٹ بٹن کا استعمال کریں۔');
    }
  };

  const handlePrint = () => {
    if (!selectedExamCard) return;
    printResultCard('printable-result-card-element');
  };

  const handleShareWhatsApp = () => {
    if (!selectedExamCard) return;
    const msg = `*BRIGHT SCHOLAR SCHOOL* - امتحانی نتیجہ کارڈ\n“پہلے تربیت، پھر تعلیم”\n\nطالب علم: *${selectedExamCard.studentName}*\nولدیت: *${selectedExamCard.fatherName}*\nکلاس: *${selectedExamCard.className}* | رول نمبر: *${selectedExamCard.rollNo}*\nامتحان: *${selectedExamCard.examTitle}*\n\nکل نمبرات: *${selectedExamCard.totalObtained} / ${selectedExamCard.grandTotal}*\nفیصد: *${selectedExamCard.percentage}%*\nگریڈ: *${selectedExamCard.grade}* (${selectedExamCard.status})\n\nمکمل نتیجہ کارڈ پیرنٹ پورٹل پر دیکھا اور ڈاؤن لوڈ کیا جا سکتا ہے۔\nرابطہ: 0302-5053993`;
    openWhatsApp('0302-5053993', msg);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0D285F] via-[#10337A] to-[#1E3A8A] text-white p-5 rounded-2xl shadow-md border-b-4 border-amber-400">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-300 font-bold mb-1">
              <Award className="w-4 h-4 text-amber-400" />
              <span>TESTS & RESULTS • امتحانات، کتاب وار نمبرات اور نتیجہ کارڈ</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-crest tracking-tight">
              اسکول امتحانی نتائج اور آفیشل مارک شیٹ سسٹم
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              کلاس اور طالب علم منتخب کر کے ہر کتاب کے نمبر درج کریں، فی صد اور گریڈ کا خودکار حساب، اور پرنٹ یا تصویر میں آفیشل نتیجہ کارڈ تیار کریں۔
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {currentView === 'entry' ? (
              <button
                type="button"
                onClick={() => setCurrentView('list')}
                className="bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 border border-white/20"
              >
                <FileText className="w-4 h-4" />
                <span>تمام نتائج کی فہرست (View All Results)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startNewEntry()}
                className="bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-[#07193B] font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>نیا نتیجہ درج کریں (Enter Marks)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VIEW 1: MARKS ENTRY FORM */}
      {currentView === 'entry' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#0D285F] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <span>
                  {editingReportId ? 'امتحانی نمبرات میں ترمیم کریں' : 'طالب علم کے کتاب وار نمبرات درج کریں (Marks Entry)'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                طالب علم منتخب کریں اور تمام مضامین کے کل اور حاصل کردہ نمبر درج فرمائیں۔
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentView('list')}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section A: Class & Student Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                1. کلاس منتخب کریں (Select Class):
              </label>
              <select
                value={formClass}
                onChange={(e) => handleFormClassChange(e.target.value as ClassLevel)}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0D285F] outline-none"
              >
                {availableClasses.map(cls => (
                  <option key={cls} value={cls}>
                    {cls} ({validStudents.filter(s => s.className === cls).length} طلباء)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                2. طالب علم منتخب کریں (Select Student):
              </label>
              <select
                value={formStudentId}
                onChange={(e) => {
                  setFormStudentId(e.target.value);
                  const st = validStudents.find(s => s.id === e.target.value);
                  if (st) setStudentSearchInput(`${st.name} (Roll ${st.rollNo})`);
                }}
                className="w-full text-xs font-bold px-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0D285F] outline-none text-[#0D285F]"
              >
                {classStudents.length === 0 ? (
                  <option value="">اس کلاس میں کوئی طالب علم نہیں ہے</option>
                ) : (
                  classStudents.map(st => (
                    <option key={st.id} value={st.id}>
                      Roll {st.rollNo} — {st.name} s/d/o {st.fatherName}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                امتحان کا نام اور تاریخ (Exam Title & Date):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formExamTitle}
                  onChange={(e) => setFormExamTitle(e.target.value)}
                  placeholder="e.g. First Term 2026"
                  className="w-full text-xs px-2.5 py-2 bg-white border border-slate-300 rounded-xl outline-none font-semibold"
                />
                <input
                  type="date"
                  value={formExamDate}
                  onChange={(e) => setFormExamDate(e.target.value)}
                  className="w-full text-xs px-2 py-2 bg-white border border-slate-300 rounded-xl outline-none"
                />
              </div>
            </div>
          </div>

          {/* Student Profile Card Header */}
          {selectedStudent && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0D285F] text-amber-300 font-bold flex items-center justify-center text-sm shadow">
                  {selectedStudent.rollNo}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#0D285F]">
                    {selectedStudent.name} ولد/بنت {selectedStudent.fatherName}
                  </h4>
                  <p className="text-slate-600">
                    کلاس: <strong>{selectedStudent.className}</strong> | داخلہ نمبر: {selectedStudent.admissionNo} | پتہ: {selectedStudent.address}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">ماہانہ فیس</span>
                <span className="font-bold text-emerald-800 text-sm">Rs. {selectedStudent.monthlyFee.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Section B: Book-wise Marks Entry Table */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <span>کتاب وار نمبرات درج کریں (Book-Wise Marks Entry)</span>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {formSubjects.length} مضامین
                  </span>
                </h4>
                <p className="text-xs text-slate-500">
                  ہر کتاب کے کل نمبرات اور طالب علم کے حاصل کردہ نمبرات درج کریں:
                </p>
              </div>

              {/* Add Custom Book / Subject Form */}
              <form onSubmit={handleAddCustomSubject} className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="نیا مضمون درج کریں (e.g. Science)"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg outline-none min-w-[180px]"
                />
                <input
                  type="number"
                  placeholder="کل نمبر"
                  value={newSubjectTotal}
                  onChange={(e) => setNewSubjectTotal(Number(e.target.value))}
                  className="text-xs w-20 px-2 py-1.5 border border-slate-300 rounded-lg outline-none"
                  min={1}
                />
                <button
                  type="submit"
                  className="bg-[#0D285F] text-amber-300 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-[#10337A]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>کتاب شامل کریں</span>
                </button>
              </form>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0D285F] text-white">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">کتاب / مضمون کا نام (Subject Name)</th>
                    <th className="p-3 w-28 text-center">کل نمبر (Total)</th>
                    <th className="p-3 w-36 text-center">حاصل کردہ نمبر (Obtained)</th>
                    <th className="p-3 w-24 text-center">فیصد %</th>
                    <th className="p-3 w-20 text-center">گریڈ</th>
                    <th className="p-3 w-32">ریمارکس</th>
                    <th className="p-3 w-16 text-center">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {formSubjects.map((sub, idx) => {
                    const pct = Math.round((sub.obtainedMarks / sub.totalMarks) * 100);
                    const isFailing = pct < 40;
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={sub.subject}
                            onChange={(e) => {
                              const copy = [...formSubjects];
                              copy[idx].subject = e.target.value;
                              setFormSubjects(copy);
                            }}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded font-bold text-slate-800 text-xs"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min={1}
                            value={sub.totalMarks}
                            onChange={(e) => updateSubjectMarks(idx, sub.obtainedMarks, Number(e.target.value))}
                            className="w-20 px-2 py-1.5 border border-slate-300 rounded text-center font-bold text-xs"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={sub.totalMarks}
                            value={sub.obtainedMarks}
                            onChange={(e) => updateSubjectMarks(idx, Number(e.target.value))}
                            className={`w-24 px-2 py-1.5 border rounded text-center font-extrabold text-sm ${
                              isFailing
                                ? 'border-rose-400 bg-rose-50 text-rose-700'
                                : 'border-emerald-400 bg-emerald-50 text-emerald-800'
                            }`}
                          />
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">
                          {pct}%
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-extrabold ${
                              isFailing
                                ? 'bg-rose-100 text-rose-800'
                                : pct >= 80
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {sub.grade || calculateGrade(pct)}
                          </span>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={sub.remarks || ''}
                            onChange={(e) => {
                              const copy = [...formSubjects];
                              copy[idx].remarks = e.target.value;
                              setFormSubjects(copy);
                            }}
                            placeholder="Optional remarks"
                            className="w-full px-2 py-1 border border-slate-200 rounded text-[11px]"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(idx)}
                            className="text-slate-400 hover:text-rose-600 transition p-1"
                            title="Remove subject"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section C: Live Automatic Result Calculation Box */}
          <div className="bg-gradient-to-br from-slate-900 via-[#0D285F] to-[#1E3A8A] text-white p-5 rounded-2xl shadow-md border-b-4 border-amber-400">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider block">
                  خودکار امتحانی حسابی خلاصہ (Automatic Calculation)
                </span>
                <h4 className="text-lg font-bold text-white">
                  طالب علم کی مجموعی پوزیشن اور گریڈ
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                    calculatedStatus === 'Pass'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                      : 'bg-rose-500/20 text-rose-300 border-rose-400'
                  }`}
                >
                  نتیجہ: {calculatedStatus === 'Pass' ? 'کامیاب (PASS)' : 'توجہ طلب (FAIL)'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-white/10 p-3 rounded-xl border border-white/15">
                <span className="text-[11px] text-slate-300 block">کل نمبر (Grand Total)</span>
                <span className="text-2xl font-black text-white mt-1 block">
                  {calculatedGrandTotal}
                </span>
              </div>

              <div className="bg-white/10 p-3 rounded-xl border border-white/15">
                <span className="text-[11px] text-amber-300 block">حاصل کردہ نمبرات (Obtained)</span>
                <span className="text-2xl font-black text-amber-300 mt-1 block">
                  {calculatedTotalObtained}
                </span>
              </div>

              <div className="bg-white/10 p-3 rounded-xl border border-white/15">
                <span className="text-[11px] text-emerald-300 block">مجموعی فیصد (Percentage)</span>
                <span className="text-2xl font-black text-emerald-300 mt-1 block">
                  {calculatedPercentage}%
                </span>
              </div>

              <div className="bg-white/10 p-3 rounded-xl border border-white/15">
                <span className="text-[11px] text-amber-300 block">مجموعی گریڈ (Grade)</span>
                <span className="text-3xl font-black text-amber-400 mt-0.5 block">
                  {calculatedGrade}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/15">
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                استاد کے عمومی ریمارکس اور اخلاقی تربیت کی رائے (Teacher Remarks & Tarbiyat):
              </label>
              <input
                type="text"
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                placeholder="e.g. Excellent conduct, shows great interest in studies and moral character."
                className="w-full text-xs px-3 py-2 bg-white/15 border border-white/20 rounded-xl text-white placeholder-slate-400 outline-none focus:bg-white/25"
              />
            </div>
          </div>

          {/* Section F: Publishing & Save Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentView('list')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-xl border border-slate-300"
            >
              کینسل کریں (Cancel)
            </button>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleSaveReport(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-300 flex items-center gap-1.5 transition"
              >
                <Clock className="w-4 h-4 text-amber-600" />
                <span>ڈرافٹ محفوظ کریں (Save as Draft - Only Teachers See)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveReport(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>شائع کریں اور محفوظ کریں (Save & Publish to Parent Portal)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SAVED REPORTS LIST & MANAGEMENT */}
      {currentView === 'list' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="طالب علم کے نام، رول نمبر یا امتحان سے تلاش کریں..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0D285F]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="All">تمام کلاسیں (All Classes)</option>
                  {SCHOOL_CLASSES.map(cls => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">
                کل امتحانی ریکارڈز: <strong>{filteredReports.length}</strong>
              </span>
              <button
                type="button"
                onClick={() => startNewEntry()}
                className="bg-[#0D285F] hover:bg-[#10337A] text-amber-300 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>نیا نتیجہ بنائیں</span>
              </button>
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
              <Award className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-700">
                کوئی امتحانی نتیجہ محفوظ نہیں ہے
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                ابھی تک کسی طالب علم کا امتحانی نتیجہ درج نہیں کیا گیا۔ اوپر دیے گئے بٹن سے نیا نتیجہ درج فرمائیں!
              </p>
              <button
                type="button"
                onClick={() => startNewEntry()}
                className="bg-[#0D285F] text-amber-300 font-bold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>طالب علم کا نتیجہ درج کریں</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#0D285F] text-white">
                    <tr>
                      <th className="p-3 w-16 text-center">رول #</th>
                      <th className="p-3">طالب علم اور ولدیت</th>
                      <th className="p-3">کلاس</th>
                      <th className="p-3">امتحان کا نام</th>
                      <th className="p-3 text-center">حاصل کردہ / کل</th>
                      <th className="p-3 text-center">فیصد %</th>
                      <th className="p-3 text-center">گریڈ</th>
                      <th className="p-3 text-center">حیثیت (Status)</th>
                      <th className="p-3 text-center">پیرنٹ پورٹل پر</th>
                      <th className="p-3 text-center">ایکشن</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredReports.map(rep => {
                      return (
                        <tr key={rep.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 text-center font-bold text-[#0D285F]">
                            {rep.rollNo}
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block text-xs">
                              {rep.studentName}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ولد {rep.fatherName} • {rep.admissionNo}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-700">
                            {rep.className}
                          </td>
                          <td className="p-3 font-medium text-slate-800">
                            <span>{rep.examTitle}</span>
                            <span className="text-[10px] text-slate-400 block">{rep.examDate}</span>
                          </td>
                          <td className="p-3 text-center font-extrabold text-slate-800">
                            {rep.totalObtained} / {rep.grandTotal}
                          </td>
                          <td className="p-3 text-center font-extrabold text-slate-900">
                            {rep.percentage}%
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full font-black text-xs bg-amber-100 text-amber-900">
                              {rep.grade}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                rep.status === 'Pass'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {rep.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => togglePublishExamReport(rep.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center justify-center gap-1 mx-auto transition cursor-pointer ${
                                rep.isPublished
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              }`}
                              title={rep.isPublished ? 'Published: Click to unpublish' : 'Draft: Click to publish'}
                            >
                              {rep.isPublished ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>شائع شدہ (Live)</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3" />
                                  <span>ڈرافٹ (Draft)</span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedExamCard(rep)}
                                className="bg-[#0D285F] hover:bg-[#10337A] text-amber-300 p-1.5 rounded-lg shadow-sm"
                                title="نتیجہ کارڈ دیکھیں اور پرنٹ کریں"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => startEditReport(rep)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg"
                                title="ترمیم کریں"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`کیا آپ واقعی ${rep.studentName} کا یہ امتحانی نتیجہ ڈیلیٹ کرنا چاہتے ہیں؟`)) {
                                    deleteStudentExamReport(rep.id);
                                  }
                                }}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-lg"
                                title="حذف کریں"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: PROFESSIONAL RESULT CARD (MARKSHEET) PREVIEW, PRINT & DOWNLOAD */}
      {selectedExamCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full my-6 overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
            {/* Modal Top Control Bar */}
            <div className="bg-[#0D285F] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b-2 border-amber-400 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  آفیشل نتیجہ کارڈ مارک شیٹ (Official Marksheet)
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1 border border-white/20"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                  <span>پرنٹ کریں (Print)</span>
                </button>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleDownloadImage('png')}
                  className="bg-amber-400 hover:bg-amber-300 text-[#07193B] font-extrabold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'تصویر بن رہی ہے...' : 'تصویر ڈاؤن لوڈ (PNG)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>واٹس ایپ (WhatsApp)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedExamCard(null)}
                  className="text-slate-300 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Printable Marksheet Area */}
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100 flex-1">
              <div
                id="printable-result-card-element"
                className="bg-white rounded-2xl border-4 border-[#0D285F] shadow-lg p-6 sm:p-8 max-w-2xl mx-auto text-slate-800 space-y-6 relative"
                style={{ minHeight: '850px' }}
              >
                {/* Double Border Luxury Styling */}
                <div className="absolute inset-1.5 border border-amber-400 rounded-xl pointer-events-none"></div>

                {/* Marksheet Header */}
                <div className="text-center pb-4 border-b-2 border-[#0D285F]">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-14 h-14 rounded-2xl bg-[#0D285F] border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-md">
                      <GraduationCap className="w-8 h-8 text-amber-400" />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-black text-[#0D285F] tracking-tight uppercase font-serif-crest">
                        BRIGHT SCHOLAR SCHOOL
                      </h1>
                      <div className="text-xs font-bold text-amber-700 tracking-wider">
                        “پہلے تربیت، پھر تعلیم” • Character First, Then Education
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Chak No. 47 GB, Samundri, Faisalabad, Punjab • Ph / WhatsApp: 0302-5053993
                  </p>
                  <div className="inline-block mt-3 bg-[#0D285F] text-amber-300 font-extrabold text-xs px-6 py-1.5 rounded-full shadow tracking-wider uppercase">
                    STUDENT PROGRESS REPORT & MARKSHEET (امتحانی نتیجہ کارڈ)
                  </div>
                </div>

                {/* Bio Grid */}
                <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium block text-[10px]">طالب علم کا نام (Student Name):</span>
                    <strong className="text-sm font-extrabold text-[#0D285F]">{selectedExamCard.studentName}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block text-[10px]">ولدیت (Father's Name):</span>
                    <strong className="text-sm font-extrabold text-slate-800">{selectedExamCard.fatherName}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block text-[10px]">کلاس (Class):</span>
                    <strong className="text-xs font-bold text-[#0D285F]">{selectedExamCard.className}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block text-[10px]">رول نمبر (Roll No):</span>
                    <strong className="text-xs font-bold text-amber-700">Roll No. {selectedExamCard.rollNo}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block text-[10px]">داخلہ نمبر (Admission No):</span>
                    <span className="text-xs font-mono font-semibold">{selectedExamCard.admissionNo}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block text-[10px]">امتحان اور تاریخ (Examination & Date):</span>
                    <span className="text-xs font-bold text-slate-700">
                      {selectedExamCard.examTitle} ({selectedExamCard.examDate})
                    </span>
                  </div>
                </div>

                {/* Subjects Table */}
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#0D285F] text-white">
                      <tr>
                        <th className="p-2.5 w-10 text-center">#</th>
                        <th className="p-2.5">مضمون / کتاب (Subject Name)</th>
                        <th className="p-2.5 w-24 text-center">کل نمبر</th>
                        <th className="p-2.5 w-24 text-center">حاصل کردہ</th>
                        <th className="p-2.5 w-20 text-center">فیصد</th>
                        <th className="p-2.5 w-16 text-center">گریڈ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedExamCard.subjects.map((sub, idx) => {
                        const pct = Math.round((sub.obtainedMarks / sub.totalMarks) * 100);
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
                              <span className="font-extrabold text-amber-700">{sub.grade || calculateGrade(pct)}</span>
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
                        <td className="p-3 text-center text-slate-800">{selectedExamCard.grandTotal}</td>
                        <td className="p-3 text-center text-[#0D285F] text-base">{selectedExamCard.totalObtained}</td>
                        <td className="p-3 text-center text-emerald-800">{selectedExamCard.percentage}%</td>
                        <td className="p-3 text-center text-base text-amber-800">{selectedExamCard.grade}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Performance & Tarbiyat Summary */}
                <div className="grid grid-cols-3 gap-3 text-center bg-slate-50 p-3.5 rounded-xl border border-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-500 block">امتحانی نتیجہ (Status)</span>
                    <strong
                      className={`text-sm font-extrabold ${
                        selectedExamCard.status === 'Pass' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {selectedExamCard.status === 'Pass' ? 'کامیاب (PASSED)' : 'توجہ طلب (FAILED)'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">حاصل کردہ گریڈ (Overall Grade)</span>
                    <strong className="text-xl font-black text-amber-600">{selectedExamCard.grade}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">مجموعی فیصد (Percentage)</span>
                    <strong className="text-sm font-extrabold text-[#0D285F]">{selectedExamCard.percentage}%</strong>
                  </div>
                </div>

                {/* Remarks & Character Observation */}
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-amber-900 block text-[11px]">
                    استاد کے مشاہدات و اخلاقی تربیت (Teacher Remarks & Character Evaluation):
                  </span>
                  <p className="text-slate-700 italic">
                    "{selectedExamCard.generalRemarks || 'Shows keen commitment to moral character and academic excellence.'}"
                  </p>
                </div>

                {/* Official Signatures & Seal */}
                <div className="pt-8 flex items-end justify-between px-4 text-center">
                  <div className="w-44">
                    <div className="border-b-2 border-slate-800 pb-1 mb-1 font-serif text-slate-700 italic text-xs">
                      {selectedExamCard.enteredByName || 'Class Teacher'}
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">
                      کلاس ٹیچر دستخط (Class Teacher)
                    </span>
                  </div>

                  {/* School Seal Stamp */}
                  <div className="w-24 h-24 rounded-full border-4 border-double border-[#0D285F] p-1 flex items-center justify-center text-center">
                    <div className="text-[8px] font-bold text-[#0D285F] leading-tight">
                      ★ BRIGHT SCHOLAR ★<br />
                      OFFICIAL SEAL<br />
                      CHAK 47 GB<br />
                      SAMUNDRI
                    </div>
                  </div>

                  <div className="w-44">
                    <div className="border-b-2 border-slate-800 pb-1 mb-1 font-serif text-[#0D285F] font-bold text-xs">
                      Sir Tasawar (Principal)
                    </div>
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
