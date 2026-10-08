import React, { useState } from 'react';
import {
  GraduationCap,
  Award,
  BookOpen,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Shield,
  Search,
  Sparkles,
  ArrowRight,
  FileText,
  Users,
  Compass,
  Building,
  Heart
} from 'lucide-react';
import { useSchool, isDummyStudent } from '../context/SchoolContext';
import { SCHOOL_CLASSES, getDefaultMonthlyFee, WebsiteTab, Student } from '../types';

interface WebsiteHomeProps {
  onOpenAdmission: () => void;
  onOpenLogin: (role?: 'admin' | 'teacher' | 'parent') => void;
  onSelectStudent: (student: Student) => void;
  onTabChange: (tab: WebsiteTab) => void;
  currentTab: WebsiteTab;
}

export const WebsiteHome: React.FC<WebsiteHomeProps> = ({
  onOpenAdmission,
  onOpenLogin,
  onSelectStudent,
  onTabChange,
  currentTab
}) => {
  const { students, notices, openWhatsApp, settings } = useSchool();
  const [searchQuery, setSearchQuery] = useState('');

  const validStudents = students.filter(s => !isDummyStudent(s));

  const filteredStudents = searchQuery.trim()
    ? validStudents.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNo.includes(searchQuery) ||
        s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.className.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner Section */}
      <section className="relative bg-gradient-to-b from-[#0D285F] via-[#091D45] to-[#07193B] text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          {/* Official Crest Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 rounded-full px-4 py-1.5 mb-6 text-amber-300 text-xs sm:text-sm font-semibold shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span>Serving Quality Education Since 2017 (سنس 2017) • Admissions Open 2026-2027</span>
          </div>

          {/* School Logo */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full bg-white p-1 border-4 border-amber-400 shadow-2xl mb-5 flex items-center justify-center overflow-hidden">
            <img
              src="/school_logo.jpg"
              alt="Bright Scholar School Logo"
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight font-serif-crest uppercase text-white mb-2">
            Bright Scholar School
          </h1>

          <div className="inline-block bg-amber-400 text-[#07193B] font-extrabold text-sm sm:text-lg px-6 py-1 rounded-full shadow-md my-2">
            “Pehle Tarbiyat, Phir Taleem”
          </div>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mt-3 mb-8 leading-relaxed">
            Welcome to Bright Scholar School, Chak No. 47 GB, Samundri, Faisalabad. We combine high-standard modern academic education with moral refinement, daily Nazra Quran, and disciplined character building.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-xl mx-auto">
            <button
              onClick={onOpenAdmission}
              className="flex-1 min-w-[200px] bg-amber-400 hover:bg-amber-300 text-[#07193B] font-bold text-sm sm:text-base py-3.5 px-6 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              <span>Apply Online Admission</span>
            </button>

            <button
              onClick={() => openWhatsApp(settings.schoolWhatsApp, 'Assalam-o-Alaikum! Mujhe Bright Scholar School ke baray me maloomat chahiye.')}
              className="flex-1 min-w-[200px] bg-[#25D366] hover:bg-[#20b858] text-white font-bold text-sm sm:text-base py-3.5 px-6 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>WhatsApp: 0302-5053993</span>
            </button>
          </div>

          {/* Portal login link in hero */}
          <div className="mt-6">
            <button
              onClick={() => onOpenLogin()}
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-300 hover:text-amber-300 bg-white/10 hover:bg-white/15 px-4 py-2 rounded-lg transition border border-white/15"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Login to Management System (Admin / Teachers / Parents)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Quick Search Student Section */}
      <section className="max-w-5xl mx-auto px-4 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0D285F] uppercase tracking-wider mb-2">
            <Search className="w-4 h-4 text-amber-500" />
            <span>Search Student Profile & Academic Dossier</span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student by Name, Roll No (e.g. 01), or Admission No (e.g. BSS-101)..."
              className="w-full pl-11 pr-4 py-3.5 text-sm sm:text-base border-2 border-slate-200 rounded-xl focus:border-[#0D285F] focus:ring-2 focus:ring-[#0D285F]/20 outline-none transition"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-4 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-1 rounded"
              >
                Clear
              </button>
            )}
          </div>

          {/* Search Results Dropdown Preview */}
          {searchQuery && (
            <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-2 divide-y divide-slate-200 max-h-60 overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <div className="p-3 text-xs text-slate-500 text-center">
                  No registered student found matching "{searchQuery}".
                </div>
              ) : (
                filteredStudents.map(st => (
                  <div
                    key={st.id}
                    onClick={() => {
                      onSelectStudent(st);
                      setSearchQuery('');
                    }}
                    className="p-3 flex items-center justify-between hover:bg-white cursor-pointer rounded-lg transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0D285F] text-amber-400 font-bold flex items-center justify-center text-xs">
                        {st.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">{st.name}</div>
                        <div className="text-xs text-slate-500">
                          S/O {st.fatherName} • Class: <strong>{st.className}</strong> (Roll: {st.rollNo})
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                      View Dossier →
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="mt-2 text-[11px] text-slate-500 flex flex-wrap gap-2 items-center">
            <span>Popular Student Lookups:</span>
            {students.slice(0, 3).map(s => (
              <button
                key={s.id}
                onClick={() => onSelectStudent(s)}
                className="text-blue-700 hover:underline bg-slate-100 px-2 py-0.5 rounded text-[11px]"
              >
                {s.name} ({s.className})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Sections Based on Tab or Full Home */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section 1: About School & Tarbiyat Philosophy */}
        <section id="about" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              <Heart className="w-3.5 h-3.5" />
              <span>Our Guiding Philosophy</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0D285F] font-serif-crest tracking-tight">
              “Pehle Tarbiyat, Phir Taleem”
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              At <strong>Bright Scholar School</strong>, we firmly believe that academic success without moral integrity and good character is incomplete. Located in <strong>Chak No. 47 GB, Samundri</strong>, we impart high-quality education alongside daily character training, Islamic adab, truthfulness, and respect.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center gap-2 font-bold text-sm text-[#0D285F] mb-1">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  <span>Moral Character & Nazra</span>
                </div>
                <p className="text-xs text-slate-600">
                  Daily Nazra Quran with proper Tajweed, recitation of morning prayers, and moral lessons on ethics.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center gap-2 font-bold text-sm text-[#0D285F] mb-1">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Academic Excellence</span>
                </div>
                <p className="text-xs text-slate-600">
                  Modern curriculum in Science, Mathematics, English phonics, and Urdu with regular tests and exams.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenAdmission}
                className="bg-[#0D285F] hover:bg-[#07193B] text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow transition"
              >
                Enroll Your Child for Tarbiyat
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-br from-[#0D285F] to-[#07193B] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border-2 border-amber-400">
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-400 text-[#07193B] flex items-center justify-center font-bold">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white font-serif-crest">
                Campus at Chak 47 GB
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Dedicated learning environment specifically constructed for the holistic development of students in Samundri tehsil.
              </p>

              <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>CCTV Camera Survived Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Experienced & Dedicated Teachers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Strict Attendance & Punctuality System</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Real-time Parent Communication Portal</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Classes Offered & Curriculum */}
        <section id="classes" className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0D285F] font-serif-crest">
              Classes Offered (Play Group to Middle)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Every class follows a tailored curriculum with focused attention on foundational reading, phonics, mathematics, and character manners.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SCHOOL_CLASSES.map((cls, idx) => {
              const fee = getDefaultMonthlyFee(cls);
              const isPrimary = idx < 7;
              return (
                <div
                  key={cls}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition hover:border-[#0D285F] group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-7 h-7 rounded-full bg-slate-100 text-[#0D285F] font-bold text-xs flex items-center justify-center group-hover:bg-[#0D285F] group-hover:text-amber-400 transition">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      Rs. {fee.toLocaleString()} / mo
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mb-1">{cls}</h3>
                  <p className="text-xs text-slate-500 mb-3">
                    {isPrimary ? 'Early Years & Primary Foundation' : 'Middle School Examination Prep'}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Monthly Fee:</span>
                    <span className="font-extrabold text-[#0D285F]">Rs. {fee}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: Official Fee Structure & Absence Fine Policy */}
        <section id="fee" className="bg-slate-100 rounded-3xl p-6 sm:p-10 border border-slate-200 space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D285F] uppercase tracking-wider mb-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Transparent & Affordable Education</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0D285F] font-serif-crest">
              Official Fee Structure & Rules
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Clear, transparent monthly tuition fees for all residents of Chak No. 47 GB and surrounding villages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Tier */}
            <div className="bg-white border-2 border-blue-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full uppercase tracking-wider">
                  Junior Wing
                </span>
                <span className="text-xs text-slate-400 font-medium">Standard Tuition</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Play Group to Class 4</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Play Group, Nursery, Prep, Class 1, Class 2, Class 3, Class 4
              </p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-extrabold text-[#0D285F]">Rs. 2,000</span>
                <span className="text-xs text-slate-500">/ per month</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 border-t pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Includes Nazra Quran & English Phonics instruction</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Activity-based Early Childhood Learning</span>
                </li>
              </ul>
            </div>

            {/* Middle Tier */}
            <div className="bg-white border-2 border-amber-300 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full uppercase tracking-wider">
                  Senior & Middle Wing
                </span>
                <span className="text-xs text-slate-400 font-medium">Advanced Curriculum</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Class 5 to Class 8 / Middle</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Class 5, Class 6, Class 7, Class 8 / Middle
              </p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-extrabold text-[#B8860B]">Rs. 3,000</span>
                <span className="text-xs text-slate-500">/ per month</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 border-t pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Mathematics, Science, Computer Studies & English</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Board preparation & regular weekly assessments</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Absence Fine Rule Card */}
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 sm:p-6 text-red-950">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-base text-red-900">
                  School Punctuality & Absence Fine Regulation (Rs. 30 per day)
                </h4>
                <p className="text-xs sm:text-sm text-red-800 leading-relaxed">
                  Har unapproved chuti (unauthorized absence) ka fine <strong>Rs. {settings.finePerAbsentDay} per day</strong> hai. Yeh fine bachon ki pabandi, waqt ki qadar, aur mustaqil mizaji qaim rakhne ke liye nafiz kia gaya hai.
                </p>
                <div className="pt-2 text-xs text-red-900 font-semibold flex flex-wrap gap-4">
                  <span>✓ Genuine leaves can be submitted in advance on the Parent Portal</span>
                  <span>✓ Approved leaves incur Rs. 0 fine</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Facilities & Campus */}
        <section id="facilities" className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0D285F] font-serif-crest">
              Facilities & Tarbiyat Infrastructure
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Everything required for a secure, healthy, and modern educational journey.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { title: 'Airy Classrooms', desc: 'Well-lit, ventilated classrooms with comfortable desks and whiteboards.' },
              { title: 'Science & Computer', desc: 'Basic IT and practical science demonstrations for cognitive growth.' },
              { title: 'CCTV Camera Security', desc: 'Continuous camera surveillance of campus gates and halls for safety.' },
              { title: 'Islamic Ethics & Duas', desc: 'Daily assembly recitations, Hadith sharing, and manners.' },
              { title: 'Parent-Teacher Meetings', desc: 'Monthly PTMs to share individual child performance and tarbiyat.' },
              { title: 'Clean Water & Hygiene', desc: 'Filtered drinking water facilities and clean sanitary areas.' },
            ].map(f => (
              <div key={f.title} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-[#0D285F]/10 text-[#0D285F] flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">{f.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Latest Notices & Announcements */}
        <section id="notices" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-[#0D285F] font-serif-crest">
                Latest Notices & Announcements
              </h2>
              <p className="text-xs text-slate-500">Official updates from the school administration</p>
            </div>
            <button
              onClick={() => openWhatsApp(settings.schoolWhatsApp, 'Assalam-o-Alaikum! Mujhe school notices ke baare me poochna hai.')}
              className="text-xs font-bold text-[#0D285F] hover:underline flex items-center gap-1"
            >
              <span>Ask via WhatsApp</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notices.map(n => (
              <div key={n.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {n.category}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {n.date}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">{n.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{n.content}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6: Contact & Location */}
        <section id="contact" className="bg-[#07193B] text-white rounded-3xl p-6 sm:p-10 border-2 border-amber-400 space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-serif-crest">
              Contact Bright Scholar School
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              Visit our campus or get in touch for admissions, tests, and student verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <MapPin className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-white mb-1">Campus Location</h4>
              <p className="text-xs text-slate-300">Chak No. 47 GB, Samundri, Faisalabad, Punjab, Pakistan</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <Phone className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-white mb-1">Direct Phone</h4>
              <p className="text-xs text-slate-300 mb-2">Office Timings: 7:45 AM - 2:00 PM</p>
              <a href="tel:03025053993" className="text-amber-300 font-extrabold text-base hover:underline block">
                0302-5053993
              </a>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <MessageCircle className="w-8 h-8 text-[#25D366] mx-auto mb-2" />
              <h4 className="font-bold text-sm text-white mb-1">WhatsApp Helpdesk</h4>
              <p className="text-xs text-slate-300 mb-3">Instant query response & admission details</p>
              <button
                onClick={() => openWhatsApp()}
                className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
              >
                <span>Chat: 0302-5053993</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
