import React, { useState } from 'react';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { InstallAppBanner } from './components/InstallAppBanner';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OnlineAdmissionModal } from './components/OnlineAdmissionModal';
import { StudentProfileModal } from './components/StudentProfileModal';
import { LoginModal } from './pages/LoginModal';
import { WebsiteHome } from './pages/WebsiteHome';
import { StudentSearchPage } from './pages/StudentSearchPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { TeacherPortal } from './pages/TeacherPortal';
import { ParentPortal } from './pages/ParentPortal';
import { WebsiteTab, Student } from './types';

const MainApp: React.FC = () => {
  const { currentPortal, selectedStudentForModal, setSelectedStudentForModal } = useSchool();

  const [currentTab, setCurrentTab] = useState<WebsiteTab>('HOME');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalRole, setLoginModalRole] = useState<'admin' | 'teacher' | 'parent'>('admin');
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);

  const handleOpenLogin = (role?: 'admin' | 'teacher' | 'parent') => {
    setLoginModalRole(role || 'admin');
    setShowLoginModal(true);
  };

  const handleTabChange = (tab: WebsiteTab) => {
    setCurrentTab(tab);
    if (tab === 'HOME') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'CLASSES') {
      const el = document.getElementById('classes');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'FEE_STRUCTURE') {
      const el = document.getElementById('fee');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'FACILITIES') {
      const el = document.getElementById('facilities');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'NOTICES') {
      const el = document.getElementById('notices');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'CONTACT') {
      const el = document.getElementById('contact');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'ADMISSIONS') {
      setShowAdmissionModal(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* 1-Tap App Install Banner */}
      <InstallAppBanner />

      {/* Top Main Navigation Header */}
      <Header
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onOpenLogin={handleOpenLogin}
        onOpenAdmission={() => setShowAdmissionModal(true)}
      />

      {/* Main Dynamic Viewport */}
      <main className="flex-1 pb-16 md:pb-0">
        {currentPortal === 'PUBLIC_WEBSITE' && (
          currentTab === 'SEARCH' ? (
            <StudentSearchPage
              onSelectStudent={(student: Student) => setSelectedStudentForModal(student)}
            />
          ) : (
            <WebsiteHome
              onOpenAdmission={() => setShowAdmissionModal(true)}
              onOpenLogin={handleOpenLogin}
              onSelectStudent={(student: Student) => setSelectedStudentForModal(student)}
              onTabChange={handleTabChange}
              currentTab={currentTab}
            />
          )
        )}

        {currentPortal === 'ADMIN_PORTAL' && (
          <AdminDashboard
            onSelectStudent={(student: Student) => setSelectedStudentForModal(student)}
          />
        )}

        {currentPortal === 'TEACHER_PORTAL' && (
          <TeacherPortal
            onSelectStudent={(student: Student) => setSelectedStudentForModal(student)}
          />
        )}

        {currentPortal === 'PARENT_PORTAL' && (
          <ParentPortal
            onSelectStudent={(student: Student) => setSelectedStudentForModal(student)}
          />
        )}
      </main>

      {/* Official School Footer */}
      <Footer />

      {/* Floating 24/7 WhatsApp Assistance */}
      <FloatingWhatsApp />

      {/* Native App-like Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onOpenLogin={handleOpenLogin}
        onOpenAdmission={() => setShowAdmissionModal(true)}
      />

      {/* Modals */}
      <OnlineAdmissionModal
        isOpen={showAdmissionModal}
        onClose={() => setShowAdmissionModal(false)}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        initialRole={loginModalRole}
      />

      <StudentProfileModal
        student={selectedStudentForModal}
        onClose={() => setSelectedStudentForModal(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <SchoolProvider>
      <MainApp />
    </SchoolProvider>
  );
}
