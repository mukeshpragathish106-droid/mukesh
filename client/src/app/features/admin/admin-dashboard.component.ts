import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { AdminService } from '../../core/services/admin.service';
import { ComplaintService } from '../../core/services/complaint.service';
import { SocketService } from '../../core/services/socket.service';
import { ToastService } from '../../core/services/toast.service';
import { Complaint } from '../../core/models/complaint.model';
import { User } from '../../core/models/user.model';
import { NavbarComponent } from '../../shared/navbar.component';
import { SidebarComponent } from '../../shared/sidebar.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent, SidebarComponent],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col">
      <app-navbar></app-navbar>

      <div class="flex-1 flex flex-col md:flex-row">
        <!-- Sidebar Navigation -->
        <app-sidebar class="hidden md:block"></app-sidebar>

        <!-- Main Content Area -->
        <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <!-- Top Admin Control Header -->
          <div class="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-300 border border-blue-400/30">
                  Campus Facilities Central Command
                </span>
                <span class="text-xs text-slate-400">Chief Administrator</span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
                Campus Admin & Maintenance Control
              </h1>
              <p class="text-slate-300 text-sm mt-1 max-w-xl">
                Real-time incident dispatch, automatic AI triage, staff assignment, campus problem hotspots, and comprehensive resolution analytics.
              </p>
            </div>

            <div class="flex items-center gap-2.5">
              <button
                (click)="loadAllData()"
                class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md transition flex items-center gap-1.5"
              >
                <span>🔄</span> Refresh Feed
              </button>
            </div>
          </div>

          <!-- Top KPI Metrics Ribbon -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Logged</span>
              <p class="text-2xl font-black text-slate-900 mt-1">{{ analytics()?.summary?.total || complaints().length }}</p>
              <span class="text-[10px] text-slate-400">All campus blocks</span>
            </div>

            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Pending Queue</span>
              <p class="text-2xl font-black text-amber-600 mt-1">{{ countStatus('Pending') }}</p>
              <span class="text-[10px] text-amber-700/80">Needs technician</span>
            </div>

            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">In Progress</span>
              <p class="text-2xl font-black text-blue-600 mt-1">{{ countStatus('In Progress') + countStatus('Assigned') }}</p>
              <span class="text-[10px] text-blue-700/80">Active repairs</span>
            </div>

            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Resolved</span>
              <p class="text-2xl font-black text-emerald-600 mt-1">{{ countStatus('Resolved') }}</p>
              <span class="text-[10px] text-emerald-700/80">Successfully closed</span>
            </div>

            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">Emergencies</span>
              <p class="text-2xl font-black text-rose-600 mt-1">{{ countEmergency() }}</p>
              <span class="text-[10px] text-rose-700/80">High-risk safety</span>
            </div>

            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">Resolution %</span>
              <p class="text-2xl font-black text-indigo-600 mt-1">{{ analytics()?.summary?.resolutionRate || 0 }}%</p>
              <span class="text-[10px] text-indigo-700/80">Avg: {{ analytics()?.summary?.avgResolutionHours || 14 }}h</span>
            </div>
          </div>

          <!-- Tab Bar -->
          <div class="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              (click)="activeTab.set('complaints')"
              [ngClass]="activeTab() === 'complaints' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'"
              class="px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2"
            >
              <span>📋 Complaints Master Table</span>
              <span class="px-1.5 py-0.5 rounded-full text-xs font-semibold" [ngClass]="activeTab() === 'complaints' ? 'bg-white/20' : 'bg-slate-200'">
                {{ complaints().length }}
              </span>
            </button>

            <button
              (click)="activeTab.set('hotspots')"
              [ngClass]="activeTab() === 'hotspots' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'"
              class="px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2"
            >
              <span>🔥 Campus Problem Hotspots</span>
              <span *ngIf="analytics()?.hotspots?.length" class="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white">
                {{ analytics()?.hotspots?.length }}
              </span>
            </button>

            <button
              (click)="activeTab.set('analytics')"
              [ngClass]="activeTab() === 'analytics' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'"
              class="px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2"
            >
              <span>📊 Analytics & Breakdown</span>
            </button>

            <button
              (click)="activeTab.set('users')"
              [ngClass]="activeTab() === 'users' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'"
              class="px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2"
            >
              <span>👥 Student & Staff Users</span>
              <span class="px-1.5 py-0.5 rounded-full text-xs font-semibold" [ngClass]="activeTab() === 'users' ? 'bg-white/20' : 'bg-slate-200'">
                {{ users().length }}
              </span>
            </button>
          </div>

          <!-- ================= TAB 1: COMPLAINTS MASTER TABLE & DISPATCH ================= -->
          <div *ngIf="activeTab() === 'complaints'" class="space-y-4 animate-fade-in">
            <!-- Search & Multi-Filters Toolbar -->
            <div class="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-xs">
              <div class="relative flex-1">
                <input
                  type="text"
                  [(ngModel)]="searchQuery"
                  (ngModelChange)="applyFilters()"
                  placeholder="Filter by ticket ID, student name, building, issue title, or room..."
                  class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 text-xs sm:text-sm outline-hidden font-medium"
                />
                <span class="absolute left-3 top-3 text-slate-400 text-xs">🔍</span>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <select
                  [(ngModel)]="filterStatus"
                  (change)="applyFilters()"
                  class="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-hidden bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending Assignment</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>

                <select
                  [(ngModel)]="filterPriority"
                  (change)="applyFilters()"
                  class="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-hidden bg-white"
                >
                  <option value="all">All Priorities</option>
                  <option value="Emergency">🚨 Emergency Only</option>
                  <option value="High">⚠️ High Priority</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

                <select
                  [(ngModel)]="filterCategory"
                  (change)="applyFilters()"
                  class="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-hidden bg-white"
                >
                  <option value="all">All Categories</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing & Water">Plumbing & Water</option>
                  <option value="Furniture & Benches">Furniture & Benches</option>
                  <option value="Wi-Fi & Network">Wi-Fi & Network</option>
                  <option value="HVAC & Fans">HVAC & Fans</option>
                  <option value="Classroom Maintenance">Classroom Maintenance</option>
                  <option value="Cleanliness & Sanitation">Cleanliness & Sanitation</option>
                </select>
              </div>
            </div>

            <!-- Complaints Table -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th class="py-3 px-4">Ticket</th>
                      <th class="py-3 px-4">Issue Details</th>
                      <th class="py-3 px-4">Location</th>
                      <th class="py-3 px-4">Priority & Status</th>
                      <th class="py-3 px-4">Assigned Staff</th>
                      <th class="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr *ngIf="filteredComplaints().length === 0">
                      <td colspan="6" class="p-8 text-center text-slate-400">
                        No complaints match your active filters.
                      </td>
                    </tr>
                    <tr
                      *ngFor="let c of filteredComplaints()"
                      class="hover:bg-blue-50/30 transition group"
                      [ngClass]="{ 'bg-rose-50/30': c.priority === 'Emergency' && c.status !== 'Resolved' }"
                    >
                      <!-- Ticket ID & Date -->
                      <td class="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        <span class="block text-blue-700">#{{ c.complaintId }}</span>
                        <span class="text-[10px] text-slate-400 font-sans block">{{ c.createdAt | date: 'shortDate' }}</span>
                      </td>

                      <!-- Title, Category & Student -->
                      <td class="py-3.5 px-4 max-w-xs">
                        <p class="font-bold text-slate-900 line-clamp-1">{{ c.title }}</p>
                        <p class="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{{ c.description }}</p>
                        <div class="flex items-center gap-2 mt-1">
                          <span class="px-2 py-0.2 rounded-md bg-blue-50 text-blue-700 font-semibold text-[10px]">
                            {{ c.category }}
                          </span>
                          <span class="text-[10px] text-slate-400">
                            By {{ c.submittedBy.name || 'Student' }}
                          </span>
                        </div>
                      </td>

                      <!-- Location -->
                      <td class="py-3.5 px-4 whitespace-nowrap">
                        <p class="font-semibold text-slate-800">{{ c.location.building }}</p>
                        <p class="text-[11px] text-slate-500">{{ c.location.room }} &bull; {{ c.location.floor }}</p>
                      </td>

                      <!-- Priority & Status -->
                      <td class="py-3.5 px-4 whitespace-nowrap space-y-1">
                        <div>
                          <span
                            class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                            [ngClass]="{
                              'bg-rose-100 text-rose-800 animate-pulse': c.priority === 'Emergency',
                              'bg-amber-100 text-amber-800': c.priority === 'High',
                              'bg-blue-100 text-blue-800': c.priority === 'Medium',
                              'bg-slate-100 text-slate-700': c.priority === 'Low'
                            }"
                          >
                            {{ c.priority }}
                          </span>
                        </div>
                        <div>
                          <span
                            class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            [ngClass]="{
                              'bg-amber-100 text-amber-800': c.status === 'Pending',
                              'bg-blue-100 text-blue-800': c.status === 'Assigned',
                              'bg-indigo-100 text-indigo-800': c.status === 'In Progress',
                              'bg-emerald-100 text-emerald-800': c.status === 'Resolved'
                            }"
                          >
                            ● {{ c.status }}
                          </span>
                        </div>
                      </td>

                      <!-- Assigned Staff -->
                      <td class="py-3.5 px-4 whitespace-nowrap">
                        <div *ngIf="c.assignedTo" class="flex items-center gap-2">
                          <img
                            [src]="c.assignedTo.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80'"
                            class="w-6 h-6 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <p class="font-bold text-slate-800 leading-none">{{ c.assignedTo.name }}</p>
                            <p class="text-[10px] text-slate-400 mt-0.5">{{ c.assignedTo.department }}</p>
                          </div>
                        </div>
                        <span *ngIf="!c.assignedTo" class="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                          Unassigned
                        </span>
                      </td>

                      <!-- Actions -->
                      <td class="py-3.5 px-4 whitespace-nowrap text-right space-x-1">
                        <button
                          (click)="openAssignModal(c)"
                          class="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-[11px] transition shadow-2xs"
                        >
                          {{ c.assignedTo ? 'Reassign' : 'Assign' }}
                        </button>

                        <button
                          (click)="openStatusModal(c)"
                          class="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-700 hover:text-white font-bold text-[11px] transition shadow-2xs"
                        >
                          Status
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ================= TAB 2: CAMPUS PROBLEM HOTSPOTS ================= -->
          <div *ngIf="activeTab() === 'hotspots'" class="space-y-6 animate-fade-in">
            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>🔥</span> Campus Infrastructure Hotspot Intelligence
                  </h3>
                  <p class="text-xs text-slate-500">
                    Identifies high-frequency recurrence locations based on student reports, active pending tickets, and safety risk severity.
                  </p>
                </div>
                <span class="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-xs">
                  {{ analytics()?.criticalLocationsCount || 1 }} High-Risk Areas
                </span>
              </div>
            </div>

            <!-- Hotspot Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                *ngFor="let h of analytics()?.hotspots"
                class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3"
                [ngClass]="{
                  'border-l-4 border-l-rose-500': h.riskLevel === 'Critical',
                  'border-l-4 border-l-amber-500': h.riskLevel === 'Moderate',
                  'border-l-4 border-l-blue-500': h.riskLevel === 'Low'
                }"
              >
                <div class="flex items-start justify-between">
                  <div>
                    <h4 class="font-extrabold text-slate-900 text-sm">{{ h.building }}</h4>
                    <p class="text-xs text-slate-500 font-medium">{{ h.room }} &bull; {{ h.floor }}</p>
                  </div>
                  <span
                    class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                    [ngClass]="{
                      'bg-rose-100 text-rose-800 animate-pulse': h.riskLevel === 'Critical',
                      'bg-amber-100 text-amber-800': h.riskLevel === 'Moderate',
                      'bg-blue-100 text-blue-800': h.riskLevel === 'Low'
                    }"
                  >
                    {{ h.riskLevel }} Hotspot
                  </span>
                </div>

                <!-- Stats in Hotspot -->
                <div class="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs">
                  <div>
                    <span class="text-[10px] text-slate-400 font-bold block">Total Issues</span>
                    <span class="font-extrabold text-slate-800">{{ h.total }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] text-amber-600 font-bold block">Active</span>
                    <span class="font-extrabold text-amber-600">{{ h.pending + h.inProgress }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] text-rose-600 font-bold block">Emergency</span>
                    <span class="font-extrabold text-rose-600">{{ h.highOrEmergency }}</span>
                  </div>
                </div>

                <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span class="text-slate-500 text-[11px]">Primary Cause:</span>
                  <span class="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md text-[11px]">
                    {{ h.topCategory }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- ================= TAB 3: ANALYTICS & BREAKDOWNS ================= -->
          <div *ngIf="activeTab() === 'analytics'" class="space-y-6 animate-fade-in">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Category Breakdown Bar Chart -->
              <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Complaints by Category Distribution
                </h3>
                <div class="space-y-3 pt-2">
                  <div *ngFor="let cat of analytics()?.categoryData" class="space-y-1">
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-bold text-slate-700">{{ cat.name }}</span>
                      <span class="text-slate-500 font-semibold">{{ cat.value }} issues ({{ cat.percentage }}%)</span>
                    </div>
                    <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        class="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                        [style.width.%]="cat.percentage || 5"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Maintenance Staff Workload & Performance -->
              <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Technician Staff Workload & Turnaround
                </h3>
                <div class="space-y-3 pt-2">
                  <div *ngFor="let s of analytics()?.staffStats" class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <img [src]="s.avatar" class="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                      <div>
                        <p class="font-bold text-slate-900 text-xs">{{ s.name }}</p>
                        <p class="text-[10px] text-slate-500">{{ s.department }}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-3 text-right">
                      <div>
                        <span class="text-[10px] text-slate-400 block font-bold">Active</span>
                        <span class="font-black text-amber-600 text-xs">{{ s.activeTasks }}</span>
                      </div>
                      <div>
                        <span class="text-[10px] text-slate-400 block font-bold">Resolved</span>
                        <span class="font-black text-emerald-600 text-xs">{{ s.resolvedTasks }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ================= TAB 4: USERS MANAGEMENT ================= -->
          <div *ngIf="activeTab() === 'users'" class="space-y-4 animate-fade-in">
            <div class="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-900">Campus User Management</h3>
                <p class="text-xs text-slate-500">Manage registered students, maintenance personnel, and admin access.</p>
              </div>
              <span class="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs">
                {{ users().length }} Registered Users
              </span>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th class="py-3 px-4">User</th>
                    <th class="py-3 px-4">Role</th>
                    <th class="py-3 px-4">Department / ID</th>
                    <th class="py-3 px-4">Contact Phone</th>
                    <th class="py-3 px-4">Status</th>
                    <th class="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr *ngFor="let u of users()" class="hover:bg-slate-50">
                    <td class="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                      <img [src]="u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'" class="w-7 h-7 rounded-full object-cover" />
                      <div>
                        <p class="font-bold text-slate-900 leading-none">{{ u.name }}</p>
                        <p class="text-[10px] text-slate-400 mt-0.5">{{ u.email }}</p>
                      </div>
                    </td>
                    <td class="py-3 px-4 uppercase font-bold text-[10px]">
                      <span
                        class="px-2 py-0.5 rounded-full"
                        [ngClass]="{
                          'bg-blue-100 text-blue-800': u.role === 'student',
                          'bg-amber-100 text-amber-800': u.role === 'staff',
                          'bg-indigo-100 text-indigo-800': u.role === 'admin'
                        }"
                      >
                        {{ u.role }}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-slate-600">
                      {{ u.department || 'General' }}
                      <span *ngIf="u.studentId" class="text-slate-400 block text-[10px]">ID: {{ u.studentId }}</span>
                    </td>
                    <td class="py-3 px-4 text-slate-600 font-mono">{{ u.phone || 'N/A' }}</td>
                    <td class="py-3 px-4">
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        [ngClass]="u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'"
                      >
                        {{ u.status }}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-right">
                      <button
                        (click)="toggleUserStatus(u._id || u.id!)"
                        class="px-2.5 py-1 rounded-lg text-[11px] font-bold border hover:bg-slate-100 transition"
                      >
                        Toggle Status
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <!-- ================= MODAL: ASSIGN STAFF ================= -->
      <div *ngIf="selectedComplaintForAssign()" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-fade-in">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span class="text-xs font-mono font-bold text-blue-600">
                #{{ selectedComplaintForAssign()?.complaintId }}
              </span>
              <h3 class="font-bold text-slate-900 text-base">Assign Maintenance Technician</h3>
            </div>
            <button
              (click)="selectedComplaintForAssign.set(null)"
              class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-lg font-bold"
            >
              &times;
            </button>
          </div>

          <div class="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
            <p class="font-bold text-slate-800">{{ selectedComplaintForAssign()?.title }}</p>
            <p class="text-slate-500">📍 {{ selectedComplaintForAssign()?.location?.building }} - {{ selectedComplaintForAssign()?.location?.room }}</p>
            <span class="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[10px]">
              {{ selectedComplaintForAssign()?.category }}
            </span>
          </div>

          <!-- Select Staff -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Select Maintenance Technician *</label>
            <select
              [(ngModel)]="assignStaffId"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-hidden bg-white"
            >
              <option *ngFor="let s of staffList()" [value]="s._id || s.id">
                {{ s.name }} — {{ s.department }}
              </option>
            </select>
          </div>

          <!-- Estimated Hours -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Estimated Resolution Time (Hours)</label>
            <input
              type="number"
              [(ngModel)]="assignEstimatedHours"
              min="1"
              max="168"
              class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-hidden"
            />
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Assignment Instructions / Notes</label>
            <textarea
              [(ngModel)]="assignNotes"
              rows="2"
              placeholder="e.g. Please bring voltage tester and 2 replacement bulbs..."
              class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-hidden"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              (click)="selectedComplaintForAssign.set(null)"
              class="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="confirmAssign()"
              class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition"
            >
              Dispatch Ticket
            </button>
          </div>
        </div>
      </div>

      <!-- ================= MODAL: UPDATE STATUS & PRIORITY ================= -->
      <div *ngIf="selectedComplaintForStatus()" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-fade-in">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="font-bold text-slate-900 text-base">Update Status & Priority</h3>
            <button
              (click)="selectedComplaintForStatus.set(null)"
              class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-lg font-bold"
            >
              &times;
            </button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
              <select
                [(ngModel)]="updateStatusValue"
                class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-hidden bg-white"
              >
                <option value="Pending">Pending</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
              <select
                [(ngModel)]="updatePriorityValue"
                class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-hidden bg-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Emergency">🚨 Emergency</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Admin Remark / Reason</label>
              <input
                type="text"
                [(ngModel)]="updateReasonValue"
                placeholder="e.g. Escalated due to classroom exam schedule"
                class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-hidden"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              (click)="selectedComplaintForStatus.set(null)"
              class="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="confirmStatusUpdate()"
              class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
            >
              Save Updates
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  adminService = inject(AdminService);
  complaintService = inject(ComplaintService);
  socketService = inject(SocketService);
  toastService = inject(ToastService);
  route = inject(ActivatedRoute);

  activeTab = signal<'complaints' | 'hotspots' | 'analytics' | 'users'>('complaints');

  complaints = signal<Complaint[]>([]);
  filteredComplaints = signal<Complaint[]>([]);
  users = signal<User[]>([]);
  staffList = signal<User[]>([]);
  analytics = signal<any>(null);

  // Filters
  searchQuery = '';
  filterStatus = 'all';
  filterPriority = 'all';
  filterCategory = 'all';

  // Modals
  selectedComplaintForAssign = signal<Complaint | null>(null);
  assignStaffId = '';
  assignEstimatedHours = 12;
  assignNotes = '';

  selectedComplaintForStatus = signal<Complaint | null>(null);
  updateStatusValue = 'In Progress';
  updatePriorityValue = 'Medium';
  updateReasonValue = '';

  private subs = new Subscription();

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab.set(params['tab']);
      }
    });

    this.loadAllData();

    // Socket events
    this.subs.add(
      this.socketService.complaintCreated$.subscribe(c => {
        this.complaints.update(list => [c, ...list]);
        this.applyFilters();
        this.loadAnalytics();
      })
    );

    this.subs.add(
      this.socketService.complaintUpdated$.subscribe(c => {
        this.complaints.update(list =>
          list.map(item => (item._id === c._id || item.complaintId === c.complaintId ? c : item))
        );
        this.applyFilters();
        this.loadAnalytics();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadAllData(): void {
    this.loadComplaints();
    this.loadAnalytics();
    this.loadUsers();
  }

  loadComplaints(): void {
    this.complaintService.getComplaints().subscribe({
      next: res => {
        if (res.success) {
          this.complaints.set(res.complaints);
          this.applyFilters();
        }
      },
    });
  }

  loadAnalytics(): void {
    this.adminService.getAnalytics().subscribe({
      next: res => {
        if (res.success) {
          this.analytics.set(res.analytics);
        }
      },
    });
  }

  loadUsers(): void {
    this.adminService.getAllUsers().subscribe({
      next: res => {
        if (res.success) {
          this.users.set(res.users);
          this.staffList.set(res.users.filter((u: User) => u.role === 'staff'));
        }
      },
    });
  }

  applyFilters(): void {
    let list = this.complaints();

    if (this.filterStatus !== 'all') {
      list = list.filter(c => c.status === this.filterStatus);
    }
    if (this.filterPriority !== 'all') {
      list = list.filter(c => c.priority === this.filterPriority);
    }
    if (this.filterCategory !== 'all') {
      list = list.filter(c => c.category === this.filterCategory);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        c =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.complaintId.toLowerCase().includes(q) ||
          c.location.building.toLowerCase().includes(q) ||
          c.location.room.toLowerCase().includes(q) ||
          c.submittedBy?.name?.toLowerCase().includes(q)
      );
    }

    this.filteredComplaints.set(list);
  }

  countStatus(status: string): number {
    return this.complaints().filter(c => c.status === status).length;
  }

  countEmergency(): number {
    return this.complaints().filter(c => c.priority === 'Emergency' && c.status !== 'Resolved').length;
  }

  // Assign Modal
  openAssignModal(c: Complaint): void {
    this.selectedComplaintForAssign.set(c);
    this.assignStaffId = (c.assignedTo?._id || c.assignedTo?.id || this.staffList()[0]?._id || this.staffList()[0]?.id || '') as string;
    this.assignEstimatedHours = c.estimatedHours || 12;
    this.assignNotes = '';
  }

  confirmAssign(): void {
    const c = this.selectedComplaintForAssign();
    if (!c || !this.assignStaffId) return;

    this.adminService
      .assignComplaint(c._id || c.id!, {
        staffId: this.assignStaffId,
        estimatedHours: this.assignEstimatedHours,
        notes: this.assignNotes,
      })
      .subscribe({
        next: res => {
          this.toastService.success('Assignment Saved', res.message);
          this.selectedComplaintForAssign.set(null);
          this.loadAllData();
        },
        error: err => {
          this.toastService.error('Assignment Error', err.error?.message || 'Could not assign ticket');
        },
      });
  }

  // Status/Priority Modal
  openStatusModal(c: Complaint): void {
    this.selectedComplaintForStatus.set(c);
    this.updateStatusValue = c.status;
    this.updatePriorityValue = c.priority;
    this.updateReasonValue = '';
  }

  confirmStatusUpdate(): void {
    const c = this.selectedComplaintForStatus();
    if (!c) return;

    this.adminService
      .updateStatusPriority(c._id || c.id!, {
        status: this.updateStatusValue,
        priority: this.updatePriorityValue,
        reason: this.updateReasonValue,
      })
      .subscribe({
        next: res => {
          this.toastService.success('Updated', res.message);
          this.selectedComplaintForStatus.set(null);
          this.loadAllData();
        },
        error: err => {
          this.toastService.error('Update Error', err.error?.message || 'Could not update ticket');
        },
      });
  }

  toggleUserStatus(id: string): void {
    this.adminService.toggleUserStatus(id).subscribe({
      next: res => {
        this.toastService.success('User Updated', res.message);
        this.loadUsers();
      },
    });
  }
}
