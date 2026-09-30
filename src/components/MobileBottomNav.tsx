import React from 'react';
import { Home, UserPlus, Search, GraduationCap, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { WebsiteTab } from '../types';

interface MobileBottomNavProps {
  currentTab: WebsiteTab;
  onTabChange: (tab: WebsiteTab) => void;
  onOpenLogin: () => void;
  onOpenAdmission: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenLogin,
  onOpenAdmission,
}) => {
  const { currentPortal, setPortal, isAdminLoggedIn, currentTeacherId, currentParentStudentId } = useSchool();

  const isInsidePortal = currentPortal !== 'PUBLIC_WEBSITE';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07193B]/95 backdrop-blur-md border-t border-slate-700/50 shadow-2xl text-white">
      {/* If inside Admin or Teacher portal, show a quick portal header / exit button */}
      {isInsidePortal && (
        <div className="bg-amber-400 text-[#07193B] px-3 py-1 flex items-center justify-between text-[11px] font-bold">
          <div className="flex items-center gap-1.5 truncate">
            {currentPortal === 'ADMIN_PORTAL' && <span>🔐 Admin Management Portal</span>}
            {currentPortal === 'TEACHER_PORTAL' && <span>👨‍🏫 Teacher Portal</span>}
            {currentPortal === 'PARENT_PORTAL' && <span>👨‍👩‍👦 Parent Portal</span>}
          </div>
          <button
            onClick={() => setPortal('PUBLIC_WEBSITE')}
            className="bg-[#07193B] text-amber-300 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 shrink-0"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Exit to Website</span>
          </button>
        </div>
      )}

      <div className="flex items-center justify-around py-1.5 px-1">
        {/* 1: Home */}
        <button
          onClick={() => {
            setPortal('PUBLIC_WEBSITE');
            onTabChange('HOME');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition ${
            currentPortal === 'PUBLIC_WEBSITE' && currentTab === 'HOME'
              ? 'text-amber-400 font-bold scale-105'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </button>

        {/* 2: Online Admission */}
        <button
          onClick={() => {
            setPortal('PUBLIC_WEBSITE');
            onOpenAdmission();
          }}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-slate-300 hover:text-white transition"
        >
          <UserPlus className="w-5 h-5 mb-0.5 text-emerald-400" />
          <span className="text-[10px]">داخلہ</span>
        </button>

        {/* 3: Student Search / Result */}
        <button
          onClick={() => {
            setPortal('PUBLIC_WEBSITE');
            onTabChange('SEARCH');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition ${
            currentPortal === 'PUBLIC_WEBSITE' && currentTab === 'SEARCH'
              ? 'text-amber-400 font-bold scale-105'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Search className="w-5 h-5 mb-0.5 text-blue-400" />
          <span className="text-[10px]">رزلٹ/طلباء</span>
        </button>

        {/* 4: Teacher Portal */}
        <button
          onClick={() => {
            if (currentTeacherId) {
              setPortal('TEACHER_PORTAL');
            } else {
              onOpenLogin();
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition ${
            currentPortal === 'TEACHER_PORTAL'
              ? 'text-amber-400 font-bold scale-105'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <GraduationCap className="w-5 h-5 mb-0.5 text-amber-300" />
          <span className="text-[10px]">ٹیچر</span>
        </button>

        {/* 5: Admin Portal */}
        <button
          onClick={() => {
            if (isAdminLoggedIn) {
              setPortal('ADMIN_PORTAL');
            } else {
              onOpenLogin();
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition ${
            currentPortal === 'ADMIN_PORTAL'
              ? 'text-amber-400 font-bold scale-105'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-5 h-5 mb-0.5 text-amber-400" />
          <span className="text-[10px]">ایڈمن</span>
        </button>
      </div>
    </nav>
  );
};
