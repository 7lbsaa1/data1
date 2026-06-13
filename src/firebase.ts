import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import { Student, StudentStatus, MOCK_STUDENTS } from './types';

// The user provided Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCk9l8XNO4y-6qnaOqKsfAKQPbaemOOHrU",
  authDomain: "students-d06e7.firebaseapp.com",
  projectId: "students-d06e7",
  storageBucket: "students-d06e7.firebasestorage.app",
  messagingSenderId: "932035308750",
  appId: "1:932035308750:web:781364ca90256bca80749f",
  measurementId: "G-6VBEFTCHVG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Operational types for debug info
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  timestamp: string;
}

// Error handling standard from Firebase skill
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    timestamp: new Date().toISOString()
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Validation to test Firestore connection
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    // Attempt a light live call
    await getDocFromServer(doc(db, 'students', '__connection_test__'));
    return true;
  } catch (err) {
    console.warn("Firebase collection access failed, running in sandbox or standard client fallback mode.");
    return false;
  }
}

// Load default local storage structure if empty
function initializeLocalStorageDB() {
  if (!localStorage.getItem('student_db_initialized')) {
    const list: Student[] = MOCK_STUDENTS.map(student => ({
      ...student,
      createdAt: Date.now() - Math.random() * 86400000 * 5 // random recent time
    }));
    localStorage.setItem('student_db_list', JSON.stringify(list));
    localStorage.setItem('student_db_initialized', 'true');
  }
}

// Low level local storage wrappers
export function getLocalStudents(): Student[] {
  initializeLocalStorageDB();
  try {
    const stored = localStorage.getItem('student_db_list');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Local storage read failed", e);
    return [];
  }
}

export function saveLocalStudents(students: Student[]) {
  localStorage.setItem('student_db_list', JSON.stringify(students));
}

/**
 * Sync logic: reads from Firestore first. If it succeeds, returns Firestore data.
 * If it fails, or is empty, we offer to seed it or fallback to localStorage.
 * Additionally, we automatically keep LocalStorage matched to Firestore if both work, 
 * which guarantees an incredible real-time feel regardless of cloud constraints.
 */
export async function fetchStudents(): Promise<{ students: Student[]; isCloud: boolean }> {
  try {
    const studentsCol = collection(db, 'students');
    const qSnapshot = await getDocs(studentsCol);
    
    if (qSnapshot.empty) {
      // If Firestore is empty, we will seed it with our initial mock students
      const local = getLocalStudents();
      // Try to seed Firestore in the background so it's not empty!
      try {
        for (const student of local) {
          await addDoc(collection(db, 'students'), {
            name: student.name,
            classroom: student.classroom,
            grades: student.grades,
            notes: student.notes || "",
            imageUrl: student.imageUrl || "",
            status: student.status,
            createdAt: student.createdAt
          });
        }
        // fetch again to get actual ids
        const refetched = await getDocs(studentsCol);
        const list: Student[] = [];
        refetched.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            name: data.name || '',
            classroom: data.classroom || '',
            grades: data.grades || {},
            notes: data.notes || '',
            imageUrl: data.imageUrl || '',
            status: data.status || 'waiting',
            createdAt: data.createdAt || Date.now()
          });
        });
        saveLocalStudents(list);
        return { students: list, isCloud: true };
      } catch (seedErr) {
        // Fallback to local
        return { students: local, isCloud: false };
      }
    }

    const list: Student[] = [];
    qSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        name: data.name || '',
        classroom: data.classroom || '',
        grades: data.grades || {},
        notes: data.notes || '',
        imageUrl: data.imageUrl || '',
        status: data.status || 'waiting',
        createdAt: data.createdAt || Date.now()
      });
    });

    // Sync to local storage for quick access next time or offline fallback
    saveLocalStudents(list);
    return { students: list, isCloud: true };

  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'students');
    // Fallback to LocalStorage
    return { students: getLocalStudents(), isCloud: false };
  }
}

export async function addStudentToDatabase(student: Omit<Student, 'id' | 'createdAt'>): Promise<{ student: Student; isCloud: boolean }> {
  const newStudent: Student = {
    id: 'local-' + Math.random().toString(36).substr(2, 9),
    ...student,
    createdAt: Date.now()
  };

  // Add locally first
  const currentLocal = getLocalStudents();
  const updatedLocal = [newStudent, ...currentLocal];
  saveLocalStudents(updatedLocal);

  // Try to add to Firestore
  try {
    const docRef = await addDoc(collection(db, 'students'), {
      name: student.name,
      classroom: student.classroom,
      grades: student.grades,
      notes: student.notes,
      imageUrl: student.imageUrl || '',
      status: student.status,
      createdAt: newStudent.createdAt
    });
    
    // Replace temporary local ID with actual firestore ID
    newStudent.id = docRef.id;
    const finalLocal = updatedLocal.map(s => s.id.startsWith('local-') && s.name === student.name ? { ...s, id: docRef.id } : s);
    saveLocalStudents(finalLocal);

    return { student: newStudent, isCloud: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'students');
    return { student: newStudent, isCloud: false };
  }
}

export async function updateStudentStatusInDatabase(id: string, newStatus: StudentStatus): Promise<boolean> {
  // Update locally
  const currentLocal = getLocalStudents();
  const updated = currentLocal.map(s => s.id === id ? { ...s, status: newStatus } : s);
  saveLocalStudents(updated);

  // Update in Firestore
  try {
    const docRef = doc(db, 'students', id);
    await updateDoc(docRef, { status: newStatus });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `students/${id}`);
    return false; // False indicates it was updated locally only
  }
}

export async function deleteStudentFromDatabase(id: string): Promise<boolean> {
  // Delete locally
  const currentLocal = getLocalStudents();
  const updated = currentLocal.filter(s => s.id !== id);
  saveLocalStudents(updated);

  // Delete in Firestore
  try {
    const docRef = doc(db, 'students', id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `students/${id}`);
    return false; // Updated locally only
  }
}
