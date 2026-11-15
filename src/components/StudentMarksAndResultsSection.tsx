import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Cloud,
  CloudOff,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  GraduationCap,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
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
  StudentExamReport
} from '../types';
import { downloadResultCardAsImage, printResultCard } from '../utils/resultCardExport';
import {
  GRADE_CRITERIA,
  calculateGrade,
  parseMarkInput,
  calculateSubjectMetrics,
  calculateExamSummary,
  buildCleanSubjectEntries
} from '../utils/resultCalculations';

interface StudentMarksAndResultsSectionProps {
  role: 'admin' | 'teacher';
  teacherAssignedClasses?: string;
  teacherName?: string;
}

// The 6 official school books taught at Bright Scholar School
export const BRIGHT_SCHOLAR_SUBJECTS: string[] = [
  'English',
  'Urdu',
  'Islamiat',
  'Mathematics',
  'Social Studies',
  'Science'
];

export interface FormSubjectMarkEntry {
  id: string;
  subject: string;
  totalMarks: number | '';
  obtainedMarks: number | '';
  grade?: string;
  remarks?: string;
  clampedWarning?: boolean;
}

const createDefaultSubjects = (): FormSubjectMarkEntry[] =>
  BRIGHT_SCHOLAR_SUBJECTS.map((subj, idx) => ({
    id: `subj-default-${idx}-${Date.now()}`,
    subject: subj,
    totalMarks: 100,
    obtainedMarks: '',
    grade: '',
    remarks: '',
    clampedWarning: false
  }));

export const StudentMarksAndResultsSection: React.FC<StudentMarksAndResultsSectionProps> = ({
  role,
  teacherAssignedClasses,
  teacherName = 'Class Teacher'
}) => {
  const {
    students,
    studentExamReports,
    saveStudentExamReportAsync,
    deleteStudentExamReport,
    togglePublishExamReport,
    openWhatsApp,
    isOnline,
    isCloudConnected,
    isCloudSyncing,
    pendingOfflineCount,
    syncNowWithCloud
  } = useSchool();

  const [isSavingReport, setIsSavingReport] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  // Pull freshest cloud data when opening the Results section
  useEffect(() => {
    syncNowWithCloud().catch(() => {});
  }, []);

  // Filter students to real enrolled students only
  const validStudents = useMemo(() => {
    return students.filter(s => !isDummyStudent(s));
  }, [students]);

  // Keep all school classes accessible while determining smart initial default from teacher's assigned classes
  const preferredInitialClass = useMemo<ClassLevel>(() => {
    if (role === 'teacher' && teacherAssignedClasses && !teacherAssignedClasses.toLowerCase().includes('all')) {
      const assigned = teacherAssignedClasses
        .split(',')
        .map(c => c.trim().toLowerCase())
        .filter(Boolean);
      const matchedWithStudents = SCHOOL_CLASSES.find(
        cls =>
          assigned.some(a => cls.toLowerCase() === a || cls.toLowerCase().includes(a)) &&
          validStudents.some(s => s.className === cls)
      );
      if (matchedWithStudents) return matchedWithStudents;
      const firstAssigned = SCHOOL_CLASSES.find(cls =>
        assigned.some(a => cls.toLowerCase() === a || cls.toLowerCase().includes(a))
      );
      if (firstAssigned) return firstAssigned;
    }
    const firstNonEmpty = SCHOOL_CLASSES.find(cls => validStudents.some(s => s.className === cls));
    return firstNonEmpty || SCHOOL_CLASSES[0] || 'Class 5';
  }, [role, teacherAssignedClasses, validStudents]);

  // View state: 'list' | 'entry'
  const [currentView, setCurrentView] = useState<'list' | 'entry'>('list');
  const [filterClass, setFilterClass] = useState<string>('All');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [selectedExamCard, setSelectedExamCard] = useState<StudentExamReport | null>(null);

  // Marks Entry Form state
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [formClass, setFormClass] = useState<ClassLevel>(preferredInitialClass);
  const [formStudentId, setFormStudentId] = useState<string>('');
  const [formExamTitle, setFormExamTitle] = useState<string>('Term Examination 2026');
  const [formExamDate, setFormExamDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formRemarks, setFormRemarks] = useState<string>('');
  const [formSubjects, setFormSubjects] = useState<FormSubjectMarkEntry[]>(() => createDefaultSubjects());
  const [editingSubjectIndex, setEditingSubjectIndex] = useState<number | null>(null);
  const subjectNameRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // New custom subject inputs
  const [newSubjectName, setNewSubjectName] = useState<string>('');
  const [newSubjectTotal, setNewSubjectTotal] = useState<string>('100');
  const [newSubjectObtained, setNewSubjectObtained] = useState<string>('');
  const [addBookError, setAddBookError] = useState<string>('');

  // Keep selectedExamCard synced with latest store updates
  const liveSelectedExamCard = useMemo(() => {
    if (!selectedExamCard) return null;
    return studentExamReports.find(r => r.id === selectedExamCard.id) || selectedExamCard;
  }, [selectedExamCard, studentExamReports]);

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
        const matchName = (rep.studentName || '').toLowerCase().includes(q);
        const matchRoll = (rep.rollNo || '').toLowerCase().includes(q);
        const matchExam = (rep.examTitle || '').toLowerCase().includes(q);
        const matchAdm = (rep.admissionNo || '').toLowerCase().includes(q);
        if (!matchName && !matchRoll && !matchExam && !matchAdm) return false;
      }
      return true;
    });
  }, [studentExamReports, filterClass, filterSearch]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await syncNowWithCloud();
      setStatusBanner({
        type: 'success',
        text: 'امتحانی نتائج اور طلباء کا ریکارڈ لائیو سرور سے تازہ کر دیا گیا ہے۔'
      });
    } catch {
      setStatusBanner({
        type: 'warning',
        text: 'سرور سے رابطہ نہیں ہو سکا، مقامی محفوظ شدہ ڈیٹا دکھایا جا رہا ہے۔'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initialize new marks entry
  const startNewEntry = (preselectedStudent?: Student) => {
    setStatusBanner(null);
    setAddBookError('');
    setEditingReportId(null);
    setEditingSubjectIndex(null);
    const initialClass = preselectedStudent
      ? (preselectedStudent.className as ClassLevel)
      : preferredInitialClass;
    setFormClass(initialClass);
    const defaultStudent =
      preselectedStudent || validStudents.find(s => s.className === initialClass) || null;
    setFormStudentId(defaultStudent ? defaultStudent.id : '');
    setFormExamTitle('Term Examination 2026');
    setFormExamDate(new Date().toISOString().split('T')[0]);
    setFormRemarks('');
    setFormSubjects(createDefaultSubjects());
    setNewSubjectName('');
    setNewSubjectTotal('100');
    setNewSubjectObtained('');
    setCurrentView('entry');
  };

  // Start editing existing report
  const startEditReport = (report: StudentExamReport) => {
    setStatusBanner(null);
    setAddBookError('');
    setEditingReportId(report.id);
    setEditingSubjectIndex(null);
    setFormClass(report.className as ClassLevel);
    setFormStudentId(report.studentId);
    setFormExamTitle(report.examTitle);
    setFormExamDate(report.examDate);
    setFormRemarks(report.generalRemarks || '');
    setFormSubjects(
      (report.subjects || []).map((s, idx) => {
        const metrics = calculateSubjectMetrics(s.totalMarks, s.obtainedMarks);
        return {
          id: `subj-edit-${idx}-${Date.now()}`,
          subject: s.subject,
          totalMarks: s.totalMarks,
          obtainedMarks: s.obtainedMarks,
          grade: s.grade || metrics.grade,
          remarks: s.remarks || metrics.autoRemark,
          clampedWarning: false
        };
      })
    );
    setNewSubjectName('');
    setNewSubjectTotal('100');
    setNewSubjectObtained('');
    setCurrentView('entry');
  };

  // Handle class change in entry form
  const handleFormClassChange = (newCls: ClassLevel) => {
    setFormClass(newCls);
    const firstInClass = validStudents.find(s => s.className === newCls);
    setFormStudentId(firstInClass ? firstInClass.id : '');
    setEditingSubjectIndex(null);
    if (!editingReportId) {
      setFormSubjects(createDefaultSubjects());
    }
  };

  // Update subject name
  const updateSubjectName = (index: number, newName: string) => {
    setFormSubjects(prev =>
      prev.map((item, i) => (i === index ? { ...item, subject: newName } : item))
    );
  };

  // Update total & obtained marks for a subject with auto-clamping, percentage, grade & remarks
  const updateSubjectMarks = (
    index: number,
    rawObtained: string | number | '',
    rawTotal?: string | number | ''
  ) => {
    setFormSubjects(prev => {
      const copy = [...prev];
      const existing = copy[index];
      if (!existing) return prev;

      const parsedTotal = rawTotal !== undefined ? parseMarkInput(rawTotal) : existing.totalMarks;
      const parsedObtained = parseMarkInput(rawObtained);

      const metrics = calculateSubjectMetrics(parsedTotal, parsedObtained);
      const finalObtained =
        metrics.percentage !== null ? metrics.clampedObtained : parsedObtained;

      copy[index] = {
        ...existing,
        totalMarks: parsedTotal,
        obtainedMarks: finalObtained,
        grade: metrics.percentage !== null ? metrics.grade : '',
        remarks:
          metrics.percentage !== null
            ? metrics.autoRemark
            : rawTotal !== undefined && parsedObtained === ''
            ? ''
            : existing.remarks || '',
        clampedWarning: metrics.exceededTotal
      };
      return copy;
    });
  };

  // Add custom book/subject (Book Name + Total Marks + Optional Initial Obtained Marks)
  const handleAddCustomSubject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAddBookError('');

    const cleanName = newSubjectName.trim();
    if (!cleanName) {
      setAddBookError('براہ کرم کتاب / مضمون کا نام درج کریں۔');
      return;
    }

    const duplicateExists = formSubjects.some(
      s => s.subject.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicateExists) {
      setAddBookError(`"${cleanName}" پہلے سے فہرست میں موجود ہے۔ آپ اسے نیچے سے ترمیم کر سکتے ہیں۔`);
      return;
    }

    const parsedTotal = parseMarkInput(newSubjectTotal);
    const cleanTotal = typeof parsedTotal === 'number' && parsedTotal > 0 ? parsedTotal : 100;
    const parsedObtained = parseMarkInput(newSubjectObtained);
    const metrics = calculateSubjectMetrics(cleanTotal, parsedObtained);

    setFormSubjects(prev => [
      ...prev,
      {
        id: `subj-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        subject: cleanName,
        totalMarks: cleanTotal,
        obtainedMarks: metrics.percentage !== null ? metrics.clampedObtained : parsedObtained,
        grade: metrics.percentage !== null ? metrics.grade : '',
        remarks: metrics.percentage !== null ? metrics.autoRemark : '',
        clampedWarning: metrics.exceededTotal
      }
    ]);

    setNewSubjectName('');
    setNewSubjectTotal('100');
    setNewSubjectObtained('');
  };

  // Explicit Edit toggle per subject
  const handleFocusSubjectEdit = (index: number) => {
    setEditingSubjectIndex(prev => (prev === index ? null : index));
    setTimeout(() => {
      const input = subjectNameRefs.current[index];
      if (input) {
        input.focus();
        input.select();
      }
    }, 30);
  };

  // Remove subject
  const handleRemoveSubject = (index: number) => {
    if (formSubjects.length <= 1) {
      alert('کم از کم ایک کتاب (مضمون) لازمی ہونی چاہیے۔');
      return;
    }
    const targetName = formSubjects[index]?.subject || 'یہ کتاب';
    if (!confirm(`کیا آپ واقعی "${targetName}" کو اس نتیجے سے حذف کرنا چاہتے ہیں؟`)) {
      return;
    }
    setEditingSubjectIndex(null);
    setFormSubjects(prev => prev.filter((_, i) => i !== index));
  };

  // Reset subjects to 6 default Bright Scholar books
  const handleResetDefaultSubjects = () => {
    if (
      formSubjects.some(s => s.obtainedMarks !== '') &&
      !confirm('کیا آپ تمام کتب کو دوبارہ 6 بنیادی مضامین پر ری سیٹ کرنا چاہتے ہیں؟ درج کیے گئے نمبر صاف ہو جائیں گے۔')
    ) {
      return;
    }
    setEditingSubjectIndex(null);
    setFormSubjects(createDefaultSubjects());
  };

  // Live Aggregate Calculations using shared pure formula
  const examSummary = useMemo(() => {
    return calculateExamSummary(formSubjects);
  }, [formSubjects]);

  // Save & Update report permanently
  const handleSaveReport = async (publishImmediate: boolean) => {
    if (isSavingReport) return;
    setStatusBanner(null);

    if (!selectedStudent) {
      alert('براہ کرم طالب علم کا انتخاب کریں!');
      return;
    }

    const unnamedIdx = formSubjects.findIndex(s => !s.subject.trim());
    if (unnamedIdx !== -1) {
      alert(`براہ کرم قطار #${unnamedIdx + 1} میں کتاب کا نام درج کریں یا غیر ضروری قطار حذف کریں۔`);
      return;
    }

    if (formSubjects.length === 0 || examSummary.grandTotal <= 0) {
      alert('براہ کرم کم از کم ایک کتاب اور اس کے درست کل نمبرات (Total Marks > 0) درج کریں!');
      return;
    }

    if (!examSummary.hasAnyObtainedMarks) {
      alert('براہ کرم طالب علم کے حاصل کردہ نمبرات (Obtained Marks) درج کریں!');
      return;
    }

    if (examSummary.invalidTotalCount > 0) {
      alert('براہ کرم تمام شامل کردہ کتب کے کل نمبرات (1 یا اس سے زیادہ) درج کریں یا غیر ضروری کتاب حذف کریں!');
      return;
    }

    if (examSummary.blankMarksCount > 0) {
      const proceed = confirm(
        `${examSummary.blankMarksCount} کتاب/مضامین کے حاصل کردہ نمبرات خالی ہیں۔ اگر وہ کتاب شامل نہیں کرنی تو حذف کر دیں، یا خالی کو 0 شمار کر کے محفوظ کریں۔\n\nکیا آپ 0 کے ساتھ آگے بڑھنا چاہتے ہیں؟`
      );
      if (!proceed) return;
    }

    const cleanSubjects = buildCleanSubjectEntries(formSubjects);
    const finalSummary = calculateExamSummary(cleanSubjects);

    const safeEnteredBy =
      role === 'admin' || /tasawar|principal/i.test(teacherName || '')
        ? 'Class Teacher'
        : teacherName;

    const report: StudentExamReport = {
      id: editingReportId || `exam-${Date.now()}-${selectedStudent.id}`,
      examTitle: formExamTitle.trim() || 'Term Examination 2026',
      examDate: formExamDate || new Date().toISOString().split('T')[0],
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      fatherName: selectedStudent.fatherName,
      className: selectedStudent.className,
      rollNo: selectedStudent.rollNo,
      admissionNo: selectedStudent.admissionNo,
      subjects: cleanSubjects,
      grandTotal: finalSummary.grandTotal,
      totalObtained: finalSummary.totalObtained,
      percentage: finalSummary.percentage,
      grade: finalSummary.grade === '-' ? 'F' : finalSummary.grade,
      status: finalSummary.status === 'Fail' ? 'Fail' : 'Pass',
      generalRemarks: formRemarks.trim() || '',
      isPublished: publishImmediate,
      updatedAt: new Date().toISOString(),
      enteredByRole: role === 'admin' ? 'Admin' : 'Teacher',
      enteredByName: safeEnteredBy
    };

    setIsSavingReport(true);
    const syncedOnline = await saveStudentExamReportAsync(report);
    setIsSavingReport(false);

    if (syncedOnline) {
      setStatusBanner({
        type: 'success',
        text: publishImmediate
          ? `${selectedStudent.name} کا نتیجہ (${report.totalObtained}/${report.grandTotal} • ${report.percentage}% • ${report.grade}) آن لائن سرور پر محفوظ اور پیرنٹ پورٹل پر شائع ہو گیا ہے!`
          : `${selectedStudent.name} کا نتیجہ بطور ڈرافٹ آن لائن سرور پر محفوظ ہو گیا ہے۔`
      });
    } else {
      setStatusBanner({
        type: 'warning',
        text: `${selectedStudent.name} کا نتیجہ آپ کے ڈیوائس میں محفوظ کر لیا گیا ہے اور انٹرنیٹ/سرور بحال ہوتے ہی خودکار طریقے سے آن لائن سنک ہو جائے گا۔`
      });
    }

    setCurrentView('list');
    setSelectedExamCard(report);
  };

  // Image & Print Download State
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleDownloadImage = async (format: 'png' | 'jpg' = 'png') => {
    if (!liveSelectedExamCard) return;
    setIsExporting(true);
    const success = await downloadResultCardAsImage(
      'printable-result-card-element',
      liveSelectedExamCard.studentName,
      liveSelectedExamCard.examTitle,
      format
    );
    setIsExporting(false);
    if (!success) {
      alert('تصویر تیار نہیں ہو سکی۔ براہ کرم پرنٹ بٹن کا استعمال کریں۔');
    }
  };

  const handlePrint = () => {
    if (!liveSelectedExamCard) return;
    printResultCard('printable-result-card-element');
  };

  const handleShareWhatsApp = () => {
    if (!liveSelectedExamCard) return;
    const msg = `*BRIGHT SCHOLAR SCHOOL* - امتحانی نتیجہ کارڈ\n“پہلے تربیت، پھر تعلیم”\n\nطالب علم: *${liveSelectedExamCard.studentName}*\nولدیت: *${liveSelectedExamCard.fatherName}*\nکلاس: *${liveSelectedExamCard.className}* | رول نمبر: *${liveSelectedExamCard.rollNo}*\nامتحان: *${liveSelectedExamCard.examTitle}*\n\nکل نمبرات: *${liveSelectedExamCard.totalObtained} / ${liveSelectedExamCard.grandTotal}*\nفیصد: *${liveSelectedExamCard.percentage}%*\nگریڈ: *${liveSelectedExamCard.grade}* (${liveSelectedExamCard.status})\n\nمکمل نتیجہ کارڈ پیرنٹ پورٹل پر دیکھا اور ڈاؤن لوڈ کیا جا سکتا ہے۔\nرابطہ: 0302-5053993`;
    openWhatsApp('0302-5053993', msg);
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0D285F] via-[#10337A] to-[#1E3A8A] text-white p-4 sm:p-5 rounded-2xl shadow-md border-b-4 border-amber-400">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-300 font-bold mb-1 flex-wrap">
              <Award className="w-4 h-4 text-amber-400" />
              <span>TESTS & RESULTS • امتحانات، کتاب وار نمبرات اور نتیجہ کارڈ</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isOnline && isCloudConnected
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                    : 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
                }`}
              >
                {isOnline && isCloudConnected ? (
                  <>
                    <Cloud className="w-3 h-3" />
                    <span>{isCloudSyncing ? 'سنک ہو رہا ہے...' : 'آن لائن سنک فعال'}</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-3 h-3" />
                    <span>آف لائن موڈ ({pendingOfflineCount} قطار میں)</span>
                  </>
                )}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold font-serif-crest tracking-tight">
              اسکول امتحانی نتائج اور آفیشل مارک شیٹ سسٹم
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              کلاس اور طالب علم منتخب کر کے ہر کتاب کے کل و حاصل کردہ نمبر درج کریں، نئی کتاب شامل/ترمیم/حذف کریں، اور فوری نتیجہ کارڈ شائع کریں۔
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3 py-2.5 rounded-xl transition flex items-center gap-1.5 border border-white/20 cursor-pointer"
              title="آن لائن سرور سے تازہ ترین نتائج حاصل کریں"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>تازہ کریں</span>
            </button>

            {currentView === 'entry' ? (
              <button
                type="button"
                onClick={() => setCurrentView('list')}
                className="bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 border border-white/20 cursor-pointer"
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

      {/* Sync / Save Feedback Banner */}
      {statusBanner && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : statusBanner.type === 'warning'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            )}
            <span>{statusBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="p-1 text-slate-500 hover:text-slate-800"
            aria-label="Close notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* VIEW 1: MARKS ENTRY FORM */}
      {currentView === 'entry' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#0D285F] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <span>
                  {editingReportId
                    ? 'امتحانی نمبرات میں ترمیم کریں (Edit Result)'
                    : 'طالب علم کے کتاب وار نمبرات درج کریں (Marks Entry)'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                طالب علم منتخب کریں، کتاب کا نام و کل نمبر سیٹ کریں، اور حاصل کردہ نمبرات درج فرمائیں۔
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentView('list')}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              aria-label="Close form"
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
                className="w-full text-xs sm:text-sm font-semibold px-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0D285F] outline-none"
              >
                {SCHOOL_CLASSES.map(cls => (
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
                onChange={(e) => setFormStudentId(e.target.value)}
                className="w-full text-xs sm:text-sm font-bold px-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0D285F] outline-none text-[#0D285F]"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formExamTitle}
                  onChange={(e) => setFormExamTitle(e.target.value)}
                  placeholder="e.g. First Term 2026"
                  className="w-full text-xs px-3 py-2.5 bg-white border border-slate-300 rounded-xl outline-none font-semibold"
                />
                <input
                  type="date"
                  value={formExamDate}
                  onChange={(e) => setFormExamDate(e.target.value)}
                  className="w-full text-xs px-2.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none"
                />
              </div>
            </div>
          </div>

          {/* Student Profile Card Header */}
          {selectedStudent && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0D285F] text-amber-300 font-bold flex items-center justify-center text-sm shadow flex-shrink-0">
                  {selectedStudent.rollNo}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#0D285F]">
                    {selectedStudent.name} ولد/بنت {selectedStudent.fatherName}
                  </h4>
                  <p className="text-slate-600">
                    کلاس: <strong>{selectedStudent.className}</strong> | داخلہ نمبر: {selectedStudent.admissionNo}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">رول نمبر (Roll No)</span>
                <span className="font-black text-[#0D285F] text-sm">#{selectedStudent.rollNo}</span>
              </div>
            </div>
          )}

          {/* Section B: Add Book / Subject Panel + Books Marks Entry */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 flex-wrap">
                  <span>کتاب وار نمبرات درج کریں (Book-Wise Marks Entry)</span>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {formSubjects.length} کتب / مضامین
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  ہر کتاب کا نام اور کل نمبر خود سیٹ یا ترمیم کریں، اور طالب علم کے حاصل کردہ نمبر درج کریں۔
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetDefaultSubjects}
                className="text-xs font-bold text-slate-600 hover:text-[#0D285F] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>6 بنیادی کتب بحال کریں</span>
              </button>
            </div>

            {/* Responsive Add Custom Book / Subject Bar */}
            <form
              onSubmit={handleAddCustomSubject}
              className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 sm:p-4 space-y-2.5"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-extrabold text-[#0D285F] flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-amber-600" />
                  <span>نئی کتاب / مضمون شامل کریں (Add New Book / Subject)</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  کتاب کا نام، کل نمبر اور (اختیاری) حاصل کردہ نمبر لکھ کر بٹن دبائیں
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    کتاب / مضمون کا نام (Book Name) *
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً: Computer Science, Nazra, Drawing..."
                    value={newSubjectName}
                    onChange={(e) => {
                      setNewSubjectName(e.target.value);
                      if (addBookError) setAddBookError('');
                    }}
                    className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0D285F] font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:col-span-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      کل نمبر (Total)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="100"
                      value={newSubjectTotal}
                      onChange={(e) => setNewSubjectTotal(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0D285F] font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      حاصل کردہ (اختیاری)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="نمبرات"
                      value={newSubjectObtained}
                      onChange={(e) => setNewSubjectObtained(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0D285F] font-bold text-center"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3 flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-[#0D285F] hover:bg-[#10337A] text-amber-300 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow transition cursor-pointer min-h-[42px]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>کتاب شامل کریں (Add Book)</span>
                  </button>
                </div>
              </div>

              {addBookError && (
                <p className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{addBookError}</span>
                </p>
              )}
            </form>

            {/* MOBILE BOOK CARDS VIEW (< md) */}
            <div className="md:hidden space-y-3">
              {formSubjects.map((sub, idx) => {
                const metrics = calculateSubjectMetrics(sub.totalMarks, sub.obtainedMarks);
                const isFailing = metrics.percentage !== null && metrics.percentage < 40;
                const isEditingName = editingSubjectIndex === idx;
                return (
                  <div
                    key={sub.id}
                    className="bg-white border-2 border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          کتاب #{idx + 1} (Book Name)
                        </span>
                        <input
                          ref={el => {
                            subjectNameRefs.current[idx] = el;
                          }}
                          type="text"
                          value={sub.subject}
                          onChange={(e) => updateSubjectName(idx, e.target.value)}
                          placeholder="کتاب کا نام درج کریں"
                          className={`w-full px-3 py-2 border rounded-xl font-bold text-sm outline-none ${
                            isEditingName
                              ? 'border-[#0D285F] ring-2 ring-[#0D285F]/20 bg-blue-50/40'
                              : 'border-slate-300 bg-slate-50 text-slate-900'
                          }`}
                        />
                      </div>

                      <div className="flex items-center gap-1 pt-4">
                        <button
                          type="button"
                          onClick={() => handleFocusSubjectEdit(idx)}
                          className={`p-2 rounded-xl border transition cursor-pointer ${
                            isEditingName
                              ? 'bg-[#0D285F] text-amber-300 border-[#0D285F]'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                          title="کتاب میں ترمیم کریں"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(idx)}
                          className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                          title="کتاب حذف کریں"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          کل نمبر (Total Marks)
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={sub.totalMarks}
                          placeholder="100"
                          onChange={(e) => updateSubjectMarks(idx, sub.obtainedMarks, e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-center font-bold text-sm bg-white outline-none focus:ring-2 focus:ring-[#0D285F]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          حاصل کردہ (Obtained)
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={sub.obtainedMarks}
                          placeholder="نمبرات"
                          onChange={(e) => updateSubjectMarks(idx, e.target.value)}
                          className={`w-full px-3 py-2.5 border rounded-xl text-center font-extrabold text-sm outline-none focus:ring-2 focus:ring-[#0D285F] ${
                            sub.obtainedMarks === ''
                              ? 'border-slate-300 bg-white text-slate-700'
                              : isFailing
                              ? 'border-rose-400 bg-rose-50 text-rose-700'
                              : 'border-emerald-400 bg-emerald-50 text-emerald-800'
                          }`}
                        />
                      </div>
                    </div>

                    {sub.clampedWarning && (
                      <p className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
                        حاصل کردہ نمبرات کل نمبرات سے زیادہ نہیں ہو سکتے — خودکار درست کر دیے گئے ہیں۔
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-600">
                          فیصد: <strong className="text-[#0D285F]">{metrics.percentage !== null ? `${metrics.percentage}%` : '-'}</strong>
                        </span>
                        {metrics.percentage !== null && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                              isFailing
                                ? 'bg-rose-100 text-rose-800'
                                : metrics.percentage >= 80
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {sub.grade || metrics.grade} ({metrics.status})
                          </span>
                        )}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={sub.remarks || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormSubjects(prev =>
                          prev.map((item, i) => (i === idx ? { ...item, remarks: val } : item))
                        );
                      }}
                      placeholder="مضمون کے بارے میں ریمارکس (اختیاری)"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 outline-none focus:bg-white"
                    />
                  </div>
                );
              })}
            </div>

            {/* DESKTOP BOOK TABLE VIEW (>= md) */}
            <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0D285F] text-white">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">کتاب / مضمون کا نام (Subject / Book Name)</th>
                    <th className="p-3 w-28 text-center">کل نمبر (Total)</th>
                    <th className="p-3 w-36 text-center">حاصل کردہ نمبر (Obtained)</th>
                    <th className="p-3 w-24 text-center">فیصد %</th>
                    <th className="p-3 w-20 text-center">گریڈ</th>
                    <th className="p-3 w-36">ریمارکس</th>
                    <th className="p-3 w-24 text-center">ترمیم / حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {formSubjects.map((sub, idx) => {
                    const metrics = calculateSubjectMetrics(sub.totalMarks, sub.obtainedMarks);
                    const isFailing = metrics.percentage !== null && metrics.percentage < 40;
                    const isEditingName = editingSubjectIndex === idx;
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                        <td className="p-3">
                          <input
                            ref={el => {
                              subjectNameRefs.current[idx] = el;
                            }}
                            type="text"
                            value={sub.subject}
                            onChange={(e) => updateSubjectName(idx, e.target.value)}
                            placeholder="کتاب کا نام"
                            className={`w-full px-2.5 py-1.5 border rounded-lg font-bold text-xs outline-none ${
                              isEditingName
                                ? 'border-[#0D285F] ring-2 ring-[#0D285F]/20 bg-blue-50/40 text-[#0D285F]'
                                : 'border-slate-300 bg-white text-slate-800 focus:border-[#0D285F]'
                            }`}
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={sub.totalMarks}
                            placeholder="100"
                            onChange={(e) =>
                              updateSubjectMarks(idx, sub.obtainedMarks, e.target.value)
                            }
                            className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-xs bg-white outline-none focus:ring-2 focus:ring-[#0D285F]"
                            title="کل نمبر درج یا تبدیل کریں"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={sub.obtainedMarks}
                            placeholder="نمبرات"
                            onChange={(e) => updateSubjectMarks(idx, e.target.value)}
                            className={`w-24 px-2 py-1.5 border rounded-lg text-center font-extrabold text-sm outline-none focus:ring-2 focus:ring-[#0D285F] ${
                              sub.obtainedMarks === ''
                                ? 'border-slate-300 bg-white text-slate-700'
                                : isFailing
                                ? 'border-rose-400 bg-rose-50 text-rose-700'
                                : 'border-emerald-400 bg-emerald-50 text-emerald-800'
                            }`}
                          />
                          {sub.clampedWarning && (
                            <span className="block text-[10px] font-bold text-amber-700 mt-0.5">
                              کل نمبر تک محدود کیا گیا
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">
                          {metrics.percentage !== null ? `${metrics.percentage}%` : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {metrics.percentage !== null ? (
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-extrabold ${
                                isFailing
                                  ? 'bg-rose-100 text-rose-800'
                                  : metrics.percentage >= 80
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {sub.grade || metrics.grade}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={sub.remarks || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormSubjects(prev =>
                                prev.map((item, i) => (i === idx ? { ...item, remarks: val } : item))
                              );
                            }}
                            placeholder="اختیاری رائے"
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] outline-none focus:border-[#0D285F]"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleFocusSubjectEdit(idx)}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                isEditingName
                                  ? 'bg-[#0D285F] text-amber-300'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-[#0D285F]'
                              }`}
                              title="کتاب کا نام ترمیم کریں"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubject(idx)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                              title="کتاب حذف کریں"
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

            {/* Grading Criteria Legend */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="font-extrabold text-[#0D285F]">گریڈنگ فارمولا (Grading Scale):</span>
              {GRADE_CRITERIA.map(rule => (
                <span
                  key={rule.grade}
                  className={`px-2 py-0.5 rounded-md font-bold border ${
                    rule.status === 'Fail'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {rule.grade}: {rule.grade === 'F' ? '< 40%' : `${rule.minPercentage}%+`}
                </span>
              ))}
            </div>
          </div>

          {/* Section C: Live Automatic Result Calculation Box */}
          <div className="bg-gradient-to-br from-slate-900 via-[#0D285F] to-[#1E3A8A] text-white p-4 sm:p-5 rounded-2xl shadow-md border-b-4 border-amber-400">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider block">
                  خودکار امتحانی حسابی خلاصہ (Automatic Calculation)
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white">
                  طالب علم کی مجموعی پوزیشن، فیصد اور گریڈ
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                    examSummary.status === 'Pass'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                      : examSummary.status === 'Fail'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-400'
                      : 'bg-slate-500/20 text-slate-300 border-slate-400'
                  }`}
                >
                  نتیجہ:{' '}
                  {examSummary.status === 'Pending'
                    ? 'نمبرات درج کریں (Pending)'
                    : examSummary.status === 'Pass'
                    ? 'کامیاب (PASS)'
                    : 'توجہ طلب (FAIL)'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
              <div className="bg-white/10 p-3 rounded-xl border border-white/15">
                <span className="text-[11px] text-slate-300 block">کل نمبر (Grand Total)</span>
                <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
                  {examSummary.grandTotal > 0 ? examSummary.grandTotal : '-'}
                </span>
              </div>

              <div className="bg-white/10 p-3 rounded-xl border border-white/15">
                <span className="text-[11px] text-amber-300 block">حاصل کردہ نمبرات (Obtained)</span>
                <span className="text-xl sm:text-2xl font-black text-amber-300 mt-1 block">
                  {examSummary.hasAnyObtainedMarks ? examSummary.totalObtained : '-'}
                </span>
              </div>

              <div className="bg-white/10 p-3 rounded-xl border border-white/15">
                <span className="text-[11px] text-emerald-300 block">مجموعی فیصد (Percentage)</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-300 mt-1 block">
                  {examSummary.hasAnyObtainedMarks && examSummary.grandTotal > 0
                    ? `${examSummary.percentage}%`
                    : '-'}
                </span>
              </div>

              <div className="bg-white/10 p-3 rounded-xl border border-white/15">
                <span className="text-[11px] text-amber-300 block">مجموعی گریڈ (Grade)</span>
                <span className="text-2xl sm:text-3xl font-black text-amber-400 mt-0.5 block">
                  {examSummary.grade}
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
                className="w-full text-xs px-3 py-2.5 bg-white/15 border border-white/20 rounded-xl text-white placeholder-slate-400 outline-none focus:bg-white/25"
              />
            </div>
          </div>

          {/* Section F: Publishing & Save Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentView('list')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-xl border border-slate-300 cursor-pointer"
            >
              کینسل کریں (Cancel)
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                disabled={isSavingReport}
                onClick={() => handleSaveReport(false)}
                className="bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Clock className="w-4 h-4 text-amber-600" />
                <span>
                  {isSavingReport ? 'محفوظ ہو رہا ہے...' : 'ڈرافٹ محفوظ کریں (Save as Draft)'}
                </span>
              </button>

              <button
                type="button"
                disabled={isSavingReport}
                onClick={() => handleSaveReport(true)}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSavingReport
                    ? 'سرور پر محفوظ ہو رہا ہے...'
                    : editingReportId
                    ? 'نتیجہ اپ ڈیٹ و شائع کریں (Update & Publish)'
                    : 'شائع کریں اور محفوظ کریں (Save & Publish to Parent Portal)'}
                </span>
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
            <div className="flex items-center gap-2 flex-wrap flex-1 w-full sm:w-auto">
              <div className="relative flex-1 min-w-[200px]">
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

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs font-bold text-slate-600">
                کل امتحانی ریکارڈز: <strong>{filteredReports.length}</strong>
              </span>
              <button
                type="button"
                onClick={() => startNewEntry()}
                className="bg-[#0D285F] hover:bg-[#10337A] text-amber-300 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>نیا نتیجہ بنائیں</span>
              </button>
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="bg-white p-10 sm:p-12 text-center rounded-2xl border border-slate-200 space-y-3">
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
                className="bg-[#0D285F] text-amber-300 font-bold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>طالب علم کا نتیجہ درج کریں</span>
              </button>
            </div>
          ) : (
            <>
              {/* MOBILE CARDS VIEW (< md) */}
              <div className="md:hidden space-y-3">
                {filteredReports.map(rep => (
                  <div
                    key={rep.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-[#0D285F] text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                            Roll #{rep.rollNo}
                          </span>
                          <span className="text-[11px] font-bold text-slate-600">
                            {rep.className}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-900 mt-1">
                          {rep.studentName}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          ولد {rep.fatherName} • {rep.examTitle} ({rep.examDate})
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                          rep.status === 'Pass'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rep.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">حاصل / کل</span>
                        <strong className="font-black text-[#0D285F]">
                          {rep.totalObtained} / {rep.grandTotal}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">فیصد %</span>
                        <strong className="font-black text-emerald-700">{rep.percentage}%</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">گریڈ</span>
                        <strong className="font-black text-amber-700">{rep.grade}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => togglePublishExamReport(rep.id)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition cursor-pointer ${
                          rep.isPublished
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {rep.isPublished ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>شائع شدہ (Live)</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            <span>ڈرافٹ (Draft)</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedExamCard(rep)}
                          className="bg-[#0D285F] text-amber-300 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>کارڈ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditReport(rep)}
                          className="bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>ترمیم</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                `کیا آپ واقعی ${rep.studentName} کا یہ امتحانی نتیجہ ڈیلیٹ کرنا چاہتے ہیں؟`
                              )
                            ) {
                              deleteStudentExamReport(rep.id);
                            }
                          }}
                          className="bg-rose-50 text-rose-600 p-1.5 rounded-xl cursor-pointer"
                          aria-label="Delete result"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE VIEW (>= md) */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
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
                            <td className="p-3 font-semibold text-slate-700">{rep.className}</td>
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
                                title={
                                  rep.isPublished
                                    ? 'Published: Click to unpublish'
                                    : 'Draft: Click to publish'
                                }
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
                                  className="bg-[#0D285F] hover:bg-[#10337A] text-amber-300 p-1.5 rounded-lg shadow-sm cursor-pointer"
                                  title="نتیجہ کارڈ دیکھیں اور پرنٹ کریں"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startEditReport(rep)}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg cursor-pointer"
                                  title="ترمیم کریں"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `کیا آپ واقعی ${rep.studentName} کا یہ امتحانی نتیجہ ڈیلیٹ کرنا چاہتے ہیں؟`
                                      )
                                    ) {
                                      deleteStudentExamReport(rep.id);
                                    }
                                  }}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-lg cursor-pointer"
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
            </>
          )}
        </div>
      )}

      {/* MODAL: PROFESSIONAL RESULT CARD (MARKSHEET) PREVIEW, PRINT & DOWNLOAD */}
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
                  onClick={handlePrint}
                  className="bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1 border border-white/20 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                  <span>پرنٹ</span>
                </button>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleDownloadImage('png')}
                  className="bg-amber-400 hover:bg-amber-300 text-[#07193B] font-extrabold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'تصویر...' : 'تصویر (PNG)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>واٹس ایپ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedExamCard(null)}
                  className="text-slate-300 hover:text-white p-1 rounded-lg cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Printable Marksheet Area */}
            <div className="p-3 sm:p-6 overflow-y-auto bg-slate-100 flex-1">
              <div
                id="printable-result-card-element"
                className="bg-white rounded-2xl border-4 border-[#0D285F] shadow-lg p-4 sm:p-8 max-w-2xl mx-auto text-slate-800 space-y-5 relative"
              >
                {/* Double Border Luxury Styling */}
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
                    <span className="text-slate-500 font-medium block text-[10px]">
                      طالب علم کا نام (Student Name):
                    </span>
                    <strong className="text-sm font-extrabold text-[#0D285F]">
                      {liveSelectedExamCard.studentName}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block text-[10px]">
                      ولدیت (Father's Name):
                    </span>
                    <strong className="text-sm font-extrabold text-slate-800">
                      {liveSelectedExamCard.fatherName}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block text-[10px]">
                      کلاس (Class):
                    </span>
                    <strong className="text-xs font-bold text-[#0D285F]">
                      {liveSelectedExamCard.className}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block text-[10px]">
                      رول نمبر (Roll No):
                    </span>
                    <strong className="text-xs font-bold text-amber-700">
                      Roll No. {liveSelectedExamCard.rollNo}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block text-[10px]">
                      داخلہ نمبر (Admission No):
                    </span>
                    <span className="text-xs font-mono font-semibold">
                      {liveSelectedExamCard.admissionNo}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block text-[10px]">
                      امتحان اور تاریخ (Examination & Date):
                    </span>
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
                            <td className="p-2.5 text-center font-semibold text-slate-600">
                              {sub.totalMarks}
                            </td>
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
                        <td
                          colSpan={2}
                          className="p-3 text-right uppercase tracking-wider text-[#0D285F]"
                        >
                          گرینڈ ٹوٹل (Grand Total):
                        </td>
                        <td className="p-3 text-center text-slate-800">
                          {liveSelectedExamCard.grandTotal}
                        </td>
                        <td className="p-3 text-center text-[#0D285F] text-base">
                          {liveSelectedExamCard.totalObtained}
                        </td>
                        <td className="p-3 text-center text-emerald-800">
                          {liveSelectedExamCard.percentage}%
                        </td>
                        <td className="p-3 text-center text-base text-amber-800">
                          {liveSelectedExamCard.grade}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Performance & Tarbiyat Summary */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-500 block">امتحانی نتیجہ (Status)</span>
                    <strong
                      className={`text-xs sm:text-sm font-extrabold ${
                        liveSelectedExamCard.status === 'Pass' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {liveSelectedExamCard.status === 'Pass'
                        ? 'کامیاب (PASSED)'
                        : 'توجہ طلب (FAILED)'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">
                      حاصل کردہ گریڈ (Overall Grade)
                    </span>
                    <strong className="text-lg sm:text-xl font-black text-amber-600">
                      {liveSelectedExamCard.grade}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">
                      مجموعی فیصد (Percentage)
                    </span>
                    <strong className="text-xs sm:text-sm font-extrabold text-[#0D285F]">
                      {liveSelectedExamCard.percentage}%
                    </strong>
                  </div>
                </div>

                {/* Remarks & Character Observation */}
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-amber-900 block text-[11px]">
                    استاد کے مشاہدات و اخلاقی تربیت (Teacher Remarks & Character Evaluation):
                  </span>
                  <p className="text-slate-700 italic">
                    "
                    {liveSelectedExamCard.generalRemarks ||
                      'Shows keen commitment to moral character and academic excellence.'}
                    "
                  </p>
                </div>

                {/* Official Signatures & Seal (NO teacher or principal personal names - only Class Teacher label & PRINCIPAL stamp) */}
                <div className="pt-6 sm:pt-8 flex flex-wrap items-end justify-between gap-4 px-2 sm:px-4 text-center">
                  <div className="w-36 sm:w-44">
                    <div className="border-b-2 border-slate-800 pb-1 mb-1 h-6"></div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">
                      کلاس ٹیچر دستخط (Class Teacher)
                    </span>
                  </div>

                  {/* School Seal Stamp */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-double border-[#0D285F] p-1 flex items-center justify-center text-center">
                    <div className="text-[7px] sm:text-[8px] font-bold text-[#0D285F] leading-tight">
                      ★ BRIGHT SCHOLAR ★
                      <br />
                      OFFICIAL SEAL
                      <br />
                      CHAK 47 GB
                      <br />
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
