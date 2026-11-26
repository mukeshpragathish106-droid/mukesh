export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: 'student' | 'staff' | 'admin';
  department?: string;
  phone?: string;
  studentId?: string;
  avatar?: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
}
