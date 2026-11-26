import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { NotificationService } from '../core/services/notification.service';
import { ToastService } from '../core/services/toast.service';
import { ProfileModalComponent } from './profile-modal.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, ProfileModalComponent],
  template: `
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div class="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <!-- Left: Logo & Brand -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-900 tracking-tight text-base sm:text-lg">SmartCampus</span>
              <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200/60">CMMS</span>
            </div>
            <p class="text-xs text-slate-500 hidden sm:block">Campus Complaint & Maintenance Management</p>
          </div>
        </div>

        <!-- Center: Quick Role Switcher (Convenient for test & demo) -->
        <div class="hidden md:flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
          <span class="text-xs font-medium text-slate-500 px-2 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Role:
          </span>
          <button
            (click)="switchRole('student')"
            [ngClass]="authService.role() === 'student' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'"
            class="px-3 py-1 rounded-lg text-xs transition flex items-center gap-1"
          >
            <span>👨‍🎓</span> Student
          </button>
          <button
            (click)="switchRole('staff')"
            [ngClass]="authService.role() === 'staff' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'"
            class="px-3 py-1 rounded-lg text-xs transition flex items-center gap-1"
          >
            <span>🛠️</span> Staff
          </button>
          <button
            (click)="switchRole('admin')"
            [ngClass]="authService.role() === 'admin' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'"
            class="px-3 py-1 rounded-lg text-xs transition flex items-center gap-1"
          >
            <span>🛡️</span> Admin
          </button>
        </div>

        <!-- Right: Notifications, User Profile & Actions -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Notification Bell -->
          <div class="relative">
            <button
              (click)="toggleNotifications()"
              class="relative p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition border border-transparent hover:border-blue-100"
              title="Notifications"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <!-- Unread Badge -->
              <span
                *ngIf="notificationService.unreadCount() > 0"
                class="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse"
              >
                {{ notificationService.unreadCount() }}
              </span>
            </button>

            <!-- Notification Dropdown -->
            <div
              *ngIf="showNotifications()"
              class="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fade-in"
            >
              <div class="px-4 py-3 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-sm">Notifications</span>
                  <span *ngIf="notificationService.unreadCount() > 0" class="px-2 py-0.5 text-[11px] font-semibold bg-blue-500/40 rounded-full">
                    {{ notificationService.unreadCount() }} new
                  </span>
                </div>
                <button
                  (click)="markAllRead()"
                  class="text-xs text-blue-200 hover:text-white underline hover:no-underline"
                >
                  Mark all read
                </button>
              </div>

              <div class="max-h-80 overflow-y-auto divide-y divide-slate-100">
                <div *ngIf="notificationService.notifications().length === 0" class="p-6 text-center text-slate-400 text-sm">
                  No notifications yet.
                </div>
                <div
                  *ngFor="let notif of notificationService.notifications()"
                  (click)="onNotificationClick(notif)"
                  class="p-3.5 hover:bg-slate-50 transition cursor-pointer flex gap-3 items-start"
                  [ngClass]="{ 'bg-blue-50/40': !notif.isRead }"
                >
                  <div
                    class="w-2 h-2 mt-1.5 rounded-full shrink-0"
                    [ngClass]="notif.isRead ? 'bg-slate-300' : 'bg-blue-600'"
                  ></div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold text-slate-800" [ngClass]="{ 'font-bold text-blue-900': !notif.isRead }">
                      {{ notif.title }}
                    </p>
                    <p class="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {{ notif.message }}
                    </p>
                    <span class="text-[10px] text-slate-400 mt-1 block">
                      {{ notif.createdAt | date: 'shortTime' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- User Profile & Logout -->
          <div class="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
            <button
              (click)="openProfileModal()"
              class="flex items-center gap-2 p-1 rounded-xl hover:bg-blue-50/80 transition text-left group"
              title="Click to view & edit profile photo"
            >
              <div class="relative">
                <img
                  [src]="authService.currentUser()?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'"
                  alt="Avatar"
                  class="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-xs group-hover:border-blue-500 transition"
                />
                <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] shadow-xs">
                  📷
                </span>
              </div>
              <div class="hidden lg:block text-left">
                <p class="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition truncate max-w-[120px]">
                  {{ authService.currentUser()?.name }}
                </p>
                <p class="text-[10px] font-medium text-blue-600 uppercase tracking-wider">
                  {{ authService.currentUser()?.role }}
                </p>
              </div>
            </button>

            <!-- Logout button -->
            <button
              (click)="logout()"
              class="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-100"
              title="Sign Out"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Profile Modal Component -->
      <app-profile-modal *ngIf="showProfileModal()" (close)="showProfileModal.set(false)"></app-profile-modal>
    </header>
  `,
})
export class NavbarComponent {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  toastService = inject(ToastService);
  router = inject(Router);

  showNotifications = signal<boolean>(false);
  showProfileModal = signal<boolean>(false);

  toggleNotifications(): void {
    this.showNotifications.update(v => !v);
  }

  openProfileModal(): void {
    this.showProfileModal.set(true);
  }

  markAllRead(): void {
    this.notificationService.markAllRead().subscribe({
      next: () => this.toastService.success('Notifications', 'All marked as read'),
    });
  }

  onNotificationClick(notif: any): void {
    if (!notif.isRead) {
      this.notificationService.markAsRead(notif._id || notif.id).subscribe();
    }
    this.showNotifications.set(false);
  }

  switchRole(targetRole: string): void {
    this.authService.demoLogin(targetRole).subscribe({
      next: res => {
        this.toastService.success('Switched Role', res.message);
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.toastService.info('Signed Out', 'You have been safely logged out.');
  }
}
