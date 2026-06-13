import { useMemo } from 'react';
import { Student } from '../types';
import { X, Award, Quote, Calendar, Star, BookOpen, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
}

export default function StudentDetailModal({ student, onClose }: StudentDetailModalProps) {
  const averageGrade = useMemo(() => {
    if (!student) return 0;
    const grades = Object.values(student.grades);
    if (grades.length === 0) return 0;
    const sum = grades.reduce((acc, score) => acc + score, 0);
    return Math.round(sum / grades.length);
  }, [student]);

  // Find highest and lowest subjects
  const analysis = useMemo(() => {
    if (!student || Object.keys(student.grades).length === 0) {
      return { highest: null, lowest: null };
    }
    const entries = Object.entries(student.grades);
    let highest = entries[0];
    let lowest = entries[0];
    
    entries.forEach(([sub, score]) => {
      if (score > highest[1]) highest = [sub, score];
      if (score < lowest[1]) lowest = [sub, score];
    });

    return { highest, lowest };
  }, [student]);

  const initials = useMemo(() => {
    if (!student) return '';
    const parts = student.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]} ${parts[1][0]}`;
    }
    return parts[0] ? parts[0].substring(0, 2) : 'ط';
  }, [student]);

  if (!student) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="student-detail-modal-overlay">
        {/* Backdrop glass blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden relative z-10 border border-slate-100 flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]"
          id="student-detail-modal-card"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-full transition-all z-20 cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Sider Area - Profile Summary (Left column on RTL layout, right on LTR; layout adapts beautifully) */}
          <div className="md:w-5/12 bg-gradient-to-b from-indigo-950 to-slate-900 text-white p-8 flex flex-col justify-between overflow-y-auto border-l border-slate-800">
            <div>
              {/* Profile image container */}
              <div className="flex justify-center mb-6">
                {student.imageUrl && student.imageUrl.trim() !== "" ? (
                  <div className="relative">
                    <img
                      src={student.imageUrl}
                      alt={student.name}
                      className="w-28 h-28 rounded-3xl object-cover ring-4 ring-indigo-500/30 shadow-md"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                        if (sibling) sibling.style.display = 'flex';
                      }}
                    />
                    <div 
                      style={{ display: 'none' }}
                      className="w-28 h-28 rounded-3xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white font-black items-center justify-center text-3xl shadow-md"
                    >
                      {initials}
                    </div>
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-3xl bg-indigo-900/60 border border-indigo-700/50 text-indigo-100 text-3xl font-black flex items-center justify-center shadow-inner">
                    {initials}
                  </div>
                )}
              </div>

              {/* Student Metadata */}
              <div className="text-center">
                <h3 className="text-2xl font-bold tracking-tight mb-2">{student.name}</h3>
                <span className="inline-block text-xs font-semibold bg-indigo-505 bg-indigo-800/60 text-indigo-200 px-3 py-1 rounded-full border border-indigo-700/30">
                  {student.classroom}
                </span>
              </div>

              {/* Academic Highlights */}
              <div className="mt-8 space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-indigo-200">التقدير الدراسي</p>
                    <p className="text-sm font-bold text-slate-100">
                      {averageGrade >= 90 ? 'ممتاز (تفوق دراسي)' : averageGrade >= 75 ? 'جيد جداً' : averageGrade >= 50 ? 'مقبول' : 'تحتاج متابعة وتأهيل'}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-400/10 text-indigo-300 rounded-xl">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-indigo-200">تاريخ التسجيل</p>
                    <p className="text-sm font-bold text-slate-100">
                      {new Date(student.createdAt).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="mt-8 border-t border-white/5 pt-6 bg-indigo-950/20 rounded-xl relative">
              <div className="absolute top-4 right-4 text-indigo-500/20">
                <Quote className="w-12 h-12 rotate-180" />
              </div>
              <p className="text-xs font-bold text-indigo-300 mb-2 relative z-10">التقرير السلوكي وملاحظات المعلمين:</p>
              <p className="text-xs text-slate-300 leading-relaxed font-light italic relative z-10 bg-slate-900/40 p-3 rounded-xl">
                {student.notes && student.notes.trim() !== "" ? student.notes : "لا توجد ملاحظات سلوكية مضافة لهذا الطالب حالياً."}
              </p>
            </div>
          </div>

          {/* Grades List & SVG Visual Charts Area */}
          <div className="md:w-7/12 p-8 overflow-y-auto flex flex-col justify-between" id="modal-grades-area">
            <div>
              <div className="flex items-center gap-2 pb-5 border-b border-slate-100 mb-6">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h4 className="text-lg font-bold text-slate-900">البيانات والدرجات التفصيلية للمواد</h4>
              </div>

              {/* Progress list of grades */}
              <div className="space-y-4 mb-6" id="grades-bars-list">
                {Object.entries(student.grades).map(([subject, score]) => {
                  // Color calculation based on the score
                  let colorClass = "bg-emerald-500";
                  let textClass = "text-emerald-700";
                  if (score < 50) {
                    colorClass = "bg-rose-500";
                    textClass = "text-rose-700";
                  } else if (score < 75) {
                    colorClass = "bg-amber-500";
                    textClass = "text-amber-700";
                  }

                  return (
                    <div key={subject} className="flex flex-col gap-1.5" id={`grade-bar-${subject}`}>
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-700">{subject}</span>
                        <span className={textClass}>{score} / 100</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden block">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`h-full rounded-full ${colorClass}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Analysis card details at bottom */}
            <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Overall circle progress gauge in pure styled SVG */}
              <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center border border-slate-100 col-span-1">
                <span className="text-[11px] text-slate-400 font-bold mb-2">المعدل النهائي</span>
                <div className="relative w-18 h-18 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="36"
                      cy="36"
                      r="30"
                      className="stroke-slate-200 fill-none"
                      strokeWidth="5"
                    />
                    <circle
                      cx="36"
                      cy="36"
                      r="30"
                      className="stroke-indigo-600 fill-none"
                      strokeWidth="5"
                      strokeDasharray="188.4"
                      strokeDashoffset={188.4 - (188.4 * averageGrade) / 100}
                    />
                  </svg>
                  <span className="text-lg font-black text-indigo-950 relative z-10">%{averageGrade}</span>
                </div>
              </div>

              {/* Strength & Improvement Areas */}
              <div className="md:col-span-2 space-y-2">
                {analysis.highest && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2.5">
                    <Star className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-[11px] text-emerald-600 font-semibold leading-none">مادة التميز والتفوق</p>
                      <p className="text-xs font-bold text-emerald-950 mt-1">
                        الطالب بارع في <span className="underline">{analysis.highest[0]}</span> محققاً نسبة <span className="font-extrabold">{analysis.highest[1]}%</span>
                      </p>
                    </div>
                  </div>
                )}

                {analysis.lowest && (
                  <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${analysis.lowest[1] < 60 ? 'bg-rose-50 border-rose-100' : 'bg-indigo-50 border-indigo-100'}`}>
                    <AlertCircle className={`w-5 h-5 shrink-0 ${analysis.lowest[1] < 60 ? 'text-rose-600' : 'text-indigo-600'}`} />
                    <div>
                      <p className={`text-[11px] font-semibold leading-none ${analysis.lowest[1] < 60 ? 'text-rose-600' : 'text-indigo-600'}`}>مادة تحتاج دعم إضافي</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">
                        أقل مادة نسبة <span className="underline">{analysis.lowest[0]}</span> بمعدل <span className="font-extrabold">{analysis.lowest[1]}%</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
