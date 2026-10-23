import React, { useState } from 'react';
import { Sparkles, Filter, BookOpen, ChevronDown } from 'lucide-react';
import { Course, CategoryType, UserProgress } from '../types';
import { CourseCard } from './CourseCard';
import { getCourseSearchScore } from '../utils/searchUtils';

interface CourseCatalogProps {
  courses: Course[];
  userProgressMap: Record<string, UserProgress>;
  onSelectCourse: (course: Course) => void;
  onOpenAiGenerator?: () => void;
  onOpenAddCourseModal?: () => void;
  onEditCourse?: (course: Course) => void;
  searchQuery: string;
  setSearchQuery?: (query: string) => void;
  reviews?: any[];
  onAddReview?: (review: any) => void;
}

const CATEGORIES: CategoryType[] = [
  'الكل',
  'برمجة وتطوير',
  'الذكاء الاصطناعي',
  'تصميم واجهات UI/UX',
  'علوم البيانات',
  'إدارة الأعمال والقيادة'
];

export const CourseCatalog: React.FC<CourseCatalogProps> = ({
  courses,
  userProgressMap,
  onSelectCourse,
  onOpenAiGenerator,
  searchQuery
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('الكل');
  const [selectedLevel, setSelectedLevel] = useState<string>('الكل');
  const [showAll, setShowAll] = useState(false);

  const filteredCourses = React.useMemo(() => {
    const trimmedQuery = searchQuery.trim();

    return courses
      .map((course) => {
        const score = trimmedQuery ? getCourseSearchScore(course, trimmedQuery) : 1;
        const matchesCategory = selectedCategory === 'الكل' || course.category === selectedCategory;
        const matchesLevel = selectedLevel === 'الكل' || course.level === selectedLevel;

        return {
          course,
          score,
          isValid: score > 0 && matchesCategory && matchesLevel
        };
      })
      .filter((item) => item.isValid)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.course);
  }, [courses, searchQuery, selectedCategory, selectedLevel]);

  const hasFilters =
    searchQuery.trim() !== '' || selectedCategory !== 'الكل' || selectedLevel !== 'الكل';
  const visibleCourses =
    showAll || hasFilters ? filteredCourses : filteredCourses.slice(0, 3);

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4 bg-white p-3 sm:p-4 rounded-3xl border border-aqua-mid shadow-sm">

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-aqua-dark text-white shadow-sm'
                  : 'bg-aqua-light/60 text-ink hover:bg-aqua-light'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-ink/70 font-medium shrink-0">
            <Filter className="w-4 h-4 text-aqua-dark" />
            <span>المستوى:</span>
          </div>
          <div className="relative flex-1 md:flex-none">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              style={{ color: '#1F3A44' }}
              className="appearance-none w-full pl-10 pr-3 py-2 text-xs sm:text-sm bg-lime border border-aqua-mid rounded-xl font-bold text-ink cursor-pointer focus:outline-none focus:ring-2 focus:ring-aqua/50"
            >
              <option value="الكل">جميع المستويات</option>
              <option value="مبتدئ">مبتدئ</option>
              <option value="متوسط">متوسط</option>
              <option value="عالمي">عالمي</option>
            </select>
            <ChevronDown className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink" />
          </div>
        </div>

      </div>

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-ink font-arabic">
            الدورات التدريبية المتاحة
          </h2>
          <p className="text-xs text-ink/60 font-medium mt-1">
            تم إيجاد {filteredCourses.length} دورة تعليمية
          </p>
        </div>

        <button
          onClick={onOpenAiGenerator}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-aqua-dark hover:bg-ink text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>ابتكر دورة بالـ AI</span>
        </button>
      </div>

      {/* Grid */}
      {filteredCourses.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {visibleCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                userProgress={userProgressMap[course.id]}
                onSelectCourse={onSelectCourse}
              />
            ))}
          </div>

          {!hasFilters && filteredCourses.length > 3 && (
            <div className="flex justify-center pt-1">
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-6 py-3 rounded-2xl bg-aqua-dark hover:bg-ink text-white font-bold text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                {showAll ? 'عرض أقل' : `عرض كل الدورات (${filteredCourses.length})`}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-aqua-mid max-w-xl mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-aqua-light text-aqua-dark flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-ink">
            لم نجد دورات تطابق بحثك
          </h3>
          <p className="text-xs sm:text-sm text-ink/60 leading-relaxed">
            جرب البحث عن مصطلح آخر أو قم بالاستعانة بمُنشئ الدورات بالذكاء الاصطناعي لإنشاء منهج مخصص لك فوراً!
          </p>
          <button
            onClick={onOpenAiGenerator}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-aqua-dark hover:bg-ink text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>إنشاء دورة في هذا الموضوع بالـ AI</span>
          </button>
        </div>
      )}

    </div>
  );
};