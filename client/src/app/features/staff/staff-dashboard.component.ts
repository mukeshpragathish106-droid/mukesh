import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { StaffService } from '../../core/services/staff.service';
import { SocketService } from '../../core/services/socket.service';
import { ToastService } from '../../core/services/toast.service';
import { Complaint } from '../../core/models/complaint.model';
import { NavbarComponent } from '../../shared/navbar.component';
import { SidebarComponent } from '../../shared/sidebar.component';

@Component({
  selector: 'app-staff-dashboard',
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
          <!-- Staff Banner -->
          <div class="bg-gradient-to-r from-amber-700 via-amber-600 to-orange-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-amber-600/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md">
                  On-Duty Maintenance Staff
                </span>
                <span class="text-xs text-amber-200">Dept: {{ authService.currentUser()?.department }}</span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
                Welcome back, {{ authService.currentUser()?.name }}!
              </h1>
              <p class="text-amber-100 text-sm mt-1 max-w-xl">
                Here are your assigned campus work orders. Update progress notes and mark resolved with completion remarks.
              </p>
            </div>

            <button
              (click)="loadMyTasks()"
              class="px-4 py-2.5 rounded-xl bg-white text-amber-800 font-bold text-xs hover:bg-amber-50 shadow-md transition flex items-center gap-1.5"
            >
              <span>🔄</span> Refresh Tasks
            </button>
          </div>

          <!-- Metric Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block">Assigned To Me</span>
              <p class="text-3xl font-extrabold text-slate-900 mt-1">{{ tasks().length }}</p>
              <span class="text-xs text-slate-400">Total assigned queue</span>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-xs font-bold text-amber-600 uppercase tracking-wider block">Pending / Waiting</span>
              <p class="text-3xl font-extrabold text-amber-600 mt-1">{{ countStatus('Assigned') + countStatus('Pending') }}</p>
              <span class="text-xs text-slate-400">Needs initial inspection</span>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-xs font-bold text-blue-600 uppercase tracking-wider block">In Progress</span>
              <p class="text-3xl font-extrabold text-blue-600 mt-1">{{ countStatus('In Progress') }}</p>
              <span class="text-xs text-slate-400">Repair currently active</span>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Completed</span>
              <p class="text-3xl font-extrabold text-emerald-600 mt-1">{{ countStatus('Resolved') }}</p>
              <span class="text-xs text-slate-400">Successfully closed</span>
            </div>
          </div>

          <!-- Emergency Banner (if any pending emergency) -->
          <div *ngIf="hasActiveEmergency()" class="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 flex items-center justify-between gap-4 animate-pulse">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🚨</span>
              <div>
                <p class="font-bold text-sm">Emergency Work Order Requires Urgent Action!</p>
                <p class="text-xs text-rose-700">One or more tickets are tagged with Emergency priority (water/fire hazard).</p>
              </div>
            </div>
            <button
              (click)="filterStatus.set('Emergency')"
              class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 transition"
            >
              View Emergency Tasks
            </button>
          </div>

          <!-- Filter Toolbar -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div class="flex items-center gap-2">
              <button
                (click)="filterStatus.set('all')"
                [ngClass]="filterStatus() === 'all' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
                class="px-3.5 py-1.5 rounded-xl text-xs transition"
              >
                All ({{ tasks().length }})
              </button>
              <button
                (click)="filterStatus.set('active')"
                [ngClass]="filterStatus() === 'active' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
                class="px-3.5 py-1.5 rounded-xl text-xs transition"
              >
                Active Tasks ({{ countActive() }})
              </button>
              <button
                (click)="filterStatus.set('Resolved')"
                [ngClass]="filterStatus() === 'Resolved' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
                class="px-3.5 py-1.5 rounded-xl text-xs transition"
              >
                Resolved History ({{ countStatus('Resolved') }})
              </button>
            </div>

            <span class="text-xs text-slate-400">
              Department: <strong class="text-slate-700">{{ authService.currentUser()?.department }}</strong>
            </span>
          </div>

          <!-- Empty Tasks State -->
          <div *ngIf="filteredTasks().length === 0" class="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <span class="text-4xl">🛠️</span>
            <h3 class="text-base font-bold text-slate-800">No Tasks in this Filter</h3>
            <p class="text-xs text-slate-500 max-w-sm mx-auto">
              You are all caught up! When admin assigns new campus issues, they will appear here in real time.
            </p>
          </div>

          <!-- Task Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              *ngFor="let task of filteredTasks()"
              class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition space-y-4"
              [ngClass]="{
                'border-l-4 border-l-rose-500': task.priority === 'Emergency' && task.status !== 'Resolved',
                'border-l-4 border-l-amber-500': task.priority === 'High' && task.status !== 'Resolved',
                'border-l-4 border-l-emerald-500': task.status === 'Resolved'
              }"
            >
              <!-- Card Header -->
              <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-mono font-bold">
                    #{{ task.complaintId }}
                  </span>
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                    [ngClass]="{
                      'bg-rose-100 text-rose-800 animate-pulse': task.priority === 'Emergency',
                      'bg-amber-100 text-amber-800': task.priority === 'High',
                      'bg-blue-100 text-blue-800': task.priority === 'Medium',
                      'bg-slate-100 text-slate-700': task.priority === 'Low'
                    }"
                  >
                    {{ task.priority }}
                  </span>
                </div>

                <span
                  class="px-2 py-0.5 rounded-full text-[11px] font-bold"
                  [ngClass]="{
                    'bg-amber-100 text-amber-800': task.status === 'Pending' || task.status === 'Assigned',
                    'bg-indigo-100 text-indigo-800': task.status === 'In Progress',
                    'bg-emerald-100 text-emerald-800': task.status === 'Resolved'
                  }"
                >
                  ● {{ task.status }}
                </span>
              </div>

              <!-- Title & Description -->
              <div>
                <h3 class="font-bold text-slate-900 text-base">{{ task.title }}</h3>
                <p class="text-xs text-slate-600 mt-1 leading-relaxed">{{ task.description }}</p>
              </div>

              <!-- Location & Student Info Box -->
              <div class="p-3 bg-slate-50 rounded-xl text-xs space-y-2 border border-slate-100">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-slate-800 flex items-center gap-1">
                    <span>📍</span> {{ task.location.building }} &bull; {{ task.location.room }}
                  </span>
                  <span class="text-slate-500">{{ task.location.floor }}</span>
                </div>

                <div class="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                  <span>Student: <strong>{{ task.submittedBy.name || 'Mukesh Patel' }}</strong></span>
                  <span class="font-mono">{{ task.submittedBy.phone || '+91 98444 55667' }}</span>
                </div>
              </div>

              <!-- Photo Thumbnail (if attached) -->
              <div *ngIf="task.images.length" class="flex gap-2">
                <img [src]="task.images[0]" class="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-xs" />
              </div>

              <!-- Latest Timeline Log -->
              <div *ngIf="task.timeline.length" class="text-[11px] text-slate-500 bg-slate-50/60 p-2 rounded-lg">
                <span class="font-bold text-slate-700">Latest Log:</span>
                "{{ task.timeline[task.timeline.length - 1].message }}"
              </div>

              <!-- Actions for Active Tasks -->
              <div *ngIf="task.status !== 'Resolved'" class="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  (click)="openProgressModal(task)"
                  class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  📝 Update Work Log
                </button>
                <button
                  (click)="openResolveModal(task)"
                  class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  <span>✅ Mark as Resolved</span>
                </button>
              </div>

              <!-- Resolved Information -->
              <div *ngIf="task.status === 'Resolved'" class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div class="flex items-center justify-between font-bold">
                  <span>Completed on {{ task.resolvedAt | date: 'short' }}</span>
                  <span *ngIf="task.feedback?.rating" class="text-amber-500 font-bold">★ {{ task.feedback?.rating }}/5</span>
                </div>
                <p class="text-[11px] text-emerald-800" *ngIf="task.resolutionNotes">
                  Remarks: "{{ task.resolutionNotes }}"
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <!-- ================= MODAL: UPDATE WORK PROGRESS ================= -->
      <div *ngIf="selectedTaskForProgress()" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-fade-in">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span class="text-xs font-mono font-bold text-amber-600">
                #{{ selectedTaskForProgress()?.complaintId }}
              </span>
              <h3 class="font-bold text-slate-900 text-base">Update Work Progress</h3>
            </div>
            <button
              (click)="selectedTaskForProgress.set(null)"
              class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-lg font-bold"
            >
              &times;
            </button>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
            <select
              [(ngModel)]="progressStatus"
              class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-hidden bg-white"
            >
              <option value="In Progress">In Progress (Work actively underway)</option>
              <option value="Assigned">Assigned (Awaiting parts / access)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Work Description / Progress Notes *</label>
            <textarea
              [(ngModel)]="progressWorkLog"
              rows="3"
              placeholder="e.g. Inspected circuit box, ordered new breaker switch, repair resuming at 3 PM..."
              class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-hidden leading-relaxed"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              (click)="selectedTaskForProgress.set(null)"
              class="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="submitProgressUpdate()"
              class="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition"
            >
              Save Progress
            </button>
          </div>
        </div>
      </div>

      <!-- ================= MODAL: MARK RESOLVED ================= -->
      <div *ngIf="selectedTaskForResolve()" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-fade-in">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span class="text-xs font-mono font-bold text-emerald-600">
                #{{ selectedTaskForResolve()?.complaintId }}
              </span>
              <h3 class="font-bold text-slate-900 text-base">Complete & Mark Resolved</h3>
            </div>
            <button
              (click)="selectedTaskForResolve.set(null)"
              class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-lg font-bold"
            >
              &times;
            </button>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Resolution Remarks / Solution Details *</label>
            <textarea
              [(ngModel)]="resolutionNotes"
              rows="3"
              required
              placeholder="e.g. Rewired faulty switch, tightened desk bolts, tested fan speed regulator. Verified safe and functional."
              class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-hidden leading-relaxed"
            ></textarea>
          </div>

          <!-- Proof photo upload/paste -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Resolution Proof Photo (Optional)</label>
            <input
              type="file"
              accept="image/*"
              (change)="onProofFileSelected($event)"
              class="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 hover:file:bg-slate-200"
            />
            <div *ngIf="resolutionProofImage()" class="mt-2">
              <img [src]="resolutionProofImage()" class="w-16 h-16 rounded-xl object-cover border border-slate-200" />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              (click)="selectedTaskForResolve.set(null)"
              class="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="submitResolution()"
              class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition"
            >
              Confirm Resolution
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class StaffDashboardComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  staffService = inject(StaffService);
  socketService = inject(SocketService);
  toastService = inject(ToastService);

  tasks = signal<Complaint[]>([]);
  filterStatus = signal<string>('all');

  // Modals
  selectedTaskForProgress = signal<Complaint | null>(null);
  progressStatus = 'In Progress';
  progressWorkLog = '';

  selectedTaskForResolve = signal<Complaint | null>(null);
  resolutionNotes = '';
  resolutionProofImage = signal<string | null>(null);

  private subs = new Subscription();

  ngOnInit(): void {
    this.loadMyTasks();

    this.subs.add(
      this.socketService.complaintUpdated$.subscribe(c => {
        this.updateLocalTask(c);
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadMyTasks(): void {
    this.staffService.getMyTasks().subscribe({
      next: res => {
        if (res.success) {
          this.tasks.set(res.tasks);
        }
      },
    });
  }

  updateLocalTask(updated: Complaint): void {
    const myId = this.authService.currentUser()?._id || this.authService.currentUser()?.id;
    const assignedId = updated.assignedTo?._id || updated.assignedTo?.id || updated.assignedTo;

    if (assignedId && assignedId.toString() === myId?.toString()) {
      this.tasks.update(list => {
        const index = list.findIndex(t => t._id === updated._id || t.complaintId === updated.complaintId);
        if (index > -1) {
          list[index] = updated;
          return [...list];
        } else {
          return [updated, ...list];
        }
      });
    }
  }

  filteredTasks(): Complaint[] {
    const f = this.filterStatus();
    if (f === 'all') return this.tasks();
    if (f === 'active') return this.tasks().filter(t => t.status !== 'Resolved' && t.status !== 'Rejected');
    if (f === 'Emergency') return this.tasks().filter(t => t.priority === 'Emergency' && t.status !== 'Resolved');
    return this.tasks().filter(t => t.status === f);
  }

  countStatus(status: string): number {
    return this.tasks().filter(t => t.status === status).length;
  }

  countActive(): number {
    return this.tasks().filter(t => t.status !== 'Resolved' && t.status !== 'Rejected').length;
  }

  hasActiveEmergency(): boolean {
    return this.tasks().some(t => t.priority === 'Emergency' && t.status !== 'Resolved');
  }

  // Progress Update
  openProgressModal(task: Complaint): void {
    this.selectedTaskForProgress.set(task);
    this.progressStatus = task.status === 'Assigned' ? 'In Progress' : task.status;
    this.progressWorkLog = '';
  }

  submitProgressUpdate(): void {
    const t = this.selectedTaskForProgress();
    if (!t) return;

    this.staffService
      .updateProgress(t._id || t.id!, {
        status: this.progressStatus,
        workLog: this.progressWorkLog || 'Maintenance underway.',
      })
      .subscribe({
        next: res => {
          this.toastService.success('Progress Saved', res.message);
          this.selectedTaskForProgress.set(null);
          this.loadMyTasks();
        },
        error: err => {
          this.toastService.error('Error', err.error?.message || 'Could not update progress');
        },
      });
  }

  // Resolve
  openResolveModal(task: Complaint): void {
    this.selectedTaskForResolve.set(task);
    this.resolutionNotes = '';
    this.resolutionProofImage.set(null);
  }

  onProofFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.resolutionProofImage.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  submitResolution(): void {
    const t = this.selectedTaskForResolve();
    if (!t || !this.resolutionNotes.trim()) {
      this.toastService.warning('Remarks Required', 'Please provide resolution notes before closing.');
      return;
    }

    this.staffService
      .resolveComplaint(t._id || t.id!, {
        resolutionNotes: this.resolutionNotes,
        resolutionProofImage: this.resolutionProofImage() || undefined,
      })
      .subscribe({
        next: res => {
          this.toastService.success('Ticket Resolved', 'Good job! Marked as resolved.');
          this.selectedTaskForResolve.set(null);
          this.loadMyTasks();
        },
        error: err => {
          this.toastService.error('Error', err.error?.message || 'Failed to mark ticket resolved');
        },
      });
  }
}
