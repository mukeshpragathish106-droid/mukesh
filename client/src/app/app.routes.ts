import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { StudentDashboardComponent } from './features/student/student-dashboard.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard.component';
import { StaffDashboardComponent } from './features/staff/staff-dashboard.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'student',
    component: StudentDashboardComponent,
    canActivate: [authGuard],
    data: { roles: ['student', 'admin'] },
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [authGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'staff',
    component: StaffDashboardComponent,
    canActivate: [authGuard],
    data: { roles: ['staff', 'admin'] },
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
