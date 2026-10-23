import React from 'react';
import { Sparkles, BookOpen } from 'lucide-react';

interface HeroBannerProps {
  onOpenAiGenerator?: () => void;
  onOpenAiTutor?: () => void;
  onExploreCourses?: () => void;
  onExplore?: () => void;
  coursesCount?: number;
  studentsCount?: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOpenAiGenerator,
  onOpenAiTutor,
  onExploreCourses,
  onExplore,
  coursesCount = 0,
  studentsCount = 0
}) => {
  const handleAi = onOpenAiGenerator || onOpenAiTutor;
  const handleExplore = onExploreCourses || onExplore;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-5 sm:pb-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-aqua-light via-white to-lime text-ink py-8 sm:py-12 rounded-3xl border border-aqua-mid shadow-sm">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-56 sm:w-80 h-56 sm:h-80 bg-aqua/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-56 sm:w-80 h-56 sm:h-80 bg-aqua-mid/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-8 text-center space-y-4 sm:space-y-5">

          {/* Tagline */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-aqua-mid text-aqua-dark text-[11px] sm:text-xs font-semibold max-w-full">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="leading-snug">منصة التعليم المستقبلي المدعومة بنماذج الذكاء الاصطناعي التوليدية</span>
          </div>

          {/* Title: كل سطر بلون واحد */}
          <h1 className="text-2xl min-[400px]:text-[28px] sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-snug sm:leading-tight font-arabic text-ink">
            تعلّم المهارات الحقيقية
            <span className="block text-aqua-dark mt-1 sm:mt-2">
              أو أنشئ دوراتك الكاملة في ثوانٍ
            </span>
          </h1>

          {/* Description */}
          <p className="text-ink/75 text-sm sm:text-base max-w-2xl mx-auto font-medium leading-relaxed">
            انضم إلى آلاف الطلاب والمعلمين واستمتع بتجربة تعلم فريدة تحتوي على مسارات تفاعلية، شروحات ذكية، اختبارات تقييمية، وشهادات معتمدة.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-1">
            <button
              onClick={handleAi}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-aqua-dark hover:bg-ink text-white font-extrabold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>أنشئ دورة تدريبية بالذكاء الاصطناعي</span>
            </button>

            <button
              onClick={handleExplore}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white hover:bg-aqua-light border border-aqua-mid text-ink font-bold text-sm transition-all active:scale-95 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-aqua-dark shrink-0" />
              <span>استعرض جميع الدورات المتاحة</span>
            </button>
          </div>

          {/* Highlights */}
          <div className="pt-5 sm:pt-6 mt-1 grid grid-cols-2 lg:grid-cols-4 gap-3 border-t border-aqua-mid max-w-3xl mx-auto">
            <div className="p-3 sm:p-4 rounded-2xl bg-white border border-aqua-mid">
              <div className="text-xl sm:text-2xl font-extrabold text-aqua-dark font-mono">+{coursesCount + 15}</div>
              <div className="text-[11px] text-ink/70 mt-1 font-medium">دورة تعليمية وتخصص</div>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-white border border-aqua-mid">
              <div className="text-xl sm:text-2xl font-extrabold text-aqua-dark font-mono">+{studentsCount + 4800}</div>
              <div className="text-[11px] text-ink/70 mt-1 font-medium">طالب ومتعلم</div>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-white border border-aqua-mid">
              <div className="text-xl sm:text-2xl font-extrabold text-aqua-dark font-mono">24/7</div>
              <div className="text-[11px] text-ink/70 mt-1 font-medium">معلم AI شخصي</div>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-white border border-aqua-mid">
              <div className="text-xl sm:text-2xl font-extrabold text-aqua-dark font-mono">100%</div>
              <div className="text-[11px] text-ink/70 mt-1 font-medium">شهادات إنجاز معتمدة</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};