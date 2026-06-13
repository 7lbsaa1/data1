import { useMemo } from 'react';
import { Student } from '../types';
import { Users, GraduationCap, Clock, Cloud, Database } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardStatsProps {
  students: Student[];
  isCloud: boolean;
}

export default function DashboardStats({ students, isCloud }: DashboardStatsProps) {
  const stats = useMemo(() => {
    const published = students.filter(s => s.status === 'published');
    const waiting = students.filter(s => s.status === 'waiting');
    
    let sumAverage = 0;
    let studentWithGradesCount = 0;
    
    published.forEach(student => {
      const gradesArray = Object.values(student.grades);
      if (gradesArray.length > 0) {
        const studentAvg = gradesArray.reduce((sum, val) => sum + val, 0) / gradesArray.length;
        sumAverage += studentAvg;
        studentWithGradesCount++;
      }
    });
    
    const schoolAverage = studentWithGradesCount > 0 
      ? Math.round(sumAverage / studentWithGradesCount) 
      : 0;

    return {
      totalPublished: published.length,
      totalWaiting: waiting.length,
      schoolAverage
    };
  }, [students]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" id="dashboard-stats-grid">
      {/* Total Students Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"
        id="stat-card-total"
      >
        <div>
          <p className="text-slate-500 text-sm font-medium">الطلاب المسجلين</p>
          <h3 className="text-3xl font-extrabold text-indigo-950 mt-1">{stats.totalPublished}</h3>
          <p className="text-xs text-slate-400 mt-1">تظهر بطاقاتهم في الصفحة الرئيسية</p>
        </div>
        <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
          <Users className="w-6 h-6" />
        </div>
      </motion.div>

      {/* School Average Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"
        id="stat-card-avg"
      >
        <div>
          <p className="text-slate-500 text-sm font-medium">المعدل العام للمدرسة</p>
          <div className="flex items-baseline gap-1 mt-1">
            <h3 className="text-3xl font-extrabold text-emerald-600">{stats.schoolAverage}</h3>
            <span className="text-sm font-semibold text-emerald-500">%</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">متوسط درجات المواد لجميع الطلاب</p>
        </div>
        <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
          <GraduationCap className="w-6 h-6" />
        </div>
      </motion.div>

      {/* Waiting List Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"
        id="stat-card-waiting"
      >
        <div>
          <p className="text-slate-500 text-sm font-medium">قائمة الانتظار</p>
          <h3 className="text-3xl font-extrabold text-amber-600 mt-1">{stats.totalWaiting}</h3>
          <p className="text-xs text-slate-400 mt-1">طلاب قيد المراجعة والاعتماد</p>
        </div>
        <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl">
          <Clock className="w-6 h-6" />
        </div>
      </motion.div>

      {/* Database Integration Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"
        id="stat-card-db"
      >
        <div>
          <p className="text-slate-500 text-sm font-medium">حالة قاعدة البيانات</p>
          <h3 className={`text-base font-bold mt-2 ${isCloud ? 'text-indigo-600' : 'text-slate-600'}`}>
            {isCloud ? 'Firebase سحابية' : 'محلية LocalStorage'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isCloud ? 'تزامن آمن ولحظي نشط' : 'تخزين متصفح محلي كبديل'}
          </p>
        </div>
        <div className={`p-3.5 rounded-2xl ${isCloud ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-150 text-slate-600'}`}>
          {isCloud ? <Cloud className="w-6 h-6 animate-pulse" /> : <Database className="w-6 h-6" />}
        </div>
      </motion.div>
    </div>
  );
}
