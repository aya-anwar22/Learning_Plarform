import React, { useRef, useState } from 'react';
import { Award, X, Lock, BookOpen, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { createUserWithEmailAndPassword, signOut, deleteUser } from 'firebase/auth';
import { auth } from '../firebase';
import { InstructorProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  instructorProfile?: InstructorProfile | null;
  onSaveProfile: (profile: InstructorProfile, password: string) => Promise<{ isPending: boolean }> | { isPending: boolean };
  onLogout?: () => void;
  isInitialRequired?: boolean;
}

const SPECIALIZATION_OPTIONS: { group: string; options: string[] }[] = [
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
      'المحاسبة والتمويل',
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
    group: 'الهندسة والعلوم',
    options: [
      'الهندسة الميكانيكية',
      'الهندسة الكهربائية',
      'الهندسة المدنية',
      'الرياضيات',
      'الفيزياء',
      'الكيمياء',
    ],
  },
  {
    group: 'اللغات والتعليم',
    options: [
      'تعليم اللغة الإنجليزية',
      'تعليم لغات أجنبية أخرى',
      'اللغة العربية وعلومها',
      'التنمية الذاتية والمهارات الشخصية',
      'إعداد المعلمين والتدريب',
    ],
  },
  {
    group: 'الطب والعلوم الصحية',
    options: [
      'الطب البشري',
      'طب الأسنان',
      'الصيدلة',
      'التمريض',
      'العلاج الطبيعي',
      'التغذية العلاجية',
    ],
  },
  {
    group: 'أخرى',
    options: ['تخصص آخر غير مذكور'],
  },
];

const OTHER_SPECIALIZATION_VALUE = 'تخصص آخر غير مذكور';

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-aqua-mid bg-white p-3 text-sm text-ink placeholder:text-ink/40 outline-none transition focus:border-aqua-dark focus:ring-2 focus:ring-aqua/40';

const overlay =
  'fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gradient-to-br from-[#E3F1F3] via-white to-[#C6E2E6] p-4 font-arabic';

export const InstructorRegistrationModal: React.FC<Props> = ({ isOpen, onClose, onSaveProfile }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [customSpecialization, setCustomSpecialization] = useState('');
  const [bio, setBio] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const specializationRef = useRef<HTMLSelectElement>(null);
  const customSpecializationRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (cleanName.length < 3) return setError('اكتب الاسم الكامل.');
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError('اكتب بريدًا إلكترونيًا صحيحًا.');
    if (phone.trim().length < 8) return setError('اكتب رقم هاتف صحيح.');

    if (!specialization) {
      specializationRef.current?.focus();
      return setError('اختر التخصص.');
    }
    const cleanCustomSpecialization = customSpecialization.trim();
    if (specialization === OTHER_SPECIALIZATION_VALUE && cleanCustomSpecialization.length < 3) {
      customSpecializationRef.current?.focus();
      return setError('اكتب التخصص المطلوب بوضوح.');
    }
    const finalSpecialization = specialization === OTHER_SPECIALIZATION_VALUE ? cleanCustomSpecialization : specialization;

    if (password.length < 6) return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
    if (password !== confirmPassword) return setError('كلمتا المرور غير متطابقتين.');

    setSaving(true);

    let createdUser: import('firebase/auth').User | null = null;

    try {
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      createdUser = credential.user;

      const profile: InstructorProfile = {
        fullName: cleanName,
        email: cleanEmail,
        phone: phone.trim(),
        specialization: finalSpecialization,
        bio: bio.trim() || 'محاضر في المنصة.',
        registeredAt: new Date().toISOString(),
        status: 'pending',
        isApproved: false,
      };
      await onSaveProfile(profile, password);
      await signOut(auth);
      setSuccess(true);
    } catch (err: any) {
      console.error('Instructor registration error:', err);

      if (createdUser) {
        try {
          await deleteUser(createdUser);
        } catch (cleanupErr) {
          console.error('Failed to clean up orphaned instructor auth account:', cleanupErr);
        }
      }

      if (err?.code === 'auth/email-already-in-use') setError('هذا البريد مسجل بالفعل في Firebase. استخدم بريدًا آخر.');
      else if (err?.code === 'auth/weak-password') setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      else if (err?.code === 'auth/network-request-failed') setError('تعذر الاتصال بـ Firebase. افحص الإنترنت.');
      else setError('لم يتم حفظ الطلب. لم يتم إغلاق النموذج؛ راجع الاتصال وحاول مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className={overlay} dir="rtl">
        <div className="w-full max-w-md rounded-3xl border border-aqua-mid bg-white p-7 text-center text-ink shadow-xl">
          <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-aqua-dark" />
          <h2 className="text-xl font-black">تم إرسال طلبك</h2>
          <p className="mt-2 text-sm text-ink/70">حساب المحاضر في انتظار موافقة المسؤول.</p>
          <button type="button" onClick={onClose} className="mt-6 w-full cursor-pointer rounded-xl bg-aqua-dark py-3 font-bold text-white transition hover:bg-ink active:scale-95">
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
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black">تسجيل محاضر جديد</h2>
              <p className="text-xs text-ink/60">سيتم إرسال الطلب للمسؤول للموافقة</p>
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
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={fieldClass} />
          </label>

          <label className="text-xs font-bold text-ink">
            البريد الإلكتروني
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
          </label>

          <label className="text-xs font-bold text-ink">
            الهاتف
            <input required value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} />
          </label>

          <label className="text-xs font-bold text-ink">
            التخصص
            <div className="relative">
              <BookOpen className="pointer-events-none absolute right-3 top-[1.15rem] h-4 w-4 text-aqua-dark" />
              <select
                ref={specializationRef}
                required
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className={`${fieldClass} cursor-pointer appearance-none pr-10`}
              >
                <option value="" disabled>اختر تخصصك...</option>
                {SPECIALIZATION_OPTIONS.map((group) => (
                  <optgroup key={group.group} label={group.group}>
                    {group.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {specialization === OTHER_SPECIALIZATION_VALUE && (
              <input
                ref={customSpecializationRef}
                autoFocus
                required
                value={customSpecialization}
                onChange={(e) => setCustomSpecialization(e.target.value)}
                placeholder="اكتب تخصصك..."
                className={`${fieldClass} mt-2`}
              />
            )}
          </label>

          <label className="text-xs font-bold text-ink sm:col-span-2">
            نبذة مختصرة
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} className={`${fieldClass} min-h-20`} />
          </label>

          <label className="text-xs font-bold text-ink">
            كلمة المرور
            <div className="relative">
              <Lock className="absolute right-3 top-[1.15rem] h-4 w-4 text-aqua-dark" />
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${fieldClass} pr-10 pl-10`}
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
            <input
              required
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={fieldClass}
            />
          </label>
        </fieldset>

        <button
          disabled={saving}
          className="mt-5 w-full cursor-pointer rounded-xl bg-aqua-dark py-3 font-black text-white transition hover:bg-ink active:scale-95 disabled:opacity-60"
        >
          {saving ? 'جارٍ حفظ الطلب...' : 'إرسال طلب التسجيل'}
        </button>
      </form>
    </div>
  );
};

export default InstructorRegistrationModal;