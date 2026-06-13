export interface SubjectGrades {
  [subjectName: string]: number;
}

export type StudentStatus = 'waiting' | 'published';

export interface Student {
  id: string;
  name: string;
  classroom: string;
  grades: SubjectGrades;
  notes: string;
  imageUrl?: string;
  status: StudentStatus;
  createdAt: number;
}

export const DEFAULT_SUBJECTS = [
  "اللغة العربية",
  "الرياضيات",
  "العلوم",
  "الدراسات الاجتماعية",
  "اللغة الإنجليزية",
  "الحاسب الآلي"
];

export const MOCK_STUDENTS: Omit<Student, 'createdAt'>[] = [
  {
    id: "mock-1",
    name: "عبد الرحمن أحمد الرفاعي",
    classroom: "الصف الأول الثانوي - شعبة أ",
    grades: {
      "اللغة العربية": 98,
      "الرياضيات": 95,
      "العلوم": 92,
      "الدراسات الاجتماعية": 90,
      "اللغة الإنجليزية": 94,
      "الحاسب الآلي": 100
    },
    notes: "طالب متميز يظهر شغفاً عالياً بالبرمجيات والحلول التقنية، وسلوك مهذب ومبهر.",
    imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
    status: "published"
  },
  {
    id: "mock-2",
    name: "سارة محمود الخالدي",
    classroom: "الصف الثاني الثانوي - شعبة ج",
    grades: {
      "اللغة العربية": 99,
      "الرياضيات": 88,
      "العلوم": 96,
      "الدراسات الاجتماعية": 97,
      "اللغة الإنجليزية": 99,
      "الحاسب الآلي": 95
    },
    notes: "طالبة متفوقة في اللغات والعلوم الإنسانية، تشارك بانتظام في الأنشطة المدرسية والصحافة المدرسية.",
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    status: "published"
  },
  {
    id: "mock-3",
    name: "خالد وليد الأنصاري",
    classroom: "الصف الأول الثانوي - شعبة ب",
    grades: {
      "اللغة العربية": 85,
      "الرياضيات": 99,
      "العلوم": 98,
      "الدراسات الاجتماعية": 80,
      "اللغة الإنجليزية": 87,
      "الحاسب الآلي": 99
    },
    notes: "لديه موهبة استثنائية في التحليل الرياضي والمنطق الفيزيائي. يطمح لأن يصبح مهندس برمجيات.",
    imageUrl: "", // No image test case
    status: "published"
  },
  {
    id: "mock-4",
    name: "فاطمة عمر السديري",
    classroom: "الصف الثالث الثانوي - علمي علوم",
    grades: {
      "اللغة العربية": 95,
      "الرياضيات": 91,
      "العلوم": 99,
      "الدراسات الاجتماعية": 92,
      "اللغة الإنجليزية": 96,
      "الحاسب الآلي": 94
    },
    notes: "طالبة ملهمة وذكية، تمثل المدرسة في مسابقات أولمبياد العلوم الأحياء.",
    imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200",
    status: "waiting" // Mock waiting list student
  }
];
