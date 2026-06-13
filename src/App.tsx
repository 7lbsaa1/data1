import { useState, useEffect, useMemo } from 'react';
import { Student, StudentStatus } from './types';
import { 
  fetchStudents, 
  addStudentToDatabase, 
  updateStudentStatusInDatabase, 
  deleteStudentFromDatabase,
  testFirestoreConnection
} from './firebase';
import Navbar from './components/Navbar';
import DashboardStats from './components/DashboardStats';
import StudentCard from './components/StudentCard';
import StudentDetailModal from './components/StudentDetailModal';
import AdminPanel from './components/AdminPanel';
import { 
  Github, 
  BookOpen, 
  AlertCircle, 
  Terminal, 
  ChevronRight, 
  RefreshCw,
  SearchCode,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Sync Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCloud, setIsCloud] = useState<boolean>(false);

  // Layout View States
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Search and filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');

  // Fetch student roster on initialization
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Test firestore connection to guide the status pill
      const connectionResult = await testFirestoreConnection();
      const result = await fetchStudents();
      setStudents(result.students);
      setIsCloud(result.isCloud && connectionResult);
    } catch (e) {
      console.error("Failed loading students records: ", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute available classroom groups dynamically from registered list
  const availableClasses = useMemo(() => {
    const published = students.filter(s => s.status === 'published');
    const classesSet = new Set(published.map(s => s.classroom));
    return Array.from(classesSet);
  }, [students]);

  // Handle Admin Add Actions
  const handleAddStudent = async (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    try {
      const result = await addStudentToDatabase(studentData);
      setStudents(prev => [result.student, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Admin Promotion Actions (Publishing)
  const handleUpdateStatus = async (id: string, newStatus: StudentStatus) => {
    try {
      await updateStudentStatusInDatabase(id, newStatus);
      setStudents(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Admin Delete Actions
  const handleDeleteStudent = async (id: string) => {
    try {
      await deleteStudentFromDatabase(id);
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Filter published list for public main page show
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      if (student.status !== 'published') return false;
      
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            student.classroom.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesClass = selectedClass === '' || student.classroom === selectedClass;
      
      return matchesSearch && matchesClass;
    });
  }, [students, searchQuery, selectedClass]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="student-portal-app">
      <div>
        {/* Main Header with Search Filters */}
        <Navbar
          isAdminView={isAdminView}
          setIsAdminView={setIsAdminView}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          availableClasses={availableClasses}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            /* Loading Spinner Indicator */
            <div className="flex flex-col items-center justify-center py-20" id="loading-spinner">
              <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
              <p className="text-sm font-bold text-slate-700 animate-pulse">جاري سحب وتصنيف سجلات الطلاب...</p>
              <p className="text-[11px] text-slate-400 mt-1">يتصل بقاعد بيانات Firebase أو يحضر المخزن الدائم البديل</p>
            </div>
          ) : (
            <>
              {/* Dynamic Information Stats cards */}
              <DashboardStats students={students} isCloud={isCloud} />

              <AnimatePresence mode="wait">
                {isAdminView ? (
                  /* Admin Panel Screen */
                  <motion.div
                    key="admin-panel-container"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                  >
                    <AdminPanel
                      students={students}
                      onAddStudent={handleAddStudent}
                      onUpdateStatus={handleUpdateStatus}
                      onDeleteStudent={handleDeleteStudent}
                    />
                  </motion.div>
                ) : (
                  /* Public Listing Homepage Screen */
                  <motion.div
                    key="public-students-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* Page descriptor */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-extrabold text-indigo-950 flex items-center gap-2">
                          <GraduationCap className="w-5.5 h-5.5 text-indigo-600" />
                          قائمة لوحة الشرف والتميز المدرسي
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">تضم السجلات الرسمية والتقديرات المعتمدة لطلاب المدرسة الأفاضل.</p>
                      </div>

                      {filteredStudents.length > 0 && (
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                          يتم عرض {filteredStudents.length} طالب وطالبة
                        </span>
                      )}
                    </div>

                    {/* Students Grid cards */}
                    {filteredStudents.length === 0 ? (
                      <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm" id="empty-state">
                        <SearchCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h4 className="text-base font-bold text-slate-700">لم نجد أي طلاب يطابقون استعلامك</h4>
                        <p className="text-xs text-slate-450 mt-1 max-w-md mx-auto leading-relaxed">
                          حاول تصفح فصل آخر أو تعديل كلمة البحث. يمكن استخدام المشرفين زر بوابة المعلمين بالأعلى لإضافة ونشر طلاب جدد لتجربة النظام.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="public-students-grid">
                        {filteredStudents.map((student) => (
                          <StudentCard
                            key={student.id}
                            student={student}
                            onClick={() => setSelectedStudent(student)}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </main>
      </div>

      {/* Footer Area with Detailed Github Deployment Walkthrough */}
      <footer className="bg-white border-t border-slate-150 py-10 mt-12 text-right" id="github-footer-instructions">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-slate-900 text-white rounded-xl">
                  <Github className="w-5.5 h-5.5" />
                </div>
                <h4 className="text-base font-black text-slate-800">سهولة الرفع والمشاركة على GitHub</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                 تم تصميم هذا الموقع باحترافية كاملة وبنية تفاعلية متجاوبة. يمكنك مشاركة الكود المصدري ورفعه على GitHub أو Vercel/Netlify ليعمل مباشرة بسلاسة كاملة وحفظ سحابي نشط.
              </p>
            </div>

            <div className="lg:col-span-2 bg-slate-950 text-slate-300 p-5 rounded-2xl border border-slate-800 font-mono text-xs flex flex-col gap-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-1">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] font-bold text-slate-400">خطوات رفع المشروع إلى مستودع GitHub</span>
                </div>
                <span className="bg-indigo-650/30 text-indigo-300 text-[9px] font-bold px-2 py-0.5 rounded-full border border-indigo-700/30">سريع ومجرب</span>
              </div>
              <div className="space-y-1.5" id="console-logs">
                <p className="text-slate-450 font-sans text-[11px] font-semibold mb-1">&#128216; اتبع الأوامر التالية في سطر الأوامر (Terminal) بجهازك:</p>
                <div className="bg-slate-900/60 p-2.5 rounded-xl text-emerald-400 select-all block whitespace-pre-wrap leading-relaxed">
                  # 1. تهيئة المستودع المحلي للمشروع<br />
                  git init<br />
                  git add .<br />
                  git commit -m "feat: إطلاق لوحة السجلات الطلابية المميزة مع Firebase"<br /><br />
                  # 2. ربط المشروع بمستودع GitHub الخاص بك والرفع<br />
                  git branch -M main<br />
                  git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git<br />
                  git push -u origin main
                </div>
              </div>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-medium">
            <p>© {new Date().getFullYear()} مدارس التميز النموذجية. جميع الحقوق محفوظة.</p>
            <p>صُمم وطُوّر بحب واحترافية فائقة لخدمة سجلات الطلاب الأكاديمية.</p>
          </div>
        </div>
      </footer>

      {/* Immersive Student academic dashboard details modal */}
      <StudentDetailModal
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
}
