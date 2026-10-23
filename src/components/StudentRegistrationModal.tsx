import React, { useRef, useState } from 'react';
import { X, UserPlus, Mail, Lock, Phone, AlertCircle, CheckCircle2, Target, Eye, EyeOff, Globe } from 'lucide-react';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { auth } from '../firebase';
import { StudentProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  studentProfile?: StudentProfile | null;
  onSaveProfile: (profile: StudentProfile) => void | Promise<void>;
  onLogout?: () => void;
}

const COUNTRY_OPTIONS: { group: string; options: string[] }[] = [
  {
    group: 'الدول العربية',
    options: [
      'مصر', 'السعودية', 'الإمارات', 'الكويت', 'قطر', 'البحرين', 'عمان',
      'الأردن', 'العراق', 'سوريا', 'لبنان', 'فلسطين', 'اليمن',
      'ليبيا', 'تونس', 'الجزائر', 'المغرب', 'السودان', 'موريتانيا',
      'الصومال', 'جيبوتي', 'جزر القمر',
    ],
  },
  {
    group: 'دول أخرى',
    options: [
      'الولايات المتحدة', 'كندا', 'المملكة المتحدة', 'ألمانيا', 'فرنسا',
      'إيطاليا', 'إسبانيا', 'هولندا', 'السويد', 'النرويج', 'سويسرا',
      'تركيا', 'ماليزيا', 'إندونيسيا', 'الهند', 'باكستان', 'الصين',
      'اليابان', 'كوريا الجنوبية', 'أستراليا', 'جنوب أفريقيا', 'نيجيريا',
      'دولة أخرى غير مذكورة',
    ],
  },
];

const GOAL_OPTIONS: { group: string; options: string[] }[] = [
  {
    group: 'البرمجة وتطوير الويب',
    options: [
      'تطوير الويب الشامل (Full Stack Web Development)',
      'تطوير الواجهات الأمامية (Frontend Development)',
      'تطوير الواجهات الخلفية (Backend Development)',
      'تطوير تطبيقات الموبايل (Mobile Development)',
      'هندسة البرمجيات (Software Engineering)',
    ],
  },
  {
    group: 'الذكاء الاصطناعي والبيانات',
    options: [
      'الذكاء الاصطناعي (Artificial Intelligence)',
      'تعلم الآلة (Machine Learning)',
      'علم البيانات (Data Science)',
      'تحليل البيانات (Data Analysis)',
      'رؤية الحاسوب (Computer Vision)',
    ],
  },
  {
    group: 'التصميم والإبداع',
    options: [
      'تصميم واجهات المستخدم (UI/UX Design)',
      'الجرافيك ديزاين (Graphic Design)',
      'الموشن جرافيك (Motion Graphics)',
      'تصميم المنتجات (Product Design)',
      'التصوير والمونتاج',
    ],
  },
  {
    group: 'الأعمال والتسويق',
    options: [
      'التسويق الرقمي (Digital Marketing)',
      'ريادة الأعمال (Entrepreneurship)',
      'إدارة المشاريع (Project Management)',
      'المبيعات وخدمة العملاء',
      'إدارة الموارد البشرية',
    ],
  },
  {
    group: 'الأمن السيبراني والشبكات',
    options: [
      'الأمن السيبراني (Cybersecurity)',
      'إدارة الشبكات (Networking)',
      'إدارة أنظمة السحابة (Cloud Computing)',
      'اختبار الاختراق (Penetration Testing)',
    ],
  },
  {
    group: 'اللغات والتعليم',
    options: [
      'تعلم اللغة الإنجليزية',
      'تعلم لغات أجنبية أخرى',
      'التنمية الذاتية والمهارات الشخصية',
      'إعداد المعلمين والتدريب',
    ],
  },
  {
    group: 'أخرى',
    options: ['ما زلت أستكشف المجال المناسب لي', 'مجال آخر غير مذكور'],
  },
];

const OTHER_GOAL_VALUE = 'مجال آخر غير مذكور';

export const StudentRegistrationModal: React.FC<Props> = ({ isOpen, onClose, onSaveProfile }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('مصر');
  const [goal, setGoal] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef<HTMLSelectElement>(null);
  const goalRef = useRef<HTMLSelectElement>(null);
  const customGoalRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const fail = (message: string, field: string, ref: React.RefObject<HTMLInputElement | HTMLSelectElement>) => {
    setError(message);
    setFieldError(field);
    ref.current?.focus();
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const fieldClass = (field: string) =>
    `mt-1.5 w-full rounded-xl border bg-white p-3 text-sm text-ink placeholder:text-ink/40 focus:outline-none transition-all ${
      fieldError === field
        ? 'border-rose-500 ring-2 ring-rose-200'
        : 'border-aqua-mid focus:border-aqua-dark focus:ring-2 focus:ring-aqua/40'
    }`;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setFieldError('');

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanCountry = country.trim();

    const nameWords = cleanName.split(/\s+/).filter(Boolean);
    if (cleanName.length < 3 || nameWords.length < 2) {
      return fail('اكتب الاسم الكامل (اسم أول واسم تاني على الأقل).', 'fullName', fullNameRef);
    }
    if (!/^[A-Za-zأ-يءآأإئؤ\s]+$/.test(cleanName)) {
      return fail('الاسم يجب أن يحتوي على حروف فقط، بدون أرقام أو رموز.', 'fullName', fullNameRef);
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanEmail)) {
      return fail('اكتب بريدًا إلكترونيًا صحيحًا (مثال: name@example.com).', 'email', emailRef);
    }

    const phoneDigitsOnly = cleanPhone.replace(/\s|-/g, '');
    if (!/^[0-9+]+$/.test(phoneDigitsOnly) || phoneDigitsOnly.length < 8) {
      return fail('اكتب رقم هاتف صحيح (أرقام فقط).', 'phone', phoneRef);
    }
    if (cleanCountry === 'مصر' && !/^01[0125][0-9]{8}$/.test(phoneDigitsOnly)) {
      return fail('رقم الهاتف المصري يجب أن يكون 11 رقمًا ويبدأ بـ 010 أو 011 أو 012 أو 015.', 'phone', phoneRef);
    }

    if (!cleanCountry) {
      return fail('اختر الدولة.', 'country', countryRef);
    }

    if (!goal) {
      return fail('اختر هدفك أو مجالك.', 'goal', goalRef);
    }
    const cleanCustomGoal = customGoal.trim();
    if (goal === OTHER_GOAL_VALUE && cleanCustomGoal.length < 3) {
      return fail('اكتب اسم الكورس أو المجال اللي تقصده بوضوح.', 'customGoal', customGoalRef);
    }

    if (password.length < 6) {
      return fail('كلمة المرور يجب أن تكون 6 أحرف على الأقل.', 'password', passwordRef);
    }
    if (/\s/.test(password)) {
      return fail('كلمة المرور يجب ألا تحتوي على مسافات.', 'password', passwordRef);
    }
    if (password !== confirmPassword) {
      return fail('كلمتا المرور غير متطابقتين.', 'confirmPassword', confirmPasswordRef);
    }

    const finalGoal = goal === OTHER_GOAL_VALUE ? cleanCustomGoal : goal;
    setSaving(true);

    let createdUser: import('firebase/auth').User | null = null;

    try {
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      createdUser = credential.user;

      await onSaveProfile({
        fullName: cleanName,
        email: cleanEmail,
        phone: phoneDigitsOnly,
        country: cleanCountry || 'مصر',
        jobTitleOrGoal: finalGoal,
        status: 'approved',
        isApproved: true,
      });
      setSuccess(true);
    } catch (err: any) {
      console.error('Student registration error:', err);

      if (createdUser) {
        try {
          await deleteUser(createdUser);
        } catch (cleanupErr) {
          console.error('Failed to clean up orphaned auth account:', cleanupErr);
        }
      }

      if (err?.code === 'auth/email-already-in-use') return fail('هذا البريد مسجل بالفعل. استخدم بريدًا آخر أو سجّل الدخول.', 'email', emailRef);
      if (err?.code === 'auth/weak-password') return fail('كلمة المرور يجب أن تكون 6 أحرف على الأقل.', 'password', passwordRef);
      if (err?.code === 'auth/network-request-failed') setError('تعذر الاتصال بـ Firebase. افحص الإنترنت.');
      else setError('لم يتم حفظ الحساب. النموذج ما زال مفتوحًا، حاول مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  const overlay = 'fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gradient-to-br from-[#E3F1F3] via-white to-[#C6E2E6] p-4 font-arabic';

  if (success) {
    return (
      <div className={overlay} dir="rtl">
        <div className="w-full max-w-md rounded-3xl border border-aqua-mid bg-white p-7 text-center text-ink shadow-xl">
          <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-aqua-dark" />
          <h2 className="text-xl font-black">تم إنشاء الحساب</h2>
          <p className="mt-2 text-sm text-ink/70">يمكنك الآن استخدام البريد وكلمة المرور لتسجيل الدخول.</p>
          <button type="button" onClick={onClose} className="mt-6 w-full cursor-pointer rounded-xl bg-aqua-dark py-3 font-black text-white transition hover:bg-ink active:scale-95">
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={overlay} dir="rtl">
      <form onSubmit={submit} className="my-8 w-full max-w-lg rounded-3xl border border-aqua-mid bg-white p-5 text-ink shadow-xl sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-aqua-light text-aqua-dark">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black">تسجيل طالب جديد</h2>
              <p className="text-xs text-ink/60">أنشئ حسابك للتعلم ومتابعة تقدمك</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer rounded-xl bg-aqua-light/60 p-2 text-ink/70 transition hover:bg-aqua-light hover:text-ink" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <fieldset disabled={saving} className="grid gap-3 disabled:opacity-70 sm:grid-cols-2">
          <label className="text-xs font-bold text-ink">
            الاسم الكامل
            <input
              ref={fullNameRef}
              required
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); if (fieldError === 'fullName') setFieldError(''); }}
              className={fieldClass('fullName')}
            />
          </label>

          <label className="text-xs font-bold text-ink">
            البريد الإلكتروني
            <div className="relative">
              <Mail className="absolute right-3 top-[1.15rem] h-4 w-4 text-aqua-dark" />
              <input
                ref={emailRef}
                required
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (fieldError === 'email') setFieldError(''); }}
                className={`${fieldClass('email')} pr-10`}
              />
            </div>
          </label>

          <label className="text-xs font-bold text-ink">
            الهاتف
            <div className="relative">
              <Phone className="absolute right-3 top-[1.15rem] h-4 w-4 text-aqua-dark" />
              <input
                ref={phoneRef}
                value={phone}
                onChange={(e) => { setPhone(e.target.value); if (fieldError === 'phone') setFieldError(''); }}
                placeholder="01xxxxxxxxx"
                className={`${fieldClass('phone')} pr-10`}
              />
            </div>
          </label>

          <label className="text-xs font-bold text-ink">
            الدولة
            <div className="relative">
              <Globe className="pointer-events-none absolute right-3 top-[1.15rem] h-4 w-4 text-aqua-dark" />
              <select
                ref={countryRef}
                required
                value={country}
                onChange={(e) => { setCountry(e.target.value); if (fieldError === 'country') setFieldError(''); }}
                className={`${fieldClass('country')} cursor-pointer appearance-none pr-10`}
              >
                <option value="" disabled>اختر دولتك...</option>
                {COUNTRY_OPTIONS.map((group) => (
                  <optgroup key={group.group} label={group.group}>
                    {group.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </label>

          <label className="text-xs font-bold text-ink sm:col-span-2">
            هدفك أو مجالك
            <div className="relative">
              <Target className="pointer-events-none absolute right-3 top-[1.15rem] h-4 w-4 text-aqua-dark" />
              <select
                ref={goalRef}
                required
                value={goal}
                onChange={(e) => { setGoal(e.target.value); if (fieldError === 'goal') setFieldError(''); }}
                className={`${fieldClass('goal')} cursor-pointer appearance-none pr-10`}
              >
                <option value="" disabled>اختر مجالك أو هدفك التعليمي...</option>
                {GOAL_OPTIONS.map((group) => (
                  <optgroup key={group.group} label={group.group}>
                    {group.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {goal === OTHER_GOAL_VALUE && (
              <input
                ref={customGoalRef}
                autoFocus
                required
                value={customGoal}
                onChange={(e) => { setCustomGoal(e.target.value); if (fieldError === 'customGoal') setFieldError(''); }}
                placeholder="اكتب الكورس أو المجال اللي تقصده..."
                className={`${fieldClass('customGoal')} mt-2`}
              />
            )}
          </label>

          <label className="text-xs font-bold text-ink">
            كلمة المرور
            <div className="relative">
              <Lock className="absolute right-3 top-[1.15rem] h-4 w-4 text-aqua-dark" />
              <input
                ref={passwordRef}
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (fieldError === 'password') setFieldError(''); }}
                className={`${fieldClass('password')} pr-10 pl-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                className="absolute left-3 top-[1.15rem] cursor-pointer text-ink/50 hover:text-ink"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <label className="text-xs font-bold text-ink">
            تأكيد كلمة المرور
            <div className="relative">
              <input
                ref={confirmPasswordRef}
                required
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (fieldError === 'confirmPassword') setFieldError(''); }}
                className={`${fieldClass('confirmPassword')} pl-10`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                tabIndex={-1}
                className="absolute left-3 top-[1.15rem] cursor-pointer text-ink/50 hover:text-ink"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
        </fieldset>

        <button
          disabled={saving}
          className="mt-5 w-full cursor-pointer rounded-xl bg-aqua-dark py-3 font-black text-white transition-all hover:bg-ink active:scale-95 disabled:opacity-60"
        >
          {saving ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}
        </button>
      </form>
    </div>
  );
};

export default StudentRegistrationModal;