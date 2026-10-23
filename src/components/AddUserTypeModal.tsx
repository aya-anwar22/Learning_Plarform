import React from 'react';
import { X, GraduationCap, Award, UserPlus, ArrowLeft } from 'lucide-react';

interface AddUserTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudent: () => void;
  onSelectInstructor: () => void;
}

export const AddUserTypeModal: React.FC<AddUserTypeModalProps> = ({
  isOpen,
  onClose,
  onSelectStudent,
  onSelectInstructor,
}) => {
  if (!isOpen) return null;

  const selectStudent = () => {
    onClose();
    onSelectStudent();
  };

  const selectInstructor = () => {
    onClose();
    onSelectInstructor();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-full items-center justify-center overflow-y-auto bg-gradient-to-br from-[#E3F1F3] via-white to-[#C6E2E6] p-4 font-arabic"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-account-title"
      onMouseDown={onClose}
    >
      <div
        className="my-auto flex max-h-[90vh] min-h-0 w-full max-w-md flex-col overflow-hidden rounded-3xl border border-aqua-mid bg-white shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="relative shrink-0 bg-aqua-light p-5 text-ink sm:p-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute left-3.5 top-3.5 cursor-pointer rounded-full bg-white/70 p-2 text-ink transition-colors hover:bg-white sm:left-4 sm:top-4"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 pl-10">
            <div className="shrink-0 rounded-xl bg-white p-3 text-aqua-dark">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h2 id="add-account-title" className="text-lg font-black sm:text-xl">
                إضافة حساب جديد
              </h2>
              <p className="mt-1 text-xs font-medium text-ink/70">
                اختر نوع الحساب الذي ترغب في تسجيله
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <p className="mb-4 text-center text-sm font-semibold text-ink">
            هل أنت طالب أم محاضر؟
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={selectStudent}
              className="group flex cursor-pointer flex-col items-center rounded-2xl border-2 border-aqua-mid bg-aqua-light/30 p-5 text-center transition-all hover:bg-aqua-light/60 hover:shadow-md"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-aqua-dark text-white shadow-sm">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-ink">حساب طالب</h3>
              <p className="mt-1 text-xs text-ink/60">حضور الكورسات والتعلم وحفظ التقدم</p>
              <span className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-aqua-dark py-2 text-xs font-bold text-white transition-colors group-hover:bg-ink">
                سجل كطالب
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
              </span>
            </button>

            <button
              type="button"
              onClick={selectInstructor}
              className="group flex cursor-pointer flex-col items-center rounded-2xl border-2 border-aqua-mid bg-aqua-light/30 p-5 text-center transition-all hover:bg-aqua-light/60 hover:shadow-md"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-aqua-dark text-white shadow-sm">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-ink">حساب محاضر</h3>
              <p className="mt-1 text-xs text-ink/60">إنشاء وإدارة وتحديث الكورسات للطلاب</p>
              <span className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-aqua-dark py-2 text-xs font-bold text-white transition-colors group-hover:bg-ink">
                سجل كمحاضر
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 block w-full cursor-pointer text-center text-xs text-ink/60 underline hover:text-ink"
          >
            إلغاء الأمر
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserTypeModal;