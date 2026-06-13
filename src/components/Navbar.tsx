import { School, Search, ShieldAlert, BookOpen, SlidersHorizontal } from 'lucide-react';
import { motion } from 'motion/react';

interface NavbarProps {
  isAdminView: boolean;
  setIsAdminView: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedClass: string;
  setSelectedClass: (val: string) => void;
  availableClasses: string[];
}

export default function Navbar({
  isAdminView,
  setIsAdminView,
  searchQuery,
  setSearchQuery,
  selectedClass,
  setSelectedClass,
  availableClasses
}: NavbarProps) {
  return (
    <header className="bg-white border-b border-slate-150 sticky top-0 z-40 shadow-sm" id="main-navigation-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* School Brand identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsAdminView(false)}>
            <div className="p-3 bg-indigo-650 text-white rounded-2xl shadow-md shadow-indigo-600/15">
              <School className="w-6 h-6" />
            </div>
            <div className="text-right">
              <h1 className="text-lg font-black tracking-tight text-indigo-950">مدارس التميز النموذجية</h1>
              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">منصة السجلات الدراسية للطلاب متصل وسهل الرفع</span>
            </div>
          </div>

          {/* Center search element (Hide when in admin panel view) */}
          {!isAdminView ? (
            <div className="hidden md:flex items-center gap-3 w-1/3 text-right" id="header-search-bar">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="ابحث باسم الطالب أو درجات المواد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
                />
                <Search className="w-4 h-4 text-slate-350 absolute top-3 right-3.5" />
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 text-indigo-900 bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-xl font-bold text-xs">
              <BookOpen className="w-4.5 h-4.5" />
              <span>لوحة تحكم معززة</span>
            </div>
          )}

          {/* Action toggle button to move between admin / homepage */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAdminView(!isAdminView)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer border ${
                isAdminView 
                  ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800' 
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-100'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{isAdminView ? 'العودة للرئيسية' : 'بوابة المعلمين والمشرفين'}</span>
            </button>
          </div>

        </div>

        {/* Responsive Lower Search & Filter Bar (Show only on public viewport when not in Admin panel) */}
        {!isAdminView && (
          <div className="py-3 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between" id="filter-bar">
            {/* Input mobile search */}
            <div className="relative w-full sm:w-72 md:hidden">
              <input
                type="text"
                placeholder="ابحث باسم الطالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium"
              />
              <Search className="w-4 h-4 text-slate-350 absolute top-3.5 right-3.5" />
            </div>

            {/* Classroom category filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0" id="class-button-filters">
              <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0 ml-1.5" />
              <button
                onClick={() => setSelectedClass('')}
                className={`py-1.5 px-3.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${selectedClass === '' ? 'bg-indigo-650 text-white shadow-sm' : 'bg-slate-50 text-slate-650 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'}`}
              >
                الكل
              </button>
              {availableClasses.map((classroom) => (
                <button
                  key={classroom}
                  onClick={() => setSelectedClass(classroom)}
                  className={`py-1.5 px-3.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${selectedClass === classroom ? 'bg-indigo-650 text-white shadow-sm' : 'bg-slate-50 text-slate-650 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'}`}
                >
                  {classroom}
                </button>
              ))}
            </div>

            {/* Quick stats label */}
            <div className="hidden sm:block text-[11px] font-semibold text-slate-400">
              اختر فصلاً دراسياً لتصفية السجلات المعروضة أدناه
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
