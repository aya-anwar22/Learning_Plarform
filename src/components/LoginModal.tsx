import React, { useState } from 'react';
import { X, LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { StudentProfile, InstructorProfile } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  registeredStudents?: StudentProfile[];
  onLoginSuccess: (student: StudentProfile) => void;
  onInstructorLoginSuccess?: (instructor: InstructorProfile) => void;
}

const profileId = (email: string) => encodeURIComponent(email.trim().toLowerCase());

const inputClass =
  'h-11 w-full rounded-xl border border-aqua-mid bg-white pr-10 pl-3 text-sm text-ink placeholder:text-ink/40 outline-none transition focus:border-aqua-dark focus:ring-2 focus:ring-aqua/40';

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onInstructorLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const resetState = () => {
    setError('');
    setMessage('');
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    resetState();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password);
      const id = profileId(cleanEmail);
      const [studentSnap, instructorSnap, pendingInstructorSnap] = await Promise.all([
        getDoc(doc(db, 'students', id)),
        getDoc(doc(db, 'instructors', id)),
        getDoc(doc(db, 'pendingInstructors', id)),
      ]);

      if (instructorSnap.exists()) {
        const instructor = instructorSnap.data() as InstructorProfile;
        if (instructor.isApproved === false || instructor.status === 'pending') {
          await signOut(auth);
          setError('الحساب ما زال في انتظار موافقة المسؤول.');
          return;
        }
        onInstructorLoginSuccess?.({ ...instructor, email: cleanEmail });
        onClose();
        return;
      }

      if (pendingInstructorSnap.exists()) {
        await signOut(auth);
        setError('تم تسجيل الحساب، لكنه ما زال في انتظار موافقة المسؤول.');
        return;
      }

      if (studentSnap.exists()) {
        onLoginSuccess({ ...(studentSnap.data() as StudentProfile), email: cleanEmail });
        onClose();
        return;
      }

      await signOut(auth);
      setError('الإيميل وكلمة المرور صحيحان، لكن ملف الحساب غير موجود في قاعدة البيانات.');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else if (code === 'auth/network-request-failed') {
        setError('تعذر الاتصال بـ Firebase. افحص الإنترنت وحاول مرة أخرى.');
      } else if (code === 'auth/too-many-requests') {
        setError('تمت محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.');
      } else {
        console.error('Login error:', err);
        setError(`تعذر تسجيل الدخول (${code || 'Firebase error'}).`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    resetState();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('اكتب البريد الإلكتروني أولًا.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setMessage('تم إرسال رابط إعادة تعيين كلمة المرور. راجع Inbox وSpam.');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setError('هذا البريد غير موجود في Firebase Authentication.');
      } else if (code === 'auth/invalid-email') {
        setError('صيغة البريد الإلكتروني غير صحيحة.');
      } else if (code === 'auth/network-request-failed') {
        setError('تعذر الاتصال بـ Firebase. افحص الإنترنت.');
      } else {
        console.error('Password reset error:', err);
        setError(`تعذر إرسال الرسالة (${code || 'Firebase error'}).`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gradient-to-br from-[#E3F1F3] via-white to-[#C6E2E6] p-4 font-arabic" dir="rtl">
      <div className="relative my-8 w-full max-w-md rounded-3xl border border-aqua-mid bg-white p-5 text-ink shadow-xl sm:p-7">
        <button type="button" onClick={onClose} className="absolute left-4 top-4 cursor-pointer rounded-xl bg-aqua-light/60 p-2 text-ink/70 transition hover:bg-aqua-light hover:text-ink" aria-label="إغلاق">
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 flex items-center gap-3 pl-10">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-aqua-light text-aqua-dark">
            <LogIn className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-ink">{mode === 'login' ? 'تسجيل الدخول' : 'إعادة تعيين كلمة المرور'}</h3>
            <p className="text-xs text-ink/60">للطالب أو المحاضر</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {message && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">{message}</div>}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block text-xs font-bold text-ink">
              البريد الإلكتروني *
              <span className="relative mt-1.5 block">
                <Mail className="absolute right-3 top-3.5 h-4 w-4 text-aqua-dark" />
                <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
              </span>
            </label>
            <label className="block text-xs font-bold text-ink">
              كلمة المرور *
              <span className="relative mt-1.5 block">
                <Lock className="absolute right-3 top-3.5 h-4 w-4 text-aqua-dark" />
                <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
              </span>
            </label>
            <button disabled={loading} className="h-12 w-full cursor-pointer rounded-xl bg-aqua-dark text-sm font-black text-white transition hover:bg-ink active:scale-95 disabled:opacity-60">
              {loading ? 'جارٍ الدخول...' : 'دخول الآن'}
            </button>
            <button type="button" onClick={() => { resetState(); setMode('reset'); }} className="w-full cursor-pointer text-xs font-bold text-aqua-dark hover:underline">
              نسيت كلمة المرور؟
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <label className="block text-xs font-bold text-ink">
              اكتب الإيميل المسجل *
              <span className="relative mt-1.5 block">
                <Mail className="absolute right-3 top-3.5 h-4 w-4 text-aqua-dark" />
                <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
              </span>
            </label>
            <button disabled={loading} className="h-12 w-full cursor-pointer rounded-xl bg-aqua-dark text-sm font-black text-white transition hover:bg-ink active:scale-95 disabled:opacity-60">
              {loading ? 'جارٍ الإرسال...' : 'إرسال رابط إعادة التعيين'}
            </button>
            <button type="button" onClick={() => { resetState(); setMode('login'); }} className="w-full cursor-pointer text-xs font-bold text-ink/60 hover:text-ink hover:underline">
              العودة لتسجيل الدخول
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginModal;