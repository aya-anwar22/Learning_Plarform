import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  UserCheck,
  Plus,
  BookOpen,
  Search,
  ShieldCheck,
  GraduationCap,
  Menu,
  X,
  LogIn
} from 'lucide-react';
import { StudentProfile, InstructorProfile, Course } from '../types';
import { getCourseSearchScore } from '../utils/searchUtils';

export interface HeaderProps {
  currentRole?: 'student' | 'teacher' | 'instructor' | 'admin';
  onRoleChange?: (role: any) => void;
  activeTab?: string;
  setActiveTab?: (tab: 'catalog' | 'dashboard' | 'instructor') => void;
  onOpenAiGenerator?: () => void;
  onOpenAiTutor?: () => void;
  onOpenAddCourseModal?: () => void;
  onOpenStudentProfile?: () => void;
  onOpenAddAccount?: () => void;
  onOpenCatalog?: () => void;
  onOpenDashboard?: () => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  courses?: Course[];
  onSelectCourse?: (course: Course) => void;
  studentProfile?: StudentProfile | null;
  instructorProfile?: InstructorProfile | null;
  userName?: string;
  onOpenRegistrationModal?: () => void;
  onOpenInstructorRegistrationModal?: () => void;
  onOpenAddUserModal?: () => void;
  onOpenAdminModal?: () => void;
  onUserProfileClick?: () => void;
  onAddAccount?: () => void;
  onOpenCourseCatalog?: () => void;
  onOpenDashboardAndCertificates?: () => void;
  darkMode?: boolean;
  setDarkMode?: (val: boolean) => void;
  completedCoursesCount?: number;
  streakDays?: number;
  extraRegisteredStudents?: StudentProfile[];
  extraRegisteredInstructors?: InstructorProfile[];
  onSelectActiveStudent?: (student: StudentProfile) => void;
  onSelectActiveInstructor?: (instructor: InstructorProfile) => void;
  onLogoutStudent?: () => void;
  onLogoutInstructor?: () => void;
  isOwnerSession?: boolean;
  onSelectOwner?: () => void;
  isCloudSynced?: boolean;
  onOpenLoginModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole = 'student',
  onRoleChange,
  activeTab = 'catalog',
  setActiveTab,
  onOpenAiTutor,
  onOpenStudentProfile,
  onOpenAddAccount,
  onOpenCatalog,
  onSearch,
  searchQuery = '',
  setSearchQuery,
  courses = [],
  onSelectCourse,
  studentProfile,
  instructorProfile,
  onOpenRegistrationModal,
  onOpenInstructorRegistrationModal,
  onOpenAddUserModal,
  onOpenAdminModal,
  onUserProfileClick,
  onAddAccount,
  onOpenCourseCatalog,
  onOpenLoginModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsSearchFocused(false);
      if (activeTab !== 'catalog' && setActiveTab) {
        setActiveTab('catalog');
      }
      setTimeout(() => {
        const el = document.getElementById('catalog-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 600, behavior: 'smooth' });
        }
      }, 50);
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
    }
  };

  const instructorDisplayName = instructorProfile?.fullName || 'أستاذ محاضر';
  const isStudentActive = currentRole === 'student';
  const isInstructorActive = currentRole === 'instructor' || currentRole === 'teacher';

  const handleSwitchToStudent = () => {
    if (onRoleChange) onRoleChange('student');
    if (setActiveTab) setActiveTab('catalog');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchToInstructor = () => {
    if (onRoleChange) onRoleChange('instructor');
    if (setActiveTab) setActiveTab('instructor');
    setMobileMenuOpen(false);
    if (!instructorProfile && onOpenInstructorRegistrationModal) {
      onOpenInstructorRegistrationModal();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddAccount = () => {
    setMobileMenuOpen(false);
    if (onOpenAddUserModal) {
      onOpenAddUserModal();
    } else if (onAddAccount) {
      onAddAccount();
    } else if (onOpenAddAccount) {
      onOpenAddAccount();
    }
  };

  const handleUserProfile = () => {
    setMobileMenuOpen(false);
    if (isInstructorActive) {
      if (onOpenInstructorRegistrationModal) {
        onOpenInstructorRegistrationModal();
      }
    } else {
      if (onOpenStudentProfile) {
        onOpenStudentProfile();
      } else if (onUserProfileClick) {
        onUserProfileClick();
      } else if (onOpenRegistrationModal) {
        onOpenRegistrationModal();
      }
    }
  };

  const handleAiTutor = () => {
    setMobileMenuOpen(false);
    if (onOpenAiTutor) {
      onOpenAiTutor();
    }
  };

  const handleAdmin = () => {
    setMobileMenuOpen(false);
    if (onOpenAdminModal) {
      onOpenAdminModal();
    } else if (onRoleChange) {
      onRoleChange('admin');
    }
  };

  const handleCatalog = () => {
    setMobileMenuOpen(false);
    if (setActiveTab) setActiveTab('catalog');
    if (onOpenCatalog) onOpenCatalog();
    if (onOpenCourseCatalog) onOpenCourseCatalog();
    const el = document.getElementById('catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogin = () => {
    setMobileMenuOpen(false);
    if (onOpenLoginModal) {
      onOpenLoginModal();
    } else if (onOpenRegistrationModal) {
      onOpenRegistrationModal();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (setSearchQuery) setSearchQuery(val);
    if (onSearch) onSearch(val);
    if (val.trim() && activeTab !== 'catalog' && setActiveTab) {
      setActiveTab('catalog');
    }
  };

  // أنماط مشتركة للأزرار
  const btnBase = 'flex items-center gap-1.5 px-2.5 xl:px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-95';
  const btnLight = `${btnBase} bg-white border border-aqua-mid text-ink hover:bg-aqua-light`;
  const btnSolid = `${btnBase} bg-aqua-dark hover:bg-ink text-white shadow-sm`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-aqua-mid font-arabic text-ink select-none w-full pt-[env(safe-area-inset-top)]" dir="rtl">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">

        {/* DESKTOP */}
        <div className="hidden lg:flex items-center gap-1.5 xl:gap-2 flex-1 min-w-0">
          {/* Toggle */}
          <div className="flex bg-aqua-light/60 p-1 rounded-xl border border-aqua-mid shrink-0">
            <button
              type="button"
              onClick={handleSwitchToStudent}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isStudentActive ? 'bg-aqua-dark text-white shadow-sm' : 'text-ink/70 hover:text-ink'
              }`}
            >
              طالب
            </button>
            <button
              type="button"
              onClick={handleSwitchToInstructor}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isInstructorActive ? 'bg-ink text-white shadow-sm' : 'text-ink/70 hover:text-ink'
              }`}
            >
              محاضر
            </button>
          </div>

          <button type="button" onClick={handleLogin} className={btnLight} title="تسجيل الدخول لحساب موجود">
            <LogIn className="w-4 h-4 text-aqua-dark" />
            <span>تسجيل الدخول</span>
          </button>

          <button type="button" onClick={handleAddAccount} className={btnSolid} title="إضافة حساب جديد">
            <span>إضافة حساب</span>
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>

          {isInstructorActive ? (
            <button type="button" onClick={handleUserProfile} className={`${btnBase} bg-aqua-light border border-aqua text-ink hover:bg-aqua-mid`} title="بيانات المحاضر">
              <GraduationCap className="w-4 h-4 text-aqua-dark shrink-0" />
              <span className="max-w-[120px] truncate">{instructorDisplayName}</span>
            </button>
          ) : (
            studentProfile && (
              <button type="button" onClick={handleUserProfile} className={`${btnBase} bg-aqua-light border border-aqua text-ink hover:bg-aqua-mid`} title="بيانات الطالب المسجل">
                <UserCheck className="w-4 h-4 text-aqua-dark shrink-0" />
                <span className="max-w-[130px] truncate">{studentProfile.fullName}</span>
              </button>
            )
          )}

          <button type="button" onClick={handleAiTutor} className={btnLight}>
            <Bot className="w-4 h-4 text-aqua-dark shrink-0" />
            <span>المعلم الذكي</span>
          </button>

          <button type="button" onClick={handleAdmin} className={btnLight}>
            <ShieldCheck className="w-4 h-4 text-aqua-dark shrink-0" />
            <span>المسؤول</span>
          </button>

          {!isInstructorActive && (
            <button
              type="button"
              onClick={handleCatalog}
              className={`${btnBase} border ${
                activeTab === 'catalog'
                  ? 'bg-aqua-light border-aqua text-ink'
                  : 'bg-white border-aqua-mid text-ink hover:bg-aqua-light'
              }`}
            >
              <BookOpen className="w-4 h-4 text-aqua-dark shrink-0" />
              <span>كتالوج الدورات</span>
            </button>
          )}
        </div>

        {/* MOBILE HAMBURGER */}
        <div className="flex lg:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 rounded-xl bg-white border border-aqua-mid hover:border-aqua text-ink flex items-center justify-center transition-all cursor-pointer active:scale-95"
            aria-label="القائمة"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Logo */}
        <div onClick={handleCatalog} className="flex items-center gap-2 shrink-0 cursor-pointer select-none">
          <span className="font-extrabold text-ink text-sm sm:text-base tracking-tight flex items-center gap-1 whitespace-nowrap">
            منصة <span className="text-aqua-dark">تعلَّم</span>
          </span>
          <div className="w-8 h-8 rounded-xl bg-aqua-dark text-white flex items-center justify-center shadow-sm shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* SEARCH ROW */}
      <div className="w-full bg-aqua-light/40 border-t border-aqua-mid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          <div ref={searchContainerRef} className="relative w-full max-w-4xl mx-auto">
            <div
              className={`flex items-center w-full rounded-2xl transition-all duration-200 border bg-white ${
                isSearchFocused
                  ? 'border-aqua-dark ring-2 ring-aqua/40 shadow-md'
                  : 'border-aqua-mid hover:border-aqua shadow-sm'
              }`}
            >
              <div className="pr-3.5 pl-1 flex items-center justify-center shrink-0 pointer-events-none">
                <Search className={`w-4 h-4 transition-colors ${isSearchFocused ? 'text-aqua-dark' : 'text-ink/50'}`} />
              </div>
              <input
                type="text"
                placeholder="ابحث عن اسم الدورة، التخصص (برمجة، ذكاء اصطناعي، لغات...)، أو المحاضر..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={handleSearchKeyDown}
                className="w-full h-10 sm:h-11 bg-transparent text-sm text-ink placeholder-ink/45 focus:outline-none px-2 font-normal"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    if (setSearchQuery) setSearchQuery('');
                    if (onSearch) onSearch('');
                  }}
                  className="ml-2 w-6 h-6 rounded-full bg-aqua-light hover:bg-aqua-mid text-ink flex items-center justify-center transition-all cursor-pointer shrink-0"
                  aria-label="مسح البحث"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-aqua-mid bg-white px-4 py-4 space-y-3 shadow-xl max-h-[70vh] overflow-y-auto">
          <div className="flex bg-aqua-light/60 p-1 rounded-xl border border-aqua-mid w-full">
            <button
              type="button"
              onClick={handleSwitchToStudent}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center ${
                isStudentActive ? 'bg-aqua-dark text-white shadow-sm' : 'text-ink/70'
              }`}
            >
              طالب
            </button>
            <button
              type="button"
              onClick={handleSwitchToInstructor}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center ${
                isInstructorActive ? 'bg-ink text-white shadow-sm' : 'text-ink/70'
              }`}
            >
              محاضر
            </button>
          </div>

          {studentProfile && !isInstructorActive && (
            <div
              onClick={handleUserProfile}
              className="flex items-center justify-between p-3 rounded-xl border cursor-pointer bg-aqua-light/50 border-aqua hover:border-aqua-dark transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-aqua-mid text-aqua-dark">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-ink">{studentProfile.fullName}</div>
                  <div className="text-[10px] text-ink/60">الملف الشخصي للطالب المسجل</div>
                </div>
              </div>
              <span className="text-xs font-bold underline text-aqua-dark">عرض</span>
            </div>
          )}

          {isInstructorActive && (
            <div
              onClick={handleUserProfile}
              className="flex items-center justify-between p-3 rounded-xl border cursor-pointer bg-aqua-light/50 border-aqua hover:border-aqua-dark transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-aqua-mid text-aqua-dark">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-ink">{instructorDisplayName}</div>
                  <div className="text-[10px] text-ink/60">بيانات المحاضر</div>
                </div>
              </div>
              <span className="text-xs font-bold underline text-aqua-dark">عرض</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleLogin}
              className="col-span-2 p-3 rounded-xl bg-white border border-aqua-mid text-ink font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:bg-aqua-light"
            >
              <LogIn className="w-4 h-4 text-aqua-dark" />
              <span>تسجيل الدخول لحساب موجود</span>
            </button>

            <button
              type="button"
              onClick={handleAddAccount}
              className="col-span-2 p-3 rounded-xl bg-aqua-dark hover:bg-ink text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>إضافة حساب جديد</span>
            </button>

            {!isInstructorActive && (
              <button
                type="button"
                onClick={handleCatalog}
                className={`col-span-2 p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  activeTab === 'catalog'
                    ? 'bg-aqua-light border-aqua text-ink'
                    : 'bg-white border-aqua-mid text-ink hover:bg-aqua-light'
                }`}
              >
                <BookOpen className="w-4 h-4 text-aqua-dark" />
                <span>كتالوج الدورات</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAiTutor}
              className="p-3 rounded-xl bg-white border border-aqua-mid text-ink hover:bg-aqua-light font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bot className="w-4 h-4 text-aqua-dark" />
              <span>المعلم الذكي</span>
            </button>

            <button
              type="button"
              onClick={handleAdmin}
              className="p-3 rounded-xl bg-white border border-aqua-mid text-ink hover:bg-aqua-light font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-aqua-dark" />
              <span>المسؤول</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;