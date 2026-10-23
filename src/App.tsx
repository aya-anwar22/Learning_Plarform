import React, { useState, useEffect } from 'react';
import { Course, Role, StudentProfile, InstructorProfile, UserProgress, CourseChangeRequest, CourseReview } from './types';
import { INITIAL_COURSES } from './data/mockCourses';
import { INITIAL_REVIEWS } from './data/mockReviews';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { CourseCatalog } from './components/CourseCatalog';
import { CoursePlayer } from './components/CoursePlayer';
import { QuizEngine } from './components/QuizEngine';
import { CertificateModal } from './components/CertificateModal';
import { AITutorDrawer } from './components/AITutorDrawer';
import { AICourseGeneratorModal } from './components/AICourseGeneratorModal';
import { StudentDashboard } from './components/StudentDashboard';
import { InstructorStudio } from './components/InstructorStudio';
import { StudentRegistrationModal } from './components/StudentRegistrationModal';
import { StudentProfileModal } from './components/StudentProfileModal';
import { InstructorRegistrationModal } from './components/InstructorRegistrationModal';
import { AddUserTypeModal } from './components/AddUserTypeModal';
import { PlatformOwnerAdminModal } from './components/PlatformOwnerAdminModal';
import { StudentDetailsModal } from './components/StudentDetailsModal';
import { LoginModal } from './components/LoginModal';
import {
  subscribeToCourses,
  subscribeToCourseRequests,
  subscribeToStudents,
  subscribeToInstructors,
  subscribeToReviews,
  subscribeToPendingStudents,
  deletePendingStudentFromCloud,
  subscribeToPendingInstructors,
  deletePendingInstructorFromCloud,
  subscribeToStudentProgress,
  saveStudentProgressToCloud,
  seedInitialCoursesIfEmpty,
  saveCourseToCloud,
  deleteCourseFromCloud,
  saveStudentToCloud,
  deleteStudentFromCloud,
  saveInstructorToCloud,
  deleteInstructorFromCloud,
  saveReviewToCloud,
  testFirestoreConnection
} from './services/realtimeSync';

class SafeErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error?.toString() || 'Unknown Error' };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("App boundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 sm:p-8 text-center text-white bg-ink min-h-screen flex flex-col items-center justify-center" dir="rtl">
          <h2 className="text-2xl font-bold text-red-400 mb-4">حدث خطأ أثناء عرض الصفحة</h2>
          <p className="text-white/70 mb-6 font-mono text-sm">{this.state.error}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-6 py-2 bg-aqua-dark hover:bg-aqua text-white rounded-lg transition"
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// المحاضر لا يُعتبر معتمدًا إلا لو فيه علامة approvedByAdmin
// وهذه العلامة تُضاف فقط عند ضغط المسؤول على "موافقة" - أي شيء آخر = قيد المراجعة
const isInstructorApproved = (i?: InstructorProfile | null) =>
  (i as any)?.approvedByAdmin === true;
const isPendingInstructor = (i: InstructorProfile) => !isInstructorApproved(i);

export default function App() {
  return (
    <SafeErrorBoundary>
      <MainAppContent />
    </SafeErrorBoundary>
  );
}

function MainAppContent() {
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);
  const [currentRole, setCurrentRole] = useState<Role>('student');
  const [activeTab, setActiveTab] = useState<'catalog' | 'dashboard' | 'instructor'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');

  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(() => {
    try {
      const saved = localStorage.getItem('edu_student_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return null;
  });

  const [pendingStudentRequests, setPendingStudentRequests] = useState<StudentProfile[]>(() => {
    try {
      const saved = localStorage.getItem('edu_pending_students');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return [];
  });

  const [extraRegisteredStudents, setExtraRegisteredStudents] = useState<StudentProfile[]>(() => {
    try {
      const saved = localStorage.getItem('edu_registered_students');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return [];
  });

  const [pendingInstructorRequests, setPendingInstructorRequests] = useState<InstructorProfile[]>(() => {
    try {
      const saved = localStorage.getItem('edu_pending_instructors');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return [];
  });

  const [pendingCourseRequests, setPendingCourseRequests] = useState<CourseChangeRequest[]>(() => {
    try {
      const saved = localStorage.getItem('edu_pending_course_requests');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return [];
  });

  const [extraRegisteredInstructors, setExtraRegisteredInstructors] = useState<InstructorProfile[]>(() => {
    try {
      const saved = localStorage.getItem('edu_registered_instructors');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return [];
  });

  const [instructorProfile, setInstructorProfile] = useState<InstructorProfile | null>(() => {
    try {
      const saved = localStorage.getItem('edu_instructor_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return null;
  });

  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isStudentProfileModalOpen, setIsStudentProfileModalOpen] = useState(false);
  const [isInstructorRegistrationModalOpen, setIsInstructorRegistrationModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingCourseToStart, setPendingCourseToStart] = useState<Course | null>(null);

  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<StudentProfile | null>(null);
  const [studentDetailsTab, setStudentDetailsTab] = useState<'details' | 'certificates'>('details');
  const [isStudentDetailsOpen, setIsStudentDetailsOpen] = useState(false);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('edu_dark_mode') === 'true';
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const savedAll = localStorage.getItem('edu_all_courses_v2');
      if (savedAll) {
        const parsed: Course[] = JSON.parse(savedAll);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c) => {
            const initMatch = INITIAL_COURSES.find((ic) => ic.id === c.id);
            if (initMatch) {
              return {
                ...c,
                quiz: initMatch.quiz && (!c.quiz || !c.quiz.questions || c.quiz.questions.length < (initMatch.quiz.questions?.length || 0)) ? initMatch.quiz : (c.quiz || initMatch.quiz),
                modules: c.modules && c.modules.length > 0 ? c.modules : initMatch.modules,
              };
            }
            return c;
          });
        }
      }
      return INITIAL_COURSES;
    } catch (e) { console.error(e); }
    return INITIAL_COURSES;
  });

  const [userProgressMap, setUserProgressMap] = useState<Record<string, UserProgress>>(() => {
    try {
      const saved = localStorage.getItem('edu_user_progress');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return {};
  });

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeQuizCourse, setActiveQuizCourse] = useState<Course | null>(null);
  const [certificateCourse, setCertificateCourse] = useState<Course | null>(null);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);
  const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);

  const [reviews, setReviews] = useState<CourseReview[]>(() => {
    try {
      const saved = localStorage.getItem('edu_course_reviews');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return INITIAL_REVIEWS;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('edu_dark_mode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('edu_course_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('edu_user_progress', JSON.stringify(userProgressMap));
  }, [userProgressMap]);

  useEffect(() => {
    testFirestoreConnection().then((connected) => {
      setIsCloudSynced(connected);
    });

    seedInitialCoursesIfEmpty(INITIAL_COURSES);

    const unsubCourses = subscribeToCourses((cloudCourses) => {
      if (cloudCourses && Array.isArray(cloudCourses) && cloudCourses.length > 0) {
        setCourses(cloudCourses);
        localStorage.setItem('edu_all_courses_v2', JSON.stringify(cloudCourses));
      }
    });

    const unsubRequests = subscribeToCourseRequests((cloudRequests) => {
      setPendingCourseRequests(cloudRequests || []);
      localStorage.setItem('edu_pending_course_requests', JSON.stringify(cloudRequests || []));
    });

    const unsubStudents = subscribeToStudents((cloudStudents) => {
      setExtraRegisteredStudents(cloudStudents || []);
      localStorage.setItem('edu_registered_students', JSON.stringify(cloudStudents || []));
    });

    const unsubPendingStudents = subscribeToPendingStudents((cloudPending) => {
      setPendingStudentRequests(cloudPending || []);
      localStorage.setItem('edu_pending_students', JSON.stringify(cloudPending || []));
    });

    const unsubInstructors = subscribeToInstructors((cloudInstructors) => {
      setExtraRegisteredInstructors(cloudInstructors || []);
      localStorage.setItem('edu_registered_instructors', JSON.stringify(cloudInstructors || []));
    });

    const unsubPendingInstructors = subscribeToPendingInstructors((cloudPending) => {
      setPendingInstructorRequests(cloudPending || []);
      localStorage.setItem('edu_pending_instructors', JSON.stringify(cloudPending || []));
    });

    const unsubReviews = subscribeToReviews((cloudReviews) => {
      if (cloudReviews && Array.isArray(cloudReviews) && cloudReviews.length > 0) {
        setReviews(cloudReviews);
        localStorage.setItem('edu_course_reviews', JSON.stringify(cloudReviews));
      }
    });

    return () => {
      unsubCourses();
      unsubRequests();
      unsubStudents();
      unsubPendingStudents();
      unsubInstructors();
      unsubPendingInstructors();
      unsubReviews();
    };
  }, []);

  useEffect(() => {
    if (!studentProfile?.email) return;
    const unsubProgress = subscribeToStudentProgress(studentProfile.email, (cloudProgress) => {
      if (cloudProgress && typeof cloudProgress === 'object') {
        setUserProgressMap((prev) => ({
          ...prev,
          ...cloudProgress
        }));
      }
    });
    return () => unsubProgress();
  }, [studentProfile?.email]);

  // لما المسؤول يوافق على المحاضر، يتفتح له الاستوديو تلقائيًا
  useEffect(() => {
    if (!instructorProfile || isInstructorApproved(instructorProfile)) return;
    const approved = extraRegisteredInstructors.find(
      (i) => i.email?.toLowerCase() === instructorProfile.email?.toLowerCase() && !isPendingInstructor(i)
    );
    if (approved) {
      const updated = {
        ...instructorProfile,
        ...approved,
        status: 'approved',
        isApproved: true,
        approvedByAdmin: true
      } as InstructorProfile;
      setInstructorProfile(updated);
      localStorage.setItem('edu_instructor_profile', JSON.stringify(updated));
    }
  }, [extraRegisteredInstructors, instructorProfile]);

  const handleAddReview = async (newReviewData: Omit<CourseReview, 'id' | 'createdAt'>) => {
    const newReview: CourseReview = {
      ...newReviewData,
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    setReviews((prev) => [newReview, ...prev]);
    try {
      await saveReviewToCloud(newReview);
    } catch (err) {
      console.warn('Failed to sync review:', err);
    }
  };

  const handleToggleLessonComplete = (courseId: string, lessonId: string) => {
    setUserProgressMap((prev) => {
      const current = prev[courseId] || {
        courseId,
        completedLessonIds: [],
        quizScores: {},
        isCompleted: false,
        lastStudiedAt: new Date().toISOString()
      };
      const isCompleted = current.completedLessonIds.includes(lessonId);
      const updatedLessonIds = isCompleted
        ? current.completedLessonIds.filter((id) => id !== lessonId)
        : [...current.completedLessonIds, lessonId];

      const targetCourse = courses.find((c) => c.id === courseId);
      const totalLessonsCount = targetCourse?.modules
        ? targetCourse.modules.reduce((acc, m) => acc + (m.lessons ? m.lessons.length : 0), 0)
        : 0;
      const courseFullyDone = updatedLessonIds.length === totalLessonsCount && totalLessonsCount > 0;

      const updatedProgressMap = {
        ...prev,
        [courseId]: {
          ...current,
          completedLessonIds: updatedLessonIds,
          isCompleted: courseFullyDone,
          lastStudiedAt: new Date().toISOString()
        }
      };

      if (studentProfile?.email) {
        saveStudentProgressToCloud(studentProfile.email, updatedProgressMap).catch(console.warn);
      }
      return updatedProgressMap;
    });
  };

  const handleAddCourse = (newCourse: Course) => {
    setCourses((prev) => [newCourse, ...prev.filter((c) => c.id !== newCourse.id)]);
    saveCourseToCloud(newCourse).catch(console.warn);
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    setCourses((prev) => prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c)));
    if (selectedCourse?.id === updatedCourse.id) {
      setSelectedCourse(updatedCourse);
    }
    saveCourseToCloud(updatedCourse).catch(console.warn);
  };

  const handleFinishQuiz = (courseId: string, scorePercent: number) => {
    setUserProgressMap((prev) => {
      const current = prev[courseId] || {
        courseId,
        completedLessonIds: [],
        quizScores: {},
        isCompleted: false,
        lastStudiedAt: new Date().toISOString()
      };
      const isPassed = scorePercent >= 70;
      const updatedProgressMap = {
        ...prev,
        [courseId]: {
          ...current,
          quizScores: { ...current.quizScores, [courseId]: scorePercent },
          isCompleted: isPassed ? true : current.isCompleted,
          certificateIssuedAt: isPassed ? new Date().toISOString() : current.certificateIssuedAt
        }
      };
      if (studentProfile?.email) {
        saveStudentProgressToCloud(studentProfile.email, updatedProgressMap).catch(console.warn);
      }
      return updatedProgressMap;
    });
  };

  // تسجيل الطالب في كورس: يضيف الـ courseId لقائمة enrolledCourseIds
  const enrollStudentInCourse = (profile: StudentProfile, courseId: string): StudentProfile => {
    const currentIds = profile.enrolledCourseIds || [];
    if (currentIds.includes(courseId)) return profile;
    const updatedProfile: StudentProfile = {
      ...profile,
      enrolledCourseIds: [...currentIds, courseId],
    };
    setStudentProfile(updatedProfile);
    localStorage.setItem('edu_student_profile', JSON.stringify(updatedProfile));
    saveStudentToCloud(updatedProfile).catch(console.warn);
    return updatedProfile;
  };

  // عند الضغط على كورس من الكتالوج
  const handleSelectCourseFromCatalog = (course: Course) => {
    if (!studentProfile) {
      setPendingCourseToStart(course);
      setIsRegistrationModalOpen(true);
      return;
    }
    enrollStudentInCourse(studentProfile, course.id);
    setSelectedCourse(course);
  };

  const handleSaveProfile = (profile: StudentProfile) => {
    let approvedProfile: StudentProfile = {
      ...profile,
      status: 'approved',
      isApproved: true
    };

    if (pendingCourseToStart) {
      approvedProfile = {
        ...approvedProfile,
        enrolledCourseIds: [...(approvedProfile.enrolledCourseIds || []), pendingCourseToStart.id],
      };
    }

    setStudentProfile(approvedProfile);
    localStorage.setItem('edu_student_profile', JSON.stringify(approvedProfile));
    saveStudentToCloud(approvedProfile).catch(console.warn);

    setIsRegistrationModalOpen(false);
    setSelectedCourse(null);
    setActiveTab('catalog');

    if (pendingCourseToStart) {
      setSelectedCourse(pendingCourseToStart);
      setPendingCourseToStart(null);
    }

    return { isPending: false };
  };

  const handleLoginSuccess = (student: StudentProfile) => {
    let approvedProfile: StudentProfile = {
      ...student,
      status: 'approved',
      isApproved: true
    };

    if (pendingCourseToStart) {
      const currentIds = approvedProfile.enrolledCourseIds || [];
      if (!currentIds.includes(pendingCourseToStart.id)) {
        approvedProfile = {
          ...approvedProfile,
          enrolledCourseIds: [...currentIds, pendingCourseToStart.id],
        };
        saveStudentToCloud(approvedProfile).catch(console.warn);
      }
    }

    setStudentProfile(approvedProfile);
    localStorage.setItem('edu_student_profile', JSON.stringify(approvedProfile));
    setIsLoginModalOpen(false);
    setActiveTab('catalog');

    if (pendingCourseToStart) {
      setSelectedCourse(pendingCourseToStart);
      setPendingCourseToStart(null);
    }
  };

  const handleLogoutStudent = () => {
    setStudentProfile(null);
    localStorage.removeItem('edu_student_profile');
    setActiveTab('catalog');
    setSelectedCourse(null);
  };

  const handleSaveInstructorProfile = (profile: InstructorProfile) => {
    const email = profile.email?.toLowerCase();
    const existing = extraRegisteredInstructors.find((i) => i.email?.toLowerCase() === email);
    const existingApproved = !!existing && isInstructorApproved(existing);
    const isOwnApprovedProfile =
      existingApproved &&
      isInstructorApproved(instructorProfile) &&
      instructorProfile?.email?.toLowerCase() === email;

    // إيميل محاضر معتمد بالفعل ومش بتاع صاحب الجهاز الحالي -> ممنوع (منع الانتحال)
    if (existingApproved && !isOwnApprovedProfile) {
      window.alert('هذا البريد الإلكتروني مسجّل بالفعل كمحاضر معتمد.');
      return { isPending: true };
    }

    const alreadyApproved = isOwnApprovedProfile;

    const finalProfile = (alreadyApproved
      ? { ...profile, status: 'approved', isApproved: true, approvedByAdmin: true }
      : { ...profile, status: 'pending', isApproved: false, approvedByAdmin: false }) as InstructorProfile;

    setInstructorProfile(finalProfile);
    localStorage.setItem('edu_instructor_profile', JSON.stringify(finalProfile));

    // الحفظ في السحابة بحالته (pending أو approved) - بيظهر للمسؤول في قسم الموافقات
    saveInstructorToCloud(finalProfile).catch(console.warn);

    // اقفل نافذة تسجيل المحاضر بعد الحفظ
    setIsInstructorRegistrationModalOpen(false);
    setActiveTab('instructor');
    return { isPending: !alreadyApproved };
  };

  // تسجيل خروج المحاضر
  const handleLogoutInstructor = () => {
    setInstructorProfile(null);
    localStorage.removeItem('edu_instructor_profile');
    setActiveTab('catalog');
    setSelectedCourse(null);
  };

  const handleDeleteAllStudents = async () => {
    const emails = extraRegisteredStudents.map((s) => s.email);
    for (const email of emails) {
      try {
        await deleteStudentFromCloud(email);
      } catch (err) {
        console.warn('Failed to delete student from cloud:', email, err);
      }
    }
    setExtraRegisteredStudents([]);
    localStorage.removeItem('edu_registered_students');
  };

  const handleDeleteAllInstructors = async () => {
    const emails = extraRegisteredInstructors.map((i) => i.email);
    for (const email of emails) {
      try {
        await deleteInstructorFromCloud(email);
      } catch (err) {
        console.warn('Failed to delete instructor from cloud:', email, err);
      }
    }
    setExtraRegisteredInstructors([]);
    localStorage.removeItem('edu_registered_instructors');
  };

  const handleClearAllPendingRequests = async () => {
    const studentEmails = pendingStudentRequests.map((s) => s.email);
    for (const email of studentEmails) {
      try {
        await deletePendingStudentFromCloud(email);
      } catch (err) {
        console.warn('Failed to clear pending student:', email, err);
      }
    }
    const instructorEmails = pendingInstructorRequests.map((i) => i.email);
    for (const email of instructorEmails) {
      try {
        await deletePendingInstructorFromCloud(email);
      } catch (err) {
        console.warn('Failed to clear pending instructor:', email, err);
      }
    }
    for (const inst of extraRegisteredInstructors.filter(isPendingInstructor)) {
      try {
        await deleteInstructorFromCloud(inst.email);
      } catch (err) {
        console.warn('Failed to clear pending instructor:', inst.email, err);
      }
    }
    setPendingStudentRequests([]);
    setPendingInstructorRequests([]);
    localStorage.removeItem('edu_pending_students');
    localStorage.removeItem('edu_pending_instructors');
  };

  // قوائم المحاضرين للوحة المسؤول: المعلّقين (من القائمتين بدون تكرار) والمعتمدين
  const adminPendingInstructors: InstructorProfile[] = [
    ...(pendingInstructorRequests || []),
    ...(extraRegisteredInstructors || []).filter(isPendingInstructor)
  ].filter(
    (inst, idx, arr) =>
      arr.findIndex((x) => x.email?.toLowerCase() === inst.email?.toLowerCase()) === idx
  );
  const adminApprovedInstructors: InstructorProfile[] = (extraRegisteredInstructors || []).filter(
    (i) => !isPendingInstructor(i)
  );

  // نسخة محمية: حالة الاعتماد بتتحدد بس من approvedByAdmin بغض النظر عن أي حقول تانية
  const gatedInstructorProfile: InstructorProfile | null = instructorProfile
    ? ({
        ...instructorProfile,
        isApproved: isInstructorApproved(instructorProfile),
        status: isInstructorApproved(instructorProfile) ? 'approved' : 'pending'
      } as InstructorProfile)
    : null;

  const safeStudentProfile: StudentProfile = studentProfile || {
    fullName: 'طالب جديد',
    email: 'student@example.com',
    phone: '',
    country: 'مصر',
    jobTitleOrGoal: 'طالب',
    enrolledCourseIds: []
  };

  // لما أي نافذة تفتح، الصفحة الرئيسية تختفي وتظهر النافذة لوحدها
  const isPageOpen =
    isRegistrationModalOpen ||
    isLoginModalOpen ||
    isInstructorRegistrationModalOpen ||
    isAddUserModalOpen ||
    isAdminModalOpen ||
    isStudentProfileModalOpen;

  return (
    <div className="min-h-screen bg-[#E3F1F3] text-ink font-arabic" dir="rtl">
      {/* الصفحة الرئيسية: تتخبى (مش تتمسح) عشان البحث والفلاتر يفضلوا زي ما هم */}
      <div className={isPageOpen ? 'hidden' : ''}>
        <Header
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setSelectedCourse(null);
            setActiveTab(tab);
          }}
          onOpenAiTutor={() => setIsAiTutorOpen(true)}
          onOpenStudentProfile={() => setIsStudentProfileModalOpen(true)}
          onOpenAddAccount={() => setIsAddUserModalOpen(true)}
          onOpenCatalog={() => {
            setSelectedCourse(null);
            setActiveTab('catalog');
          }}
          onOpenDashboard={() => {
            setSelectedCourse(null);
            setActiveTab('dashboard');
          }}
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          courses={courses}
          onSelectCourse={(course) => {
            setActiveTab('catalog');
            setSelectedCourse(course);
          }}
          studentProfile={studentProfile}
          instructorProfile={gatedInstructorProfile}
          onOpenRegistrationModal={() => setIsRegistrationModalOpen(true)}
          onOpenInstructorRegistrationModal={() => setIsInstructorRegistrationModalOpen(true)}
          onOpenAddUserModal={() => setIsAddUserModalOpen(true)}
          onOpenAdminModal={() => setIsAdminModalOpen(true)}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          isCloudSynced={isCloudSynced}
        />

        <main className="w-full pb-10 sm:pb-14">
          {selectedCourse ? (
            <CoursePlayer
              course={selectedCourse}
              onBack={() => setSelectedCourse(null)}
              userProgress={userProgressMap[selectedCourse.id] || {
                courseId: selectedCourse.id,
                completedLessonIds: [],
                quizScores: {},
                isCompleted: false,
                lastStudiedAt: new Date().toISOString()
              }}
              onToggleLessonComplete={handleToggleLessonComplete}
              onOpenQuiz={(course) => setActiveQuizCourse(course)}
              onOpenCertificate={(course) => setCertificateCourse(course)}
            />
          ) : activeTab === 'dashboard' ? (
            <StudentDashboard
              courses={courses}
              userProgressMap={userProgressMap}
              studentProfile={studentProfile}
              onSelectCourse={(course) => setSelectedCourse(course)}
              onOpenCertificate={(course) => setCertificateCourse(course)}
              onOpenRegistrationModal={() => setIsRegistrationModalOpen(true)}
              onLogoutStudent={handleLogoutStudent}
              onBrowseCatalog={() => {
                setSelectedCourse(null);
                setActiveTab('catalog');
              }}
            />
          ) : activeTab === 'instructor' ? (
            <InstructorStudio
              instructorCourses={courses}
              instructorProfile={gatedInstructorProfile}
              onAddCourse={handleAddCourse}
              onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
              pendingCourseRequests={pendingCourseRequests}
              onOpenRegistrationModal={() => setIsInstructorRegistrationModalOpen(true)}
              onLogoutInstructor={handleLogoutInstructor}
              isApprovedInstructor={isInstructorApproved(instructorProfile)}
            />
          ) : (
            <>
              <HeroBanner
                onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
                onExploreCourses={() => {
                  const el = document.getElementById('catalog-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                coursesCount={courses.length}
                studentsCount={extraRegisteredStudents.length}
              />
              <div id="catalog-section">
                <CourseCatalog
                  courses={courses}
                  onSelectCourse={handleSelectCourseFromCatalog}
                  onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  userProgressMap={userProgressMap}
                  reviews={reviews}
                  onAddReview={handleAddReview}
                />
              </div>
            </>
          )}
        </main>
      </div>

      {/* خلفية نضيفة ورا النوافذ المفتوحة */}
      {isPageOpen && <div className="fixed inset-0 z-40 bg-[#E3F1F3]" />}

      {/* Modals */}
      {isRegistrationModalOpen && (
        <StudentRegistrationModal
          isOpen={isRegistrationModalOpen}
          onClose={() => {
            setIsRegistrationModalOpen(false);
            setPendingCourseToStart(null);
          }}
          studentProfile={studentProfile}
          onSaveProfile={handleSaveProfile}
          onLogout={handleLogoutStudent}
        />
      )}

      {isInstructorRegistrationModalOpen && (
        <InstructorRegistrationModal
          isOpen={isInstructorRegistrationModalOpen}
          onClose={() => setIsInstructorRegistrationModalOpen(false)}
          onSaveProfile={handleSaveInstructorProfile}
        />
      )}

      {isStudentProfileModalOpen && (
        <StudentProfileModal
          isOpen={isStudentProfileModalOpen}
          onClose={() => setIsStudentProfileModalOpen(false)}
          studentProfile={safeStudentProfile}
          onLogout={handleLogoutStudent}
        />
      )}

      {isAddUserModalOpen && (
        <AddUserTypeModal
          isOpen={isAddUserModalOpen}
          onClose={() => setIsAddUserModalOpen(false)}
          onSelectStudent={() => setIsRegistrationModalOpen(true)}
          onSelectInstructor={() => setIsInstructorRegistrationModalOpen(true)}
        />
      )}

      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          registeredStudents={extraRegisteredStudents || []}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {isAdminModalOpen && (
        <PlatformOwnerAdminModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          courses={courses || []}
          registeredStudents={extraRegisteredStudents || []}
          registeredInstructors={adminApprovedInstructors}
          pendingStudents={pendingStudentRequests || []}
          pendingInstructors={adminPendingInstructors}
          pendingCourseRequests={pendingCourseRequests || []}
          onViewStudentDetails={(student) => {
            setSelectedStudentForDetails(student);
            setStudentDetailsTab('details');
            setIsStudentDetailsOpen(true);
          }}
          onViewStudentCertificates={(student) => {
            setSelectedStudentForDetails(student);
            setStudentDetailsTab('certificates');
            setIsStudentDetailsOpen(true);
          }}
          onApproveStudent={(email) => {
            const target = pendingStudentRequests.find(p => p.email.toLowerCase() === email.toLowerCase());
            if (target) {
              saveStudentToCloud(target);
              deletePendingStudentFromCloud(email);
            }
          }}
          onRejectStudent={deletePendingStudentFromCloud}
          onDeleteStudent={(email) => {
            setExtraRegisteredStudents(prev => prev.filter(s => s.email.toLowerCase() !== email.toLowerCase()));
            deleteStudentFromCloud(email);
          }}
          onApproveInstructor={(email) => {
            const target = adminPendingInstructors.find(p => p.email.toLowerCase() === email.toLowerCase());
            if (target) {
              saveInstructorToCloud({ ...target, status: 'approved', isApproved: true, approvedByAdmin: true } as InstructorProfile);
              deletePendingInstructorFromCloud(email);
            }
          }}
          onRejectInstructor={(email) => {
            deletePendingInstructorFromCloud(email);
            deleteInstructorFromCloud(email);
            setExtraRegisteredInstructors(prev => prev.filter(i => i.email.toLowerCase() !== email.toLowerCase()));
          }}
          onDeleteInstructor={(email) => {
            setExtraRegisteredInstructors(prev => prev.filter(i => i.email.toLowerCase() !== email.toLowerCase()));
            deleteInstructorFromCloud(email);
          }}
          onAddCourse={handleAddCourse}
          onUpdateCourse={handleUpdateCourse}
          onDeleteCourse={(id) => {
            setCourses(prev => prev.filter(c => c.id !== id));
            deleteCourseFromCloud(id);
          }}
          onDeleteAllStudents={handleDeleteAllStudents}
          onDeleteAllInstructors={handleDeleteAllInstructors}
          onClearAllPendingRequests={handleClearAllPendingRequests}
          isCloudSynced={isCloudSynced}
        />
      )}

      <StudentDetailsModal
        isOpen={isStudentDetailsOpen}
        onClose={() => setIsStudentDetailsOpen(false)}
        student={selectedStudentForDetails}
        courses={courses || []}
        userProgressMap={userProgressMap || {}}
        initialTab={studentDetailsTab}
        onOpenCertificate={(course) => {
          setIsStudentDetailsOpen(false);
          setCertificateCourse(course);
        }}
      />

      {activeQuizCourse && activeQuizCourse.quiz && (
        <QuizEngine
          quiz={activeQuizCourse.quiz}
          courseTitle={activeQuizCourse.title}
          onClose={() => setActiveQuizCourse(null)}
          onFinish={(score) => handleFinishQuiz(activeQuizCourse.id, score)}
        />
      )}

      {certificateCourse && (
        <CertificateModal
          isOpen={Boolean(certificateCourse)}
          onClose={() => setCertificateCourse(null)}
          studentName={selectedStudentForDetails?.fullName || studentProfile?.fullName || 'طالب'}
          courseTitle={certificateCourse.title}
          completionDate={userProgressMap[certificateCourse.id]?.certificateIssuedAt || new Date().toISOString()}
          instructorName={certificateCourse.instructor?.name || 'المحاضر'}
        />
      )}

      {isAiTutorOpen && (
        <AITutorDrawer
          isOpen={isAiTutorOpen}
          onClose={() => setIsAiTutorOpen(false)}
          courses={courses}
          studentProfile={studentProfile}
          onSelectCourse={(courseId: string) => {
            const course = courses.find((c) => c.id === courseId);
            if (course) {
              if (studentProfile) {
                enrollStudentInCourse(studentProfile, course.id);
                setSelectedCourse(course);
              } else {
                setPendingCourseToStart(course);
                setIsRegistrationModalOpen(true);
              }
              setIsAiTutorOpen(false);
            }
          }}
        />
      )}

      {isAiGeneratorOpen && (
        <AICourseGeneratorModal
          isOpen={isAiGeneratorOpen}
          onClose={() => setIsAiGeneratorOpen(false)}
          onCourseGenerated={(newCourse) => {
            handleAddCourse(newCourse);
            setIsAiGeneratorOpen(false);
          }}
        />
      )}
    </div>
  );
}