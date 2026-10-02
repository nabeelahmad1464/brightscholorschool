import React, { useState } from 'react';
import { Search, User, Filter, Award, DollarSign, Calendar, ArrowRight } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { SCHOOL_CLASSES, Student } from '../types';

interface StudentSearchPageProps {
  onSelectStudent: (student: Student) => void;
}

export const StudentSearchPage: React.FC<StudentSearchPageProps> = ({ onSelectStudent }) => {
  const { students, getStudentFullReport } = useSchool();
  const [query, setQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('All');

  const filtered = students.filter(s => {
    const matchClass = selectedClass === 'All' || s.className === selectedClass;
    const q = query.trim().toLowerCase();
    if (!q) return matchClass;

    const cleanNum = q.replace(/^0+/, '');
    const rollClean = s.rollNo.trim().toLowerCase();
    const rollNum = rollClean.replace(/^0+/, '');
    const matchRoll = rollClean === q || (cleanNum !== '' && rollNum === cleanNum);
    const matchQuery =
      s.name.toLowerCase().includes(q) ||
      s.fatherName.toLowerCase().includes(q) ||
      matchRoll ||
      s.admissionNo.toLowerCase().includes(q);
    return matchClass && matchQuery;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-[#0D285F] font-serif-crest mb-1">
          Student Search & 360° Academic Profile
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-6">
          Look up any enrolled student to review live attendance statistics, absence fine ledger (Rs. 50/day), fee clearance status, exam marks, and daily tarbiyat records.
        </p>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by student name, father name, Roll No (e.g. 01), or Admission ID..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0D285F] outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0D285F] outline-none bg-white font-medium"
            >
              <option value="All">All Classes</option>
              {SCHOOL_CLASSES.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Found {filtered.length} students</span>
          <span>Click any card to open complete dossier</span>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-sm">No students match your search</h3>
            <p className="text-xs text-slate-500 mt-1">Try clearing filters or search by student name.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(st => {
              const report = getStudentFullReport(st.id);
              return (
                <div
                  key={st.id}
                  onClick={() => onSelectStudent(st)}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-[#0D285F] cursor-pointer transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0D285F] text-amber-400 font-bold flex items-center justify-center text-sm">
                          {st.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#0D285F] transition">
                            {st.name}
                          </h4>
                          <p className="text-xs text-slate-500">S/O {st.fatherName}</p>
                        </div>
                      </div>
                      <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                        {st.className}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-slate-50 p-2.5 rounded-lg">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Roll No:</span>
                        <span className="font-bold text-slate-800">{st.rollNo}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Adm ID:</span>
                        <span className="font-mono text-slate-800 font-semibold">{st.admissionNo}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Attendance:</span>
                        <span className="font-bold text-blue-700">{report?.attendancePercentage || 100}%</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Absence Fine:</span>
                        <span className="font-bold text-red-600">Rs. {report?.totalFineAmount || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Fee: <strong>Rs. {st.monthlyFee}</strong>
                    </span>
                    <span className="text-blue-700 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition">
                      <span>View Dossier</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
