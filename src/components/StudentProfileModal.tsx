import React from 'react';
import { X, User, Mail, Phone, MapPin, Target, Calendar, BookOpen, Award, CheckCircle2, PlayCircle, Clock, ShieldCheck, Edit3, LogOut } from 'lucide-react';
import { StudentProfile, Course, UserProgress } from '../types';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentProfile: StudentProfile | null;
  courses: Course[];
  userProgressMap: Record<string, UserProgress>;
  onSelectCourse?: (course: Course) => void;
  onOpenCertificate?: (course: Course) => void;
  onEditProfile?: () => void;
  onLogout?: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  studentProfile,
  courses,
  userProgressMap,
  onSelectCourse,
  onOpenCertificate,
  onEditProfile,
  onLogout,
}) => {
  if (!isOpen) return null;

  const safeCourses = courses || [];
  const safeProgressMap = userProgressMap || {};

  const enrolledCourses = safeCourses.filter((c) => safeProgressMap[c.id]);
  const completedCourses = enrolledCourses.filter((c) => safeProgressMap[c.id]?.isCompleted);
  const inProgressCourses = enrolledCourses.filter((c) => !safeProgressMap[c.id]?.isCompleted);

  const displayName = studentProfile?.fullName || 'مازن حمادة';
  const displayEmail = studentProfile?.email || 'mazenhamada37@gmail.com';
  const displayPhone = studentProfile?.phone || '+20 100 000 0000';
  const displayCountry = studentProfile?.country || 'مصر';
  const displayGoal = studentProfile?.jobTitleOrGoal || 'برمجة وتطوير الويب';
  const displayDate = studentProfile?.registeredAt || '2026-01-15';

  const infoCard = 'space-y-1 rounded-2xl border border-aqua-mid bg-aqua-light/20 p-3.5';
  const infoLabel = 'flex items-center gap-1 text-[11px] text-ink/60';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex min-h-full items-center justify-center overflow-y-auto bg-gradient-to-br from-[#E3F1F3] via-white to-[#C6E2E6] p-3 font-arabic sm:p-4"
      dir="rtl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-aqua-mid bg-white shadow-xl"
      >
        {/* Header */}
        <div className="relative shrink-0 bg-aqua-light p-5 text-ink sm:p-6">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 z-10 cursor-pointer rounded-full bg-white/70 p-2 text-ink transition-colors hover:bg-white"
            title="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4 pl-10">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl font-black text-aqua-dark sm:h-16 sm:w-16 sm:text-3xl">
              {displayName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-black sm:text-2xl">{displayName}</h3>
                <span className="flex items-center gap-1 rounded-full bg-aqua-dark px-2.5 py-0.5 text-[10px] font-black text-white sm:text-xs">
                  <ShieldCheck className="h-3 w-3" />
                  حساب طالب معتمد
                </span>
              </div>
              <p className="mt-1 truncate font-mono text-xs text-ink/70">{displayEmail}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-4 text-right sm:p-6">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-sm font-bold text-ink">
                <User className="h-4 w-4 text-aqua-dark" />
                <span>البيانات الشخصية للطالب</span>
              </h4>
              {onEditProfile && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEditProfile();
                  }}
                  className="flex cursor-pointer items-center gap-1 text-xs font-bold text-aqua-dark hover:underline"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>تعديل البيانات</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className={infoCard}>
                <span className={infoLabel}><Mail className="h-3.5 w-3.5 text-aqua-dark" />البريد الإلكتروني</span>
                <span className="block truncate font-mono text-xs font-bold text-ink">{displayEmail}</span>
              </div>

              <div className={infoCard}>
                <span className={infoLabel}><Phone className="h-3.5 w-3.5 text-aqua-dark" />رقم الهاتف / الجوال</span>
                <span className="block font-mono text-xs font-bold text-ink">{displayPhone}</span>
              </div>

              <div className={infoCard}>
                <span className={infoLabel}><MapPin className="h-3.5 w-3.5 text-aqua-dark" />الدولة / البلد</span>
                <span className="block text-xs font-bold text-ink">{displayCountry}</span>
              </div>

              <div className={infoCard}>
                <span className={infoLabel}><Target className="h-3.5 w-3.5 text-aqua-dark" />التخصص والهدف التعليمي</span>
                <span className="block truncate text-xs font-bold text-ink">{displayGoal}</span>
              </div>

              <div className={`${infoCard} sm:col-span-2`}>
                <span className={infoLabel}><Calendar className="h-3.5 w-3.5 text-aqua-dark" />تاريخ الانضمام والتسجيل</span>
                <span className="block font-mono text-xs font-bold text-ink">{displayDate}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h4 className="flex items-center gap-2 text-sm font-bold text-ink">
                <BookOpen className="h-4 w-4 text-aqua-dark" />
                <span>الكورسات المسجل بها ({enrolledCourses.length})</span>
              </h4>
              <span className="text-[11px] text-ink/60">
                مكتمل: {completedCourses.length} | قيد التعلم: {inProgressCourses.length}
              </span>
            </div>

            {enrolledCourses.length === 0 ? (
              <div className="space-y-1 rounded-2xl border border-dashed border-aqua-mid bg-aqua-light/20 p-6 text-center text-xs text-ink/70">
                <BookOpen className="mx-auto mb-1 h-6 w-6 text-aqua-dark" />
                <p className="font-bold">لم تلتحق بأي كورس حتى الآن</p>
                <p className="text-[11px]">تصفح كتالوج الدورات وابدأ التعلم الآن لتظهر دوراتك هنا.</p>
              </div>
            ) : (
              <div className="max-h-60 space-y-2.5 overflow-y-auto pr-1">
                {enrolledCourses.map((course) => {
                  const prog = safeProgressMap[course.id];
                  const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
                  const completedLessons = prog?.completedLessonIds?.length || 0;
                  const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
                  const isDone = prog?.isCompleted;

                  return (
                    <div
                      key={course.id}
                      className="flex flex-col justify-between gap-3 rounded-2xl border border-aqua-mid bg-white p-3 transition-all hover:border-aqua-dark sm:flex-row sm:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-aqua-light text-aqua-dark">
                          {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-ink">{course.title}</h5>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-ink/60">
                            <span>{course.level}</span>
                            <span>•</span>
                            <span>{completedLessons} من {totalLessons} درس</span>
                            <span>•</span>
                            <span className="font-mono font-bold text-aqua-dark">{percent}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {isDone && onOpenCertificate && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenCertificate(course);
                            }}
                            className="flex cursor-pointer items-center gap-1 rounded-xl border border-aqua-mid bg-aqua-light/40 px-3 py-1.5 text-xs font-bold text-ink hover:bg-aqua-light"
                            title="عرض الشهادة المعتمدة"
                          >
                            <Award className="h-3.5 w-3.5 text-aqua-dark" />
                            <span>الشهادة</span>
                          </button>
                        )}
                        {onSelectCourse && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onSelectCourse(course);
                            }}
                            className="flex cursor-pointer items-center gap-1 rounded-xl bg-aqua-dark px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-ink"
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                            <span>{isDone ? 'مراجعة' : 'متابعة'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {onLogout && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-aqua-mid pt-4">
              <span className="text-xs text-ink/60">هل تريد الخروج من هذا الحساب؟</span>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600 transition-all hover:bg-rose-100"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfileModal;