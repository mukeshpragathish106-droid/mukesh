import { Component, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ProfileModalComponent } from './profile-modal.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, ProfileModalComponent],
  template: `
    <aside class="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col justify-between border-r border-slate-800 shrink-0">
      <div class="p-4 space-y-6">
        <!-- Dashboard Scope Card / My Profile Trigger -->
        <button
          (click)="showProfileModal.set(true)"
          class="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 flex items-center gap-3 transition text-left group"
          title="Click to view & edit profile photo"
        >
          <div class="relative shrink-0">
            <img
              [src]="authService.currentUser()?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'"
              alt="Avatar"
              class="w-10 h-10 rounded-xl object-cover border border-slate-600 group-hover:border-blue-400 transition"
            />
            <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] border border-slate-900">
              📷
            </span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold text-white group-hover:text-blue-400 transition truncate">
                {{ authService.currentUser()?.name }}
              </p>
              <span class="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300">Edit</span>
            </div>
            <p class="text-[11px] text-slate-400 truncate">
              {{ authService.currentUser()?.department || 'Student Desk' }}
            </p>
          </div>
        </button>

        <!-- Student Nav Items -->
        <div *ngIf="authService.role() === 'student'" class="space-y-1">
          <div class="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Student Desk
          </div>
          <a
            routerLink="/student"
            routerLinkActive="bg-blue-600 text-white font-medium shadow-md shadow-blue-600/20"
            [routerLinkActiveOptions]="{ exact: true }"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm hover:bg-slate-800 transition text-slate-300 hover:text-white"
          >
            <svg class="w-5 h-5 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>My Complaints</span>
          </a>

          <a
            routerLink="/student"
            [queryParams]="{ tab: 'new' }"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-500/25 hover:opacity-95 transition mt-2"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Lodge Complaint</span>
          </a>

          <a
            routerLink="/student"
            [queryParams]="{ tab: 'campus-feed' }"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm hover:bg-slate-800 transition text-slate-300 hover:text-white"
          >
            <svg class="w-5 h-5 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span>Campus Live Feed</span>
          </a>

          <button
            (click)="showProfileModal.set(true)"
            class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm hover:bg-slate-800 transition text-slate-300 hover:text-white text-left"
          >
            <svg class="w-5 h-5 opacity-90 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>My Profile & Photo</span>
          </button>
        </div>

        <!-- Admin Nav Items -->
        <div *ngIf="authService.role() === 'admin'" class="space-y-1">
          <div class="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Admin Central
          </div>
          <a
            routerLink="/admin"
            routerLinkActive="bg-blue-600 text-white font-medium shadow-md shadow-blue-600/20"
            [routerLinkActiveOptions]="{ exact: true }"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm hover:bg-slate-800 transition text-slate-300 hover:text-white"
          >
            <svg class="w-5 h-5 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Dashboard & Overview</span>
          </a>

          <a
            routerLink="/admin"
            [queryParams]="{ tab: 'complaints' }"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm hover:bg-slate-800 transition text-slate-300 hover:text-white"
          >
            <svg class="w-5 h-5 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>All Complaints</span>
          </a>

          <a
            routerLink="/admin"
            [queryParams]="{ tab: 'hotspots' }"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm hover:bg-slate-800 transition text-slate-300 hover:text-white"
          >
            <svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Campus Hotspots</span>
          </a>

          <a
            routerLink="/admin"
            [queryParams]="{ tab: 'users' }"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm hover:bg-slate-800 transition text-slate-300 hover:text-white"
          >
            <svg class="w-5 h-5 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Manage Users</span>
          </a>
        </div>

        <!-- Staff Nav Items -->
        <div *ngIf="authService.role() === 'staff'" class="space-y-1">
          <div class="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Maintenance Team
          </div>
          <a
            routerLink="/staff"
            routerLinkActive="bg-blue-600 text-white font-medium shadow-md shadow-blue-600/20"
            [routerLinkActiveOptions]="{ exact: true }"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm hover:bg-slate-800 transition text-slate-300 hover:text-white"
          >
            <svg class="w-5 h-5 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Assigned Tasks</span>
          </a>
        </div>
      </div>

      <!-- Bottom System Status Card -->
      <div class="p-4 border-t border-slate-800 space-y-3">
        <div class="flex items-center gap-2 text-xs text-slate-400">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Socket.IO Real-time Sync</span>
        </div>

        <div class="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-300">
          <p class="font-semibold text-white flex items-center gap-1.5">
            <span>📞</span> 24/7 Campus Control
          </p>
          <p class="text-slate-400 mt-1">+91 98765-43210 (Ext 108)</p>
          <p class="text-slate-400">helpdesk&#64;campus.edu</p>
        </div>
      </div>

      <app-profile-modal *ngIf="showProfileModal()" (close)="showProfileModal.set(false)"></app-profile-modal>
    </aside>
  `,
})
export class SidebarComponent {
  authService = inject(AuthService);
  showProfileModal = signal<boolean>(false);
}
