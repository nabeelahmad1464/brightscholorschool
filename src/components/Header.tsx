import React from 'react';
import {
  GraduationCap,
  Phone,
  MessageCircle,
  MapPin,
  Lock,
  LogOut,
  User,
  Shield,
  Search,
  Menu,
  X,
  FileText,
  Download
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { WebsiteTab, PortalType } from '../types';

interface HeaderProps {
  currentTab: WebsiteTab;
  onTabChange: (tab: WebsiteTab) => void;
  onOpenLogin: () => void;
  onOpenAdmission: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenLogin,
  onOpenAdmission
}) => {
  const {
    currentPortal,
    setPortal,
    isAdminLoggedIn,
    currentTeacherId,
    currentParentStudentId,
    teachers,
    students,
    logout,
    openWhatsApp,
    isCloudConnected,
    isCloudSyncing
  } = useSchool();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const teacher = teachers.find(t => t.id === currentTeacherId);
  const parentStudent = students.find(s => s.id === currentParentStudentId);

  const userRole = isAdminLoggedIn
    ? 'Admin'
    : currentTeacherId
    ? `Teacher (${teacher?.name.split(' ')[0] || 'Staff'})`
    : currentParentStudentId
    ? `Parent (${parentStudent?.name.split(' ')[0] || 'Child'})`
    : null;

  const navItems: { tab: WebsiteTab; label: string; icon?: React.ReactNode }[] = [
    { tab: 'HOME', label: 'Home' },
    { tab: 'SEARCH', label: 'Search Student', icon: <Search className="w-3.5 h-3.5" /> },
    { tab: 'CLASSES', label: 'Classes' },
    { tab: 'FEE_STRUCTURE', label: 'Fee Structure' },
    { tab: 'ADMISSIONS', label: 'Admissions' },
    { tab: 'FACILITIES', label: 'Facilities' },
    { tab: 'NOTICES', label: 'Notices' },
    { tab: 'CONTACT', label: 'Contact Us' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white shadow-md">
      {/* Top Banner Bar */}
      <div className="bg-[#07193B] text-slate-200 text-xs py-2 px-4 border-b border-amber-500/30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-amber-300 font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              “Pehle Tarbiyat, Phir Taleem”
            </span>
            <span className="hidden sm:inline-block text-slate-400">|</span>
            <span className="hidden sm:flex items-center gap-1 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Chak No. 47 GB, Samundri, Faisalabad
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto text-xs">
            {/* Live Cloud Database Badge */}
            <div
              className="flex items-center gap-1.5 bg-white/10 px-2.5 py-0.5 rounded-full text-[10px] text-emerald-300 font-medium"
              title="Real-Time Cloud Connected: تمام موبائلز پر ڈیٹا لائیو ہم آہنگ ہوتا ہے"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span>{isCloudSyncing ? 'Syncing...' : isCloudConnected ? 'Live Cloud' : 'Offline'}</span>
            </div>

            <button
              onClick={() => openWhatsApp()}
              className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20b858] text-white px-2.5 py-0.5 rounded-full font-medium transition"
              title="Official WhatsApp: 0302-5053993"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              <span>0302-5053993</span>
            </button>
            <a
              href="tel:03025053993"
              className="hidden md:flex items-center gap-1 hover:text-amber-300 text-slate-300 transition"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>Call Office</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main School Brand Header */}
      <div className="bg-[#0D285F] text-white py-3.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & School Name */}
          <div
            onClick={() => {
              setPortal('PUBLIC_WEBSITE');
              onTabChange('HOME');
            }}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <div className="relative flex-shrink-0">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-white p-0.5 shadow-lg border-2 border-amber-400 flex items-center justify-center overflow-hidden">
                <img
                  src="/school_logo.jpg"
                  alt="Bright Scholar School Logo"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-white font-serif-crest uppercase">
                  Bright Scholar School
                </h1>
                <span className="inline-block bg-amber-400 text-[#07193B] text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  Since 2017 (سنس 2017)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-300 font-bold">
                “Pehle Tarbiyat, Phir Taleem” • Chak 47 GB
              </p>
              <p className="text-[11px] text-slate-300 hidden md:block">
                Registered Primary & Middle Education • Character Building & High Ethics
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentPortal === 'PUBLIC_WEBSITE' && (
              <button
                onClick={onOpenAdmission}
                className="hidden sm:flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-[#07193B] font-bold text-xs sm:text-sm px-3.5 py-2 rounded-lg shadow transition transform hover:-translate-y-0.5"
              >
                <FileText className="w-4 h-4" />
                <span>Online Admission</span>
              </button>
            )}

            {userRole ? (
              <div className="flex items-center gap-2 bg-[#1E3A8A] border border-blue-400/40 rounded-lg p-1.5 pr-2.5">
                <div className="w-7 h-7 rounded-full bg-amber-400 text-[#07193B] flex items-center justify-center font-bold text-xs">
                  {isAdminLoggedIn ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <div className="font-bold text-white">{userRole}</div>
                  <div className="text-[10px] text-emerald-300 font-medium">Logged In</div>
                </div>
                <button
                  onClick={logout}
                  className="ml-1 text-slate-300 hover:text-red-300 p-1 rounded transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/25 font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-lg transition"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Portal Login</span>
              </button>
            )}

            {/* 1-Click Install App button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-install-guide'))}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-[#07193B] font-extrabold text-xs sm:text-sm px-2.5 sm:px-3 py-2 rounded-lg shadow transition active:scale-95"
              title="Install Mobile App"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install App</span>
              <span className="sm:hidden">ایپ</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Primary Navigation Bar (Desktop) */}
      <nav className="bg-[#07193B] text-slate-200 border-t border-white/10 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* If in management portal, provide button to return to website */}
            {currentPortal !== 'PUBLIC_WEBSITE' ? (
              <div className="flex items-center gap-2 py-2">
                <button
                  onClick={() => setPortal('PUBLIC_WEBSITE')}
                  className="bg-amber-400 text-[#07193B] hover:bg-amber-300 px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1"
                >
                  ← Back to Public Website
                </button>
                <span className="text-xs text-slate-300 font-medium px-2">
                  Active Mode: <strong className="text-amber-300">{currentPortal.replace('_', ' ')}</strong>
                </span>
              </div>
            ) : (
              navItems.map(item => {
                const isActive = currentTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    onClick={() => onTabChange(item.tab)}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium transition border-b-2 ${
                      isActive
                        ? 'border-amber-400 text-amber-300 font-bold bg-white/5'
                        : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Quick portal shortcut links if on website */}
          {currentPortal === 'PUBLIC_WEBSITE' && (
            <div className="flex items-center gap-2 py-1.5 text-xs text-slate-300">
              <span className="text-slate-400">Direct Portals:</span>
              <button
                onClick={() => {
                  if (isAdminLoggedIn) setPortal('ADMIN_PORTAL');
                  else onOpenLogin();
                }}
                className="hover:text-amber-300 text-slate-300 px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition"
              >
                Admin
              </button>
              <button
                onClick={() => {
                  if (currentTeacherId) setPortal('TEACHER_PORTAL');
                  else onOpenLogin();
                }}
                className="hover:text-amber-300 text-slate-300 px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition"
              >
                Teachers
              </button>
              <button
                onClick={() => {
                  setPortal('PARENT_PORTAL');
                }}
                className="hover:text-amber-300 text-slate-300 px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition"
              >
                Parents
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#07193B] border-t border-white/10 px-4 py-3 space-y-1">
          {currentPortal !== 'PUBLIC_WEBSITE' ? (
            <button
              onClick={() => {
                setPortal('PUBLIC_WEBSITE');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left bg-amber-400 text-[#07193B] font-bold px-3 py-2 rounded-lg text-sm mb-2"
            >
              ← Back to Public School Website
            </button>
          ) : (
            <>
              {navItems.map(item => (
                <button
                  key={item.tab}
                  onClick={() => {
                    onTabChange(item.tab);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 ${
                    currentTab === item.tab
                      ? 'bg-amber-400 text-[#07193B] font-bold'
                      : 'text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}

              <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('open-install-guide'));
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-center py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>📲 موبائل ایپ انسٹال کریں (Install App)</span>
                </button>
                <button
                  onClick={() => {
                    onOpenAdmission();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-amber-400 text-[#07193B] font-bold text-center py-2 rounded-lg text-sm"
                >
                  Apply Online Admission
                </button>
                <button
                  onClick={() => {
                    onOpenLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-[#1E3A8A] text-white font-semibold text-center py-2 rounded-lg text-sm"
                >
                  Login to Portal
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
};
