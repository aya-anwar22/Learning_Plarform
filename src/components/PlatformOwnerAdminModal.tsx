import React, { useMemo, useState } from 'react';

export interface StudentProfile {
  fullName: string;
  email: string;
  [key: string]: any;
}

export interface InstructorProfile {
  fullName: string;
  email: string;
  [key: string]: any;
}

export interface Course {
  id: string;
  title: string;
  category?: string;
  [key: string]: any;
}

export interface CourseChangeRequest {
  id: string;
  courseTitle?: string;
  instructorName?: string;
  [key: string]: any;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  courses?: Course[];
  registeredStudents?: StudentProfile[];
  registeredInstructors?: InstructorProfile[];
  pendingStudents?: StudentProfile[];
  pendingInstructors?: InstructorProfile[];
  pendingCourseRequests?: CourseChangeRequest[];
  onViewStudentDetails?: (student: StudentProfile) => void;
  onViewStudentCertificates?: (student: StudentProfile) => void;
  onApproveStudent?: (email: string) => void;
  onRejectStudent?: (email: string) => void;
  onDeleteStudent?: (email: string) => void;
  onApproveInstructor?: (email: string) => void;
  onRejectInstructor?: (email: string) => void;
  onDeleteInstructor?: (email: string) => void;
  onDeleteCourse?: (id: string) => void;
  onAddCourse?: (course: Course) => void;
  onUpdateCourse?: (course: Course) => void;
  updateAdminConfigInCloud?: (config: { passcode: string }) => Promise<void>;
  getStoredMasterPasscode?: () => string;
  onDeleteAllStudents?: () => Promise<void> | void;
  onDeleteAllInstructors?: () => Promise<void> | void;
  onClearAllPendingRequests?: () => Promise<void> | void;
  isCloudSynced?: boolean;
}

type Tab = 'overview' | 'approvals' | 'students' | 'instructors' | 'courses' | 'requests';
type AuthView = 'login' | 'forgot-email' | 'forgot-otp' | 'forgot-newpass';

const ALLOWED_RECOVERY_EMAIL = 'mazenhamada37@gmail.com';

const labelFor = (key: string) => {
  const labels: Record<string, string> = {
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
    specialty: 'التخصص',
    bio: 'نبذة تعريفية',
    category: 'التصنيف',
    level: 'المستوى',
    title: 'العنوان',
    description: 'الوصف',
    status: 'الحالة',
    createdAt: 'تاريخ التسجيل',
  };
  return labels[key] || key;
};

const safeEntries = (item: Record<string, any>) =>
  Object.entries(item || {}).filter(
    ([key, value]) =>
      !['password', 'id'].includes(key) &&
      value !== undefined &&
      value !== null &&
      value !== '' &&
      typeof value !== 'object'
  );

// أنماط مشتركة
const overlayBg = 'bg-gradient-to-br from-[#E3F1F3] via-white to-[#C6E2E6]';
const inputCls =
  'w-full rounded-xl border border-aqua-mid bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/40 outline-none transition focus:border-aqua-dark focus:ring-2 focus:ring-aqua/40';
const primaryBtn =
  'w-full cursor-pointer rounded-xl bg-aqua-dark py-3 text-sm font-black text-white transition hover:bg-ink active:scale-95 disabled:opacity-60';
const linkBtn = 'mt-3 w-full cursor-pointer text-center text-xs font-bold text-aqua-dark hover:underline disabled:opacity-60';
const mutedLinkBtn = 'mt-2 w-full cursor-pointer text-center text-xs font-bold text-ink/60 hover:text-ink hover:underline';
const closeBtn = 'cursor-pointer rounded-xl bg-aqua-light/60 px-3 py-1 text-ink/70 transition hover:bg-aqua-light hover:text-ink';
const errBox = 'mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-600';
const okBox = 'mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700';
const rowCard =
  'mb-2 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-aqua-mid bg-white p-4 transition hover:border-aqua-dark hover:bg-aqua-light/30';
const pendingCard =
  'flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-2xl border border-aqua bg-aqua-light/40 p-4';
const emptyBox = 'rounded-xl bg-aqua-light/30 p-4 text-center text-xs text-ink/60';

export const PlatformOwnerAdminModal: React.FC<Props> = ({
  isOpen,
  onClose,
  courses = [],
  registeredStudents = [],
  registeredInstructors = [],
  pendingStudents = [],
  pendingInstructors = [],
  pendingCourseRequests = [],
  onViewStudentDetails,
  onViewStudentCertificates,
  onApproveStudent,
  onRejectStudent,
  onDeleteStudent,
  onApproveInstructor,
  onRejectInstructor,
  onDeleteInstructor,
  onDeleteCourse,
  updateAdminConfigInCloud,
  getStoredMasterPasscode = () => localStorage.getItem('edu_admin_passcode') || '778899',
  onDeleteAllStudents,
  onDeleteAllInstructors,
  onClearAllPendingRequests,
  isCloudSynced = true,
}) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [flowError, setFlowError] = useState('');
  const [flowSuccess, setFlowSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [details, setDetails] = useState<Record<string, any> | null>(null);

  const [dangerAction, setDangerAction] = useState<'students' | 'instructors' | 'requests' | null>(null);
  const [dangerConfirmText, setDangerConfirmText] = useState('');
  const [isDangerLoading, setIsDangerLoading] = useState(false);
  const [dangerMessage, setDangerMessage] = useState('');

  const q = search.trim().toLowerCase();
  const students = useMemo(
    () => (Array.isArray(registeredStudents) ? registeredStudents : []).filter((x) => `${x.fullName || ''} ${x.email || ''}`.toLowerCase().includes(q)),
    [registeredStudents, q]
  );
  const instructors = useMemo(
    () => (Array.isArray(registeredInstructors) ? registeredInstructors : []).filter((x) => `${x.fullName || ''} ${x.email || ''}`.toLowerCase().includes(q)),
    [registeredInstructors, q]
  );
  const courseList = useMemo(
    () => (Array.isArray(courses) ? courses : []).filter((x) => `${x.title || ''} ${x.category || ''}`.toLowerCase().includes(q)),
    [courses, q]
  );

  const pendingStudentRows = Array.isArray(pendingStudents) ? pendingStudents : [];
  const pendingInstructorRows = Array.isArray(pendingInstructors) ? pendingInstructors : [];
  const requestRows = Array.isArray(pendingCourseRequests) ? pendingCourseRequests : [];

  if (!isOpen) return null;

  const login = (event: React.FormEvent) => {
    event.preventDefault();
    if (passcode === getStoredMasterPasscode()) {
      setAuthenticated(true);
      setPasscode('');
      setLoginError('');
    } else {
      setLoginError('كلمة المرور غير صحيحة');
    }
  };

  const resetForgotFlowState = () => {
    setRecoveryEmail('');
    setOtpValue('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setFlowError('');
    setFlowSuccess('');
    setIsSubmitting(false);
  };

  const close = () => {
    setDetails(null);
    setAuthenticated(false);
    setPasscode('');
    setLoginError('');
    setAuthView('login');
    setDangerAction(null);
    setDangerConfirmText('');
    setDangerMessage('');
    resetForgotFlowState();
    onClose();
  };

  const goToLogin = () => {
    setAuthView('login');
    resetForgotFlowState();
  };

  const handleSendOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setFlowError('');
    setFlowSuccess('');

    const cleanEmail = recoveryEmail.trim().toLowerCase();
    if (cleanEmail !== ALLOWED_RECOVERY_EMAIL.toLowerCase()) {
      setFlowError('هذا البريد الإلكتروني غير مصرح له باسترجاع كلمة المرور.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: cleanEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFlowError(data.error || 'حدث خطأ أثناء إرسال رمز التحقق. حاول مرة أخرى.');
        setIsSubmitting(false);
        return;
      }
      setFlowSuccess(data.message || 'تم إرسال رمز التحقق بنجاح!');
      setIsSubmitting(false);
      setAuthView('forgot-otp');
    } catch (err) {
      setFlowError('تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.');
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setFlowError('');
    setFlowSuccess('');

    if (otpValue.trim().length !== 6) {
      setFlowError('يرجى إدخال رمز التحقق المكوّن من 6 أرقام كاملاً.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFlowError(data.error || 'رمز التحقق غير صحيح.');
        setIsSubmitting(false);
        return;
      }
      setFlowSuccess('');
      setIsSubmitting(false);
      setAuthView('forgot-newpass');
    } catch (err) {
      setFlowError('تعذر الاتصال بالخادم. حاول مرة أخرى.');
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setFlowError('');
    setFlowSuccess('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: ALLOWED_RECOVERY_EMAIL }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFlowError(data.error || 'تعذر إعادة إرسال الرمز.');
      } else {
        setFlowSuccess('تم إعادة إرسال رمز جديد إلى بريدك.');
      }
    } catch {
      setFlowError('تعذر الاتصال بالخادم.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetNewPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setFlowError('');

    if (newPassword.length < 4) {
      setFlowError('يجب أن تكون كلمة المرور 4 أحرف/أرقام على الأقل.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setFlowError('كلمتا المرور غير متطابقتين.');
      return;
    }

    setIsSubmitting(true);
    try {
      localStorage.setItem('edu_admin_passcode', newPassword);
      if (updateAdminConfigInCloud) {
        await updateAdminConfigInCloud({ passcode: newPassword });
      }
      setIsSubmitting(false);
      setFlowSuccess('تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.');
      setTimeout(() => {
        goToLogin();
      }, 1500);
    } catch (err) {
      setFlowError('حدث خطأ أثناء حفظ كلمة المرور الجديدة.');
      setIsSubmitting(false);
    }
  };

  const openDetails = (item: Record<string, any>, callback?: () => void) => {
    setDetails(item);
    callback?.();
  };

  const action = (event: React.MouseEvent, fn?: () => void) => {
    event.stopPropagation();
    fn?.();
  };

  const executeDangerAction = async () => {
    if (dangerConfirmText.trim() !== 'حذف') return;
    setIsDangerLoading(true);
    setDangerMessage('');
    try {
      if (dangerAction === 'students' && onDeleteAllStudents) {
        await onDeleteAllStudents();
        setDangerMessage('تم حذف جميع حسابات الطلاب بنجاح.');
      } else if (dangerAction === 'instructors' && onDeleteAllInstructors) {
        await onDeleteAllInstructors();
        setDangerMessage('تم حذف جميع حسابات المحاضرين بنجاح.');
      } else if (dangerAction === 'requests' && onClearAllPendingRequests) {
        await onClearAllPendingRequests();
        setDangerMessage('تم مسح جميع الطلبات المعلقة بنجاح.');
      }
      setDangerAction(null);
      setDangerConfirmText('');
    } catch (err) {
      setDangerMessage('حدث خطأ أثناء تنفيذ العملية. حاول مرة أخرى.');
    } finally {
      setIsDangerLoading(false);
    }
  };

  const PasswordEye: React.FC<{ shown: boolean; onToggle: () => void; title?: string }> = ({ shown, onToggle, title }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute left-1 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-2 text-ink/50 hover:text-ink"
      title={title}
    >
      {shown ? '🙈' : '👁️'}
    </button>
  );

  const AuthHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-black text-ink">{title}</h2>
        <p className="mt-1 text-xs text-ink/60">{subtitle}</p>
      </div>
      <button type="button" onClick={close} className={closeBtn} aria-label="إغلاق">✕</button>
    </div>
  );

  /* ================== شاشات الدخول ================== */
  if (!authenticated) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto ${overlayBg} p-4 font-arabic`} dir="rtl">
        <div className="my-8 w-full max-w-sm rounded-3xl border border-aqua-mid bg-white p-5 text-ink shadow-xl sm:p-6">

          {authView === 'login' && (
            <form onSubmit={login}>
              <AuthHeader title="دخول مالك المنصة" subtitle="أدخل كلمة المرور للمتابعة" />

              {loginError && <div className={errBox}>{loginError}</div>}

              <div className="relative mb-3">
                <input
                  autoFocus
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="كلمة المرور"
                  className={`${inputCls} pl-11`}
                />
                <PasswordEye shown={showPasscode} onToggle={() => setShowPasscode((v) => !v)} title={showPasscode ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'} />
              </div>

              <button type="submit" className={primaryBtn}>دخول</button>

              <button
                type="button"
                onClick={() => { setAuthView('forgot-email'); setRecoveryEmail(''); setFlowError(''); setFlowSuccess(''); }}
                className={linkBtn}
              >
                نسيت كلمة المرور؟
              </button>
            </form>
          )}

          {authView === 'forgot-email' && (
            <form onSubmit={handleSendOtp}>
              <AuthHeader title="استرجاع كلمة المرور" subtitle="أدخل البريد الإلكتروني المصرح به لإرسال رمز التحقق" />

              {flowError && <div className={errBox}>{flowError}</div>}

              <input
                autoFocus
                type="email"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="أدخل البريد الإلكتروني"
                dir="ltr"
                className={`${inputCls} mb-3 text-left`}
              />

              <button type="submit" disabled={isSubmitting} className={primaryBtn}>
                {isSubmitting ? 'جارٍ الإرسال...' : 'إرسال رمز التحقق'}
              </button>

              <button type="button" onClick={goToLogin} className={mutedLinkBtn}>الرجوع لتسجيل الدخول</button>
            </form>
          )}

          {authView === 'forgot-otp' && (
            <form onSubmit={handleVerifyOtp}>
              <AuthHeader title="رمز التحقق" subtitle="تم إرسال رمز مكوّن من 6 أرقام إلى بريدك" />

              {flowSuccess && <div className={okBox}>{flowSuccess}</div>}
              {flowError && <div className={errBox}>{flowError}</div>}

              <input
                autoFocus
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="- - - - - -"
                dir="ltr"
                className={`${inputCls} mb-3 text-center font-mono text-2xl tracking-[0.5em]`}
              />

              <button type="submit" disabled={isSubmitting} className={primaryBtn}>
                {isSubmitting ? 'جارٍ التحقق...' : 'تحقق من الرمز'}
              </button>

              <button type="button" onClick={handleResendOtp} disabled={isSubmitting} className={linkBtn}>إعادة إرسال الرمز</button>
              <button type="button" onClick={goToLogin} className={mutedLinkBtn}>الرجوع لتسجيل الدخول</button>
            </form>
          )}

          {authView === 'forgot-newpass' && (
            <form onSubmit={handleSetNewPassword}>
              <AuthHeader title="كلمة مرور جديدة" subtitle="اختر كلمة مرور جديدة لحساب مالك المنصة" />

              {flowSuccess && <div className={okBox}>{flowSuccess}</div>}
              {flowError && <div className={errBox}>{flowError}</div>}

              <div className="relative mb-3">
                <input
                  autoFocus
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="كلمة المرور الجديدة"
                  className={`${inputCls} pl-11`}
                />
                <PasswordEye shown={showNewPassword} onToggle={() => setShowNewPassword((v) => !v)} />
              </div>

              <div className="relative mb-3">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="تأكيد كلمة المرور الجديدة"
                  className={`${inputCls} pl-11`}
                />
                <PasswordEye shown={showConfirmPassword} onToggle={() => setShowConfirmPassword((v) => !v)} />
              </div>

              <button type="submit" disabled={isSubmitting} className={primaryBtn}>
                {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}
              </button>
            </form>
          )}

        </div>
      </div>
    );
  }

  /* ================== لوحة الإدارة ================== */
  const statCard = 'rounded-2xl border border-aqua-mid bg-aqua-light/30 p-4';
  const statNum = 'text-2xl font-black text-aqua-dark';
  const statLabel = 'mt-1 text-xs font-bold text-ink/60';

  const approveBtn = 'cursor-pointer rounded-xl bg-aqua-dark px-3 py-2 text-xs font-bold text-white hover:bg-ink';
  const rejectBtn = 'cursor-pointer rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100';

  const dangerBtn =
    'cursor-pointer rounded-xl border border-rose-300 bg-white px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg} p-3 font-arabic`} dir="rtl" onClick={close}>
      <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-aqua-mid bg-white text-ink shadow-xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between gap-3 bg-aqua-light px-4 py-4 text-ink sm:px-5">
          <div>
            <h1 className="text-lg font-black">إدارة المنصة</h1>
            <p className="text-xs text-ink/70">اضغط على أي اسم أو كورس لعرض بياناته</p>
          </div>
          <button type="button" onClick={close} className="cursor-pointer rounded-xl bg-white/70 px-3 py-1.5 hover:bg-white" aria-label="إغلاق">✕</button>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-aqua-mid px-3 no-scrollbar">
          {([['overview', '📊 نظرة عامة'], ['approvals', 'الموافقات'], ['students', 'الطلاب'], ['instructors', 'المحاضرون'], ['courses', 'الكورسات'], ['requests', 'طلبات التعديل']] as [Tab, string][]).map(([value, text]) => (
            <button
              key={value}
              type="button"
              onClick={() => { setTab(value); setSearch(''); setDangerAction(null); setDangerMessage(''); }}
              className={`cursor-pointer whitespace-nowrap border-b-2 px-4 py-3 text-xs font-black ${tab === value ? 'border-aqua-dark text-aqua-dark' : 'border-transparent text-ink/60 hover:text-ink'}`}
            >
              {text}
            </button>
          ))}
        </nav>

        <main className="flex-1 overflow-y-auto p-4 sm:p-5">

          {/* نظرة عامة */}
          {tab === 'overview' && (
            <section className="space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className={statCard}><p className={statNum}>{registeredStudents.length}</p><p className={statLabel}>إجمالي الطلاب</p></div>
                <div className={statCard}><p className={statNum}>{registeredInstructors.length}</p><p className={statLabel}>إجمالي المحاضرين</p></div>
                <div className={statCard}><p className={statNum}>{courses.length}</p><p className={statLabel}>إجمالي الكورسات</p></div>
                <div className={statCard}><p className={statNum}>{pendingStudentRows.length + pendingInstructorRows.length}</p><p className={statLabel}>طلبات تسجيل معلقة</p></div>
                <div className={statCard}><p className={statNum}>{requestRows.length}</p><p className={statLabel}>طلبات تعديل كورسات</p></div>
                <div className={`rounded-2xl border p-4 ${isCloudSynced ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                  <p className={`text-sm font-black ${isCloudSynced ? 'text-emerald-700' : 'text-rose-600'}`}>{isCloudSynced ? '🟢 متصل' : '🔴 غير متصل'}</p>
                  <p className={statLabel}>حالة الاتصال بالسحابة</p>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-black text-ink">آخر الطلاب المسجلين</h3>
                {registeredStudents.length === 0 ? (
                  <p className={emptyBox}>لا يوجد طلاب مسجلون بعد</p>
                ) : (
                  <div className="space-y-1.5">
                    {registeredStudents.slice(0, 5).map((s, i) => (
                      <div key={s.email || i} onClick={() => setDetails(s)} className="flex cursor-pointer flex-wrap items-center justify-between gap-2 rounded-xl bg-aqua-light/30 px-3 py-2 text-xs hover:bg-aqua-light/60">
                        <span className="font-bold text-ink">{s.fullName || 'بدون اسم'}</span>
                        <span className="text-ink/60">{s.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* منطقة الخطر */}
              <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4">
                <h3 className="mb-1 flex items-center gap-2 text-sm font-black text-rose-600">⚠️ منطقة الخطر</h3>
                <p className="mb-4 text-[11px] text-rose-500">هذه الإجراءات نهائية ولا يمكن التراجع عنها. سيتم الحذف من قاعدة البيانات السحابية أيضًا.</p>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button type="button" onClick={() => { setDangerAction('students'); setDangerConfirmText(''); setDangerMessage(''); }} disabled={!onDeleteAllStudents || registeredStudents.length === 0} className={dangerBtn}>
                    🗑️ حذف كل الطلاب ({registeredStudents.length})
                  </button>
                  <button type="button" onClick={() => { setDangerAction('instructors'); setDangerConfirmText(''); setDangerMessage(''); }} disabled={!onDeleteAllInstructors || registeredInstructors.length === 0} className={dangerBtn}>
                    🗑️ حذف كل المحاضرين ({registeredInstructors.length})
                  </button>
                  <button type="button" onClick={() => { setDangerAction('requests'); setDangerConfirmText(''); setDangerMessage(''); }} disabled={!onClearAllPendingRequests || (pendingStudentRows.length + pendingInstructorRows.length === 0)} className={dangerBtn}>
                    🗑️ مسح كل الطلبات المعلقة
                  </button>
                </div>

                {dangerMessage && <div className="mt-3 rounded-xl bg-white p-3 text-xs font-bold text-emerald-700">{dangerMessage}</div>}

                {dangerAction && (
                  <div className="mt-4 rounded-xl border-2 border-rose-400 bg-white p-4">
                    <p className="mb-2 text-xs font-black text-rose-600">
                      هل أنت متأكد؟ هذا الإجراء سيحذف{' '}
                      {dangerAction === 'students' ? 'جميع حسابات الطلاب' : dangerAction === 'instructors' ? 'جميع حسابات المحاضرين' : 'جميع الطلبات المعلقة'}{' '}
                      نهائيًا.
                    </p>
                    <p className="mb-2 text-[11px] text-ink/60">اكتب كلمة <b>"حذف"</b> بالأسفل للتأكيد:</p>
                    <input
                      autoFocus
                      type="text"
                      value={dangerConfirmText}
                      onChange={(e) => setDangerConfirmText(e.target.value)}
                      placeholder="اكتب: حذف"
                      className="mb-3 w-full rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-ink outline-none focus:border-rose-500"
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={executeDangerAction} disabled={dangerConfirmText.trim() !== 'حذف' || isDangerLoading} className="flex-1 cursor-pointer rounded-xl bg-rose-600 py-2.5 text-xs font-black text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50">
                        {isDangerLoading ? 'جارٍ الحذف...' : 'تأكيد الحذف النهائي'}
                      </button>
                      <button type="button" onClick={() => { setDangerAction(null); setDangerConfirmText(''); }} className="cursor-pointer rounded-xl bg-aqua-light/60 px-4 py-2.5 text-xs font-bold text-ink hover:bg-aqua-light">
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* الموافقات */}
          {tab === 'approvals' && (
            <section className="space-y-6">
              <div>
                <h3 className="mb-2 text-sm font-black text-aqua-dark">طلبات محاضرين تنتظر الموافقة ({pendingInstructorRows.length})</h3>
                {pendingInstructorRows.length === 0 ? (
                  <p className={emptyBox}>لا توجد طلبات محاضرين معلقة</p>
                ) : (
                  <div className="space-y-2">
                    {pendingInstructorRows.map((instructor, index) => (
                      <div key={instructor.email || index} onClick={() => setDetails(instructor)} className={pendingCard}>
                        <div>
                          <b className="text-sm">{instructor.fullName || 'بدون اسم'}</b>
                          <p className="text-xs text-ink/60">{instructor.email}</p>
                          {instructor.specialization && <p className="text-[11px] text-ink/50">{instructor.specialization}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={(e) => action(e, () => onApproveInstructor?.(instructor.email))} className={approveBtn}>موافقة</button>
                          <button type="button" onClick={(e) => action(e, () => onRejectInstructor?.(instructor.email))} className={rejectBtn}>رفض</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-black text-aqua-dark">طلبات طلاب تنتظر الموافقة ({pendingStudentRows.length})</h3>
                {pendingStudentRows.length === 0 ? (
                  <p className={emptyBox}>لا توجد طلبات طلاب معلقة</p>
                ) : (
                  <div className="space-y-2">
                    {pendingStudentRows.map((student, index) => (
                      <div key={student.email || index} onClick={() => setDetails(student)} className={pendingCard}>
                        <div>
                          <b className="text-sm">{student.fullName || 'بدون اسم'}</b>
                          <p className="text-xs text-ink/60">{student.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={(e) => action(e, () => onApproveStudent?.(student.email))} className={approveBtn}>موافقة</button>
                          <button type="button" onClick={(e) => action(e, () => onRejectStudent?.(student.email))} className={rejectBtn}>رفض</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {tab !== 'requests' && tab !== 'overview' && tab !== 'approvals' && (
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === 'students' ? 'بحث عن طالب...' : tab === 'instructors' ? 'بحث عن محاضر...' : 'بحث عن كورس...'}
              className={`${inputCls} mb-4 rounded-2xl`}
            />
          )}

          {/* الطلاب */}
          {tab === 'students' && (
            <section className="space-y-4">
              {pendingStudentRows.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-aqua-dark">طلبات طلاب معلقة ({pendingStudentRows.length})</h3>
                  {pendingStudentRows.map((student, index) => (
                    <div key={student.email || index} onClick={() => setDetails(student)} className={pendingCard}>
                      <div>
                        <b className="text-sm">{student.fullName || 'بدون اسم'}</b>
                        <p className="text-xs text-ink/60">{student.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={(e) => action(e, () => onApproveStudent?.(student.email))} className={approveBtn}>موافقة</button>
                        <button type="button" onClick={(e) => action(e, () => onRejectStudent?.(student.email))} className={rejectBtn}>رفض</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {students.length === 0 ? (
                <p className="py-10 text-center text-sm text-ink/50">لا يوجد طلاب</p>
              ) : (
                students.map((student, index) => (
                  <div key={student.email || index} onClick={() => openDetails(student, () => onViewStudentDetails?.(student))} className={rowCard}>
                    <div className="min-w-0">
                      <b className="text-sm text-ink">{student.fullName || 'بدون اسم'}</b>
                      <p className="truncate text-xs text-ink/60">{student.email}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" title="الشهادات" onClick={(e) => action(e, () => onViewStudentCertificates?.(student))} className="cursor-pointer rounded-xl px-2 py-1 text-aqua-dark">🎖️</button>
                      <button type="button" title="حذف" onClick={(e) => action(e, () => onDeleteStudent?.(student.email))} className="cursor-pointer rounded-xl px-2 py-1 text-rose-500">🗑️</button>
                    </div>
                  </div>
                ))
              )}
            </section>
          )}

          {/* المحاضرون */}
          {tab === 'instructors' && (
            <section className="space-y-4">
              {pendingInstructorRows.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-aqua-dark">طلبات محاضرين معلقة ({pendingInstructorRows.length})</h3>
                  {pendingInstructorRows.map((instructor, index) => (
                    <div key={instructor.email || index} onClick={() => setDetails(instructor)} className={pendingCard}>
                      <div>
                        <b className="text-sm">{instructor.fullName || 'بدون اسم'}</b>
                        <p className="text-xs text-ink/60">{instructor.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={(e) => action(e, () => onApproveInstructor?.(instructor.email))} className={approveBtn}>موافقة</button>
                        <button type="button" onClick={(e) => action(e, () => onRejectInstructor?.(instructor.email))} className={rejectBtn}>رفض</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {instructors.length === 0 ? (
                <p className="py-10 text-center text-sm text-ink/50">لا يوجد محاضرون</p>
              ) : (
                instructors.map((instructor, index) => (
                  <div key={instructor.email || index} onClick={() => setDetails(instructor)} className={rowCard}>
                    <div className="min-w-0">
                      <b className="text-sm text-ink">{instructor.fullName || 'بدون اسم'}</b>
                      <p className="truncate text-xs text-ink/60">{instructor.email}</p>
                    </div>
                    <button type="button" title="حذف" onClick={(e) => action(e, () => onDeleteInstructor?.(instructor.email))} className="cursor-pointer rounded-xl px-2 py-1 text-rose-500">🗑️</button>
                  </div>
                ))
              )}
            </section>
          )}

          {/* الكورسات */}
          {tab === 'courses' && (
            <section>
              {courseList.length === 0 ? (
                <p className="py-10 text-center text-sm text-ink/50">لا توجد كورسات</p>
              ) : (
                courseList.map((course, index) => (
                  <div key={course.id || index} onClick={() => setDetails(course)} className={rowCard}>
                    <div className="min-w-0">
                      <b className="text-sm text-ink">{course.title || 'بدون عنوان'}</b>
                      <p className="text-xs text-ink/60">{course.category || 'عام'}</p>
                    </div>
                    <button type="button" title="حذف" onClick={(e) => action(e, () => onDeleteCourse?.(course.id))} className="cursor-pointer rounded-xl px-2 py-1 text-rose-500">🗑️</button>
                  </div>
                ))
              )}
            </section>
          )}

          {/* طلبات التعديل */}
          {tab === 'requests' && (
            <section className="space-y-2">
              {requestRows.length === 0 ? (
                <p className="py-10 text-center text-sm text-ink/50">لا توجد طلبات تعديل</p>
              ) : (
                requestRows.map((request, index) => (
                  <div key={request.id || index} onClick={() => setDetails(request)} className="cursor-pointer rounded-2xl border border-aqua-mid bg-white p-4 hover:border-aqua-dark hover:bg-aqua-light/30">
                    <b className="text-sm text-ink">{request.courseTitle || 'كورس بدون عنوان'}</b>
                    <p className="text-xs text-ink/60">{request.instructorName || ''}</p>
                  </div>
                ))
              )}
            </section>
          )}
        </main>
      </div>

      {/* نافذة البيانات الكاملة */}
      {details && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setDetails(null)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-aqua-mid bg-white p-5 text-ink shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black">البيانات الكاملة</h2>
              <button type="button" onClick={() => setDetails(null)} className="cursor-pointer rounded-xl bg-aqua-light/60 px-3 py-1 text-ink/70 hover:bg-aqua-light">إغلاق</button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {safeEntries(details).map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-aqua-mid bg-aqua-light/20 p-3">
                  <span className="block text-[10px] text-ink/50">{labelFor(key)}</span>
                  <span className="mt-1 block break-words text-sm font-bold text-ink">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformOwnerAdminModal;