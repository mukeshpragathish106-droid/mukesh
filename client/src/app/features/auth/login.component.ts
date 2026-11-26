import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <!-- Background glowing orb effects -->
      <div class="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none"></div>

      <div class="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 z-10 animate-fade-in">
        <!-- Left Banner: Campus Features Overview -->
        <div class="lg:col-span-5 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-8 sm:p-10 text-white flex flex-col justify-between relative">
          <div class="space-y-6">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
                <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 class="text-xl font-bold tracking-tight">Smart Campus CMMS</h1>
                <p class="text-xs text-blue-200">Complaint & Maintenance System</p>
              </div>
            </div>

            <div class="pt-4">
              <h2 class="text-2xl sm:text-3xl font-extrabold leading-tight">
                Modern Campus Facility Management
              </h2>
              <p class="text-sm text-blue-100/90 mt-3 leading-relaxed">
                Report damaged benches, broken fans, electrical hazards, water leakages, Wi-Fi outages, and classroom issues with real-time tracking.
              </p>
            </div>

            <!-- Feature Badges -->
            <div class="space-y-3 pt-2">
              <div class="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <span class="text-xl">✨</span>
                <div>
                  <p class="text-xs font-semibold">AI Automated Categorization</p>
                  <p class="text-[11px] text-blue-200">Instant NLP detection for category & priority</p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <span class="text-xl">🔍</span>
                <div>
                  <p class="text-xs font-semibold">Smart Duplicate Detection</p>
                  <p class="text-[11px] text-blue-200">Alerts students to active issues in same room</p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <span class="text-xl">⚡</span>
                <div>
                  <p class="text-xs font-semibold">Real-Time Socket.IO Sync</p>
                  <p class="text-[11px] text-blue-200">Live work updates from technician to student</p>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-6 border-t border-white/15 text-[11px] text-blue-200 flex items-center justify-between">
            <span>Enterprise Edition 2026</span>
            <span class="flex items-center gap-1.5 text-emerald-300 font-medium">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              All Systems Operational
            </span>
          </div>
        </div>

        <!-- Right Side: Auth Forms & One-Click Demo Access -->
        <div class="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white">
          <div>
            <!-- Quick Demo One-Click Access Banner -->
            <div class="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200/80">
              <div class="flex items-center justify-between mb-2.5">
                <div class="flex items-center gap-2">
                  <span class="flex h-2 w-2 rounded-full bg-blue-600 animate-ping"></span>
                  <span class="text-xs font-bold text-blue-900 uppercase tracking-wider">⚡ Instant 1-Click Demo Login</span>
                </div>
                <span class="text-[11px] text-slate-500 font-medium">No typing required</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  (click)="quickDemo('student')"
                  [disabled]="loading()"
                  class="p-2.5 rounded-xl bg-white border border-blue-200 hover:border-blue-500 hover:shadow-md transition text-left group flex flex-col justify-between"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-lg">👨‍🎓</span>
                    <span class="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Student</span>
                  </div>
                  <div class="mt-2">
                    <p class="text-xs font-bold text-slate-800 group-hover:text-blue-700">Mukesh Patel</p>
                    <p class="text-[10px] text-slate-500">CS & Engineering</p>
                  </div>
                </button>

                <button
                  type="button"
                  (click)="quickDemo('staff')"
                  [disabled]="loading()"
                  class="p-2.5 rounded-xl bg-white border border-amber-200 hover:border-amber-500 hover:shadow-md transition text-left group flex flex-col justify-between"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-lg">🛠️</span>
                    <span class="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Staff</span>
                  </div>
                  <div class="mt-2">
                    <p class="text-xs font-bold text-slate-800 group-hover:text-amber-700">Rajesh Kumar</p>
                    <p class="text-[10px] text-slate-500">Electrical Tech</p>
                  </div>
                </button>

                <button
                  type="button"
                  (click)="quickDemo('admin')"
                  [disabled]="loading()"
                  class="p-2.5 rounded-xl bg-white border border-indigo-200 hover:border-indigo-500 hover:shadow-md transition text-left group flex flex-col justify-between"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-lg">🛡️</span>
                    <span class="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">Admin</span>
                  </div>
                  <div class="mt-2">
                    <p class="text-xs font-bold text-slate-800 group-hover:text-indigo-700">Dr. Sundaram</p>
                    <p class="text-[10px] text-slate-500">Facilities Chief</p>
                  </div>
                </button>
              </div>
            </div>

            <!-- Tabs: Sign In / Register -->
            <div class="flex border-b border-slate-200 mb-6">
              <button
                type="button"
                (click)="activeTab.set('login')"
                [ngClass]="activeTab() === 'login' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'"
                class="flex-1 py-3 border-b-2 text-sm text-center transition"
              >
                Sign In to Account
              </button>
              <button
                type="button"
                (click)="activeTab.set('register')"
                [ngClass]="activeTab() === 'register' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'"
                class="flex-1 py-3 border-b-2 text-sm text-center transition"
              >
                Register New Student
              </button>
            </div>

            <!-- Sign In Form -->
            <form *ngIf="activeTab() === 'login'" (ngSubmit)="onLogin()" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Campus Email Address</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    [(ngModel)]="loginEmail"
                    name="email"
                    required
                    placeholder="e.g. mukesh.patel@campus.edu"
                    class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    [(ngModel)]="loginPassword"
                    name="password"
                    required
                    placeholder="Enter your password (e.g. password123)"
                    class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm outline-hidden transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                [disabled]="loading()"
                class="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span *ngIf="loading()" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>{{ loading() ? 'Authenticating...' : 'Sign In to Campus CMMS' }}</span>
              </button>
            </form>

            <!-- Register Form -->
            <form *ngIf="activeTab() === 'register'" (ngSubmit)="onRegister()" class="space-y-3.5">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    [(ngModel)]="regName"
                    name="name"
                    required
                    placeholder="Mukesh Patel"
                    class="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm outline-hidden"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Student Roll / ID</label>
                  <input
                    type="text"
                    [(ngModel)]="regStudentId"
                    name="studentId"
                    placeholder="CS2026-088"
                    class="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Campus Email</label>
                <input
                  type="email"
                  [(ngModel)]="regEmail"
                  name="email"
                  required
                  placeholder="student.name@campus.edu"
                  class="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm outline-hidden"
                />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Department</label>
                  <select
                    [(ngModel)]="regDepartment"
                    name="department"
                    class="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm outline-hidden bg-white"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Business Administration">Business Administration</option>
                    <option value="Sciences & Humanities">Sciences & Humanities</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="tel"
                    [(ngModel)]="regPhone"
                    name="phone"
                    placeholder="+91 98765 00000"
                    class="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Create Password</label>
                <input
                  type="password"
                  [(ngModel)]="regPassword"
                  name="password"
                  required
                  placeholder="Minimum 6 characters"
                  class="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm outline-hidden"
                />
              </div>

              <button
                type="submit"
                [disabled]="loading()"
                class="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                <span *ngIf="loading()" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>{{ loading() ? 'Creating Student Account...' : 'Complete Registration' }}</span>
              </button>
            </form>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-100 text-center">
            <p class="text-xs text-slate-500">
              Demo passwords are all set to <span class="font-mono font-semibold text-slate-700">password123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);

  activeTab = signal<'login' | 'register'>('login');
  loading = signal<boolean>(false);

  // Login model
  loginEmail = 'mukesh.patel@campus.edu';
  loginPassword = 'password123';

  // Register model
  regName = '';
  regEmail = '';
  regPassword = '';
  regDepartment = 'Computer Science & Engineering';
  regStudentId = '';
  regPhone = '';

  onLogin(): void {
    if (!this.loginEmail || !this.loginPassword) {
      this.toastService.warning('Validation', 'Please provide email and password.');
      return;
    }

    this.loading.set(true);
    this.authService.login({ email: this.loginEmail, password: this.loginPassword }).subscribe({
      next: res => {
        this.loading.set(false);
        this.toastService.success('Welcome Back!', `Signed in as ${res.user.name}`);
        this.authService.redirectByRole(res.user.role);
      },
      error: err => {
        this.loading.set(false);
        this.toastService.error('Sign In Failed', err.error?.message || 'Invalid credentials');
      },
    });
  }

  onRegister(): void {
    if (!this.regName || !this.regEmail || !this.regPassword) {
      this.toastService.warning('Validation', 'Name, email, and password are required.');
      return;
    }

    this.loading.set(true);
    const payload = {
      name: this.regName,
      email: this.regEmail,
      password: this.regPassword,
      department: this.regDepartment,
      studentId: this.regStudentId,
      phone: this.regPhone,
    };

    this.authService.register(payload).subscribe({
      next: res => {
        this.loading.set(false);
        this.toastService.success('Account Created', 'Registration successful! Redirecting to student desk.');
        this.authService.redirectByRole('student');
      },
      error: err => {
        this.loading.set(false);
        this.toastService.error('Registration Error', err.error?.message || 'Could not create account');
      },
    });
  }

  quickDemo(role: string): void {
    this.loading.set(true);
    this.authService.demoLogin(role).subscribe({
      next: res => {
        this.loading.set(false);
        this.toastService.success('Demo Login', res.message);
      },
      error: err => {
        this.loading.set(false);
        this.toastService.error('Demo Login Failed', err.error?.message || 'Unable to switch account');
      },
    });
  }
}
