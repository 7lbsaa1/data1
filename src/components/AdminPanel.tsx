import React, { useState, useMemo, useRef } from 'react';
import { Student, StudentStatus, DEFAULT_SUBJECTS } from '../types';
import { 
  PlusCircle, 
  Clock, 
  Users, 
  Trash2, 
  Check, 
  Lock, 
  Upload, 
  Image as ImageIcon, 
  AlertCircle, 
  ShieldCheck,
  MapPin,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPanelProps {
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateStatus: (id: string, status: StudentStatus) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
}

export default function AdminPanel({ students, onAddStudent, onUpdateStatus, onDeleteStudent }: AdminPanelProps) {
  // Authentication states
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('is_admin_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Tab navigation: 'add' | 'queue' | 'registered'
  const [activeTab, setActiveTab] = useState<'add' | 'queue' | 'registered'>('add');

  // Form states for adding student
  const [name, setName] = useState('');
  const [classroom, setClassroom] = useState('');
  const [notes, setNotes] = useState('');
  const [imageType, setImageType] = useState<'url' | 'upload'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [grades, setGrades] = useState<Record<string, number>>(() => {
    const initialGrades: Record<string, number> = {};
    DEFAULT_SUBJECTS.forEach(sub => {
      initialGrades[sub] = 85; // Default starter grade
    });
    return initialGrades;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authentication validation
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234') {
      setIsAdminAuthenticated(true);
      localStorage.setItem('is_admin_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('رمز المرور خاطئ! حاول مجدداً بنصيحة (1234).');
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('is_admin_auth');
    setPinInput('');
  };

  // Convert uploaded image file to compressed Base64 string for Firestore storing
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار صورة صالحة فقط!');
      return;
    }
    // Check file size (recommend < 400KB to stay efficiently within Firestore/LocalStorage storage size limits)
    if (file.size > 800000) {
      alert('الرجاء اختيار صورة أصغر من 800 كيلوبايت للتخزين السريع للبيانات السحابية.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processImageFile(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Handle grade edits
  const handleGradeChange = (subject: string, value: number) => {
    setGrades(prev => ({
      ...prev,
      [subject]: value
    }));
  };

  // Submit complete student details
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('الرجاء إدخال اسم الطالب');
    if (!classroom.trim()) return alert('الرجاء إدخال الصف الدراسي للفصل');

    setIsSubmitting(true);
    try {
      await onAddStudent({
        name: name.trim(),
        classroom: classroom.trim(),
        grades,
        notes: notes.trim(),
        imageUrl: imageUrl.trim(),
        status: 'waiting' // Enters the waiting list queue as required
      });

      // Clear Form state on success
      setName('');
      setClassroom('');
      setNotes('');
      setImageUrl('');
      const resetGrades: Record<string, number> = {};
      DEFAULT_SUBJECTS.forEach(sub => {
        resetGrades[sub] = 85;
      });
      setGrades(resetGrades);

      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ في حفظ بيانات الطالب.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter students based on role
  const waitingStudents = useMemo(() => students.filter(s => s.status === 'waiting'), [students]);
  const publishedStudents = useMemo(() => students.filter(s => s.status === 'published'), [students]);

  // If Admin panel is locked physically
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-100 shadow-sm p-8 mt-12 text-center" id="admin-passcode-gate">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-indigo-950 mb-2">لوحة المعلمين والمشرفين</h3>
        <p className="text-slate-500 text-xs mb-6">يرجى تأكيد هويتك الدخول بكلمة المرور الافتراضية لرؤية خيارات التحكم وإقرار الطلاب.</p>
        
        <form onSubmit={handleLogin} className="space-y-4" id="admin-login-form">
          <div className="text-right">
            <label className="text-xs font-bold text-slate-700 block mb-1.5 mr-0.5">رمز مرور المشرف</label>
            <input
              type="password"
              placeholder="••••"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-center font-mono letter-spacing-lg text-lg bg-slate-50"
              required
            />
          </div>

          {authError && (
            <div className="flex items-center gap-1.5 p-2.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-xs justify-center font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-sm hover:shadow"
          >
            تأكيد الدخول الآمن
          </button>
        </form>

        <p className="text-[10px] text-slate-400 mt-6">تنويه المطور: استخدم الرمز الافتراضي <span className="font-mono font-bold text-slate-500">1234</span> لتسجيل دخول سريع للتحلل التجريبي.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" id="admin-dashboard-panel">
      {/* Admin Panel Header */}
      <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="text-right">
            <h3 className="text-lg font-extrabold tracking-tight">بوابة إدارة شئون الطلاب</h3>
            <p className="text-[11px] text-indigo-200 font-medium">مرحباً بك في وحدة التحكم الكاملة • متصل بنجاح</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs bg-slate-800 hover:bg-slate-750 border border-slate-700 px-4 py-2 rounded-xl transition-all font-semibold text-slate-300 hover:text-white cursor-pointer"
        >
          خروج من لوحة الإدارة
        </button>
      </div>

      {/* Tabs Menu Selection */}
      <div className="border-b border-slate-100 flex p-2 bg-slate-50 gap-2 overflow-x-auto" id="admin-tabs-nav">
        <button
          onClick={() => setActiveTab('add')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${activeTab === 'add' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'}`}
        >
          <PlusCircle className="w-4 h-4" />
          إضافة طالب جديد (add.html)
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer relative"
        >
          <span className={`flex items-center gap-2 ${activeTab === 'queue' ? 'text-indigo-600 font-extrabold' : 'text-slate-500'}`}>
            <Clock className="w-4 h-4" />
            قائمة الانتظار (الطلبات المعلقة)
          </span>
          {waitingStudents.length > 0 && (
            <span className="bg-amber-500 text-white w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center absolute -top-1 -left-1 ring-2 ring-white">
              {waitingStudents.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('registered')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${activeTab === 'registered' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'}`}
        >
          <Users className="w-4 h-4" />
          الطلاب المسجلين (students.html)
        </button>
      </div>

      {/* Main Tab Content panel */}
      <div className="p-6 md:p-8" id="admin-content-view">
        <AnimatePresence mode="wait">
          {/* TAB 1: ADD STUDENT FORM */}
          {activeTab === 'add' && (
            <motion.div
              key="add-student-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h4 className="text-base font-bold text-slate-800 mb-1">تسجيل وتأهيل طالب جديد</h4>
                <p className="text-xs text-slate-400">يرجى ملئ بيانات الطالب الأكاديمية والدرجات ليتم حفظها تلقائياً في قائمة الانتظار للمراجعة والنشر.</p>
              </div>

              {formSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold">تم حفظ الطالب بنجاح!</h5>
                    <p className="text-xs text-emerald-600 mt-0.5">تمت إضافة بيانات الطالب والدرجات المرفقة لقائمة المراجعة والانتظار بنجاح.</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8" id="add-student-form">
                {/* Section 1: Basic Info */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-right">
                    <label className="text-xs font-bold text-slate-700 block mb-1.5 mr-0.5">الاسم الكامل للطالب <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="الأستاذ: أحمد محمد محمود"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-600 text-xs font-medium"
                      required
                    />
                  </div>

                  <div className="text-right">
                    <label className="text-xs font-bold text-slate-700 block mb-1.5 mr-0.5">الفصل الدراسي / القسم <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="الصف الثالث الإعدادي - شعبة أ"
                      value={classroom}
                      onChange={(e) => setClassroom(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-600 text-xs font-medium"
                      required
                    />
                  </div>

                  <div className="text-right md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1.5 mr-0.5">ملاحظات سلوكية / تقييم المدرسين</label>
                    <textarea
                      placeholder="طالب متميز جداً يظهر تجاوباً مميزاً ولديه شغف لدراسة الرياضيات..."
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-600 text-xs font-medium resize-none"
                    />
                  </div>
                </div>

                {/* Section 2: Avatar upload & Selection */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3 text-right">
                    <label className="text-xs font-bold text-slate-700 block mb-1.5 mr-0.5">مصدر صورة الطالب</label>
                    <div className="grid grid-cols-2 bg-slate-200 p-1 rounded-xl mb-4">
                      <button
                        type="button"
                        onClick={() => { setImageType('upload'); setImageUrl(''); }}
                        className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${imageType === 'upload' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 font-medium'}`}
                      >
                        ملف من الكومبيوتر
                      </button>
                      <button
                        type="button"
                        onClick={() => { setImageType('url'); setImageUrl(''); }}
                        className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${imageType === 'url' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 font-medium'}`}
                      >
                        رابط خارجي (URL)
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                       الصورة اختيارية، إذا لم يتم توفير صورة فسيقوم النظام بإنشاء رمز تعبيري بأحرف الطالب الأولى بشكل جذاب وتلقائي.
                    </p>
                  </div>

                  <div className="flex-1">
                    {imageType === 'url' ? (
                      <div className="text-right">
                        <label className="text-xs font-bold text-slate-700 block mb-1.5 mr-0.5">رابط الصورة من الإنترنت</label>
                        <input
                          type="url"
                          placeholder="https://example.com/student-photo.jpg"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-600 text-xs font-medium"
                        />
                      </div>
                    ) : (
                      <div 
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={triggerFileSelect}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${dragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-400 bg-white'}`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">اسحب صورة الطالب وأفلتها هنا، أو اضغط للتصفح</p>
                        <p className="text-[10px] text-slate-400 mt-1">الامتدادات المدعومة: PNG, JPG, WEBP (بحد أقصى 800 كيلوبايت)</p>
                      </div>
                    )}

                    {/* Image Quick Preview */}
                    {imageUrl && (
                      <div className="mt-4 p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={imageUrl}
                            alt="معاينة"
                            className="w-12 h-12 rounded-lg object-cover ring-2 ring-indigo-500/20"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              alert('يرجى التحقق من صحة رابط تفوق الصورة المضافة');
                              setImageUrl('');
                            }}
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-700">معاينة الصورة المحددة</span>
                            <p className="text-[10px] text-slate-400 mt-0.5">ستظهر الصورة في بطاقة الطالب بشكل ممتاز</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="text-xs font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          حذف الصورة
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Student Academic Grades */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">إدخال درجات الطالب للمواد الأساسية (من 100)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6" id="form-grades-inputs">
                    {DEFAULT_SUBJECTS.map((subject) => (
                      <div key={subject} className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col justify-between" id={`form-grade-${subject}`}>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-slate-700">{subject}</label>
                          <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">%{grades[subject]}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={grades[subject]}
                          onChange={(e) => handleGradeChange(subject, parseInt(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                          <span>0</span>
                          <span>50 (نجاح)</span>
                          <span>100</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Actions footer */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-3.5 px-8 bg-indigo-600 hover:bg-indigo-700 hover:shadow disabled:bg-slate-450 text-white rounded-2xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
                  >
                    {isSubmitting ? (
                      <>جاري حفظ البيانات...</>
                    ) : (
                      <>
                        <Sparkles className="w-4.5 h-4.5" />
                        حفظ وطرح في قائمة الانتظار (إتمام)
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* TAB 2: WAITING LIST QUEUE REVIEW (add.html integration) */}
          {activeTab === 'queue' && (
            <motion.div
              key="queue-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h4 className="text-base font-bold text-slate-800 mb-1">الطلاب قيد المراجعة والانتظار</h4>
                <p className="text-xs text-slate-400">تحتوي هذه القائمة على الطلاب التي تمت إضافتهم حديثاً. يمكنك إقرار ونشر بياناتهم للرؤساء لتظهر في الصفحة الرئيسية للأولياء والأمور.</p>
              </div>

              {waitingStudents.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                  <Clock className="w-10 h-10 text-slate-350 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-700">قائمة الانتظار فارغة حالياً</p>
                  <p className="text-[11px] text-slate-450 mt-1">استخدم تبويب "إضافة طالب جديد" لتسجيل طالب واختباره في هذه الصفحة.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="waiting-grid">
                  {waitingStudents.map((student) => {
                    // Extract initials
                    const studyParts = student.name.trim().split(/\s+/);
                    const initChars = studyParts.length >= 2 ? `${studyParts[0][0]} ${studyParts[1][0]}` : 'ط';
                    const listGrades = Object.values(student.grades) as number[];
                    const avg = listGrades.length ? Math.round(listGrades.reduce((a: number, b: number) => a + b, 0) / listGrades.length) : 0;

                    return (
                      <motion.div
                        key={student.id}
                        layoutId={student.id}
                        className="bg-slate-50 rounded-2xl p-4 border border-slate-150 flex flex-col justify-between"
                        id={`queue-card-${student.id}`}
                      >
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            {student.imageUrl ? (
                              <img src={student.imageUrl} alt={student.name} className="w-11 h-11 rounded-xl object-cover ring-2 ring-indigo-500/10" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-950 font-extrabold flex items-center justify-center text-xs">
                                {initChars}
                              </div>
                            )}
                            <div>
                              <h5 className="text-xs font-bold text-slate-900">{student.name}</h5>
                              <p className="text-[10px] text-slate-400 mt-0.5">{student.classroom}</p>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-slate-150 mb-3 text-xs leading-relaxed text-slate-650 italic">
                            {student.notes || "لا توجد ملاحظات تقريرية."}
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {Object.entries(student.grades).map(([subject, score]) => (
                              <span key={subject} className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-md font-semibold">
                                {subject}: %{score}
                              </span>
                            ))}
                            <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-md font-extrabold border border-indigo-100">
                              معدل: %{avg}
                            </span>
                          </div>
                        </div>

                        {/* Actions for Approve & Delete from review queue */}
                        <div className="flex items-center gap-2 pt-3 border-t border-slate-200/60">
                          <button
                            onClick={() => onUpdateStatus(student.id, 'published')}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Check className="w-4 h-4" />
                            موافقة ونشر بالرئيسية
                          </button>
                          <button
                            onClick={() => onDeleteStudent(student.id)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-xl border border-rose-100 transition-all cursor-pointer"
                            title="حذف الطالب نهائياً"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: REGISTERED STUDENTS LIST (students.html) */}
          {activeTab === 'registered' && (
            <motion.div
              key="registered-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h4 className="text-base font-bold text-slate-800 mb-1">الطلاب المسجلين والنشطين بالرئيسية</h4>
                <p className="text-xs text-slate-400">هؤلاء هم الطلاب المقيدون في جداول المدرسة الحالية وتظهر بطاقاتهم وتفاصيلهم درجاتهم لكافة الزائرين على الصفحة الرئيسية مباشرة.</p>
              </div>

              {publishedStudents.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                  <Users className="w-10 h-10 text-slate-350 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-700">لا يوجد أي طلاب مسجلين بالرئيسية</p>
                  <p className="text-[11px] text-slate-450 mt-1">وافق على الطلبات المعلقة في "قائمة الانتظار" ليتم إدراجهم بالصفحة ونشرهم هنا.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-150 rounded-2xl bg-slate-50" id="registered-table-wrapper">
                  <table className="w-full text-right text-xs" id="registered-students-table">
                    <thead>
                      <tr className="bg-slate-200 border-b border-slate-150 text-slate-700 font-bold text-xs">
                        <th className="p-4 rounded-tr-2xl">اسم الطالب والسجل</th>
                        <th className="p-4">الصف الدراسي / الفصل</th>
                        <th className="p-4">درجة المعدل العام</th>
                        <th className="p-4 text-center">حالة الطالب</th>
                        <th className="p-4 rounded-tl-2xl text-center">خيارات التحكم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 bg-white">
                      {publishedStudents.map((student) => {
                        const parts = student.name.trim().split(/\s+/);
                        const fallbackChars = parts.length >= 2 ? `${parts[0][0]} ${parts[1][0]}` : 'ط';
                        const scoreVals = Object.values(student.grades) as number[];
                        const avg = scoreVals.length ? Math.round(scoreVals.reduce((a: number, b: number) => a + b, 0) / scoreVals.length) : 0;

                        return (
                          <tr key={student.id} className="hover:bg-slate-55 transition-colors" id={`table-row-${student.id}`}>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {student.imageUrl ? (
                                  <img src={student.imageUrl} alt={student.name} className="w-9 h-9 rounded-lg object-cover ring-2 ring-slate-100" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-950 font-bold flex items-center justify-center text-[10px]">
                                    {fallbackChars}
                                  </div>
                                )}
                                <span className="font-bold text-slate-800">{student.name}</span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-500 font-medium">{student.classroom}</td>
                            <td className="p-4 font-extrabold text-indigo-650">% {avg}</td>
                            <td className="p-4 text-center">
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                نشط على الرئيسية
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => {
                                  if (confirm(`هل أنت متأكد من حذف الطالب ${student.name} من الصفحة الرئيسية تماماً؟`)) {
                                    onDeleteStudent(student.id);
                                  }
                                }}
                                className="inline-flex py-1.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 hover:text-rose-700 rounded-xl transition-all font-bold gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                حذف من الرئيسية
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
