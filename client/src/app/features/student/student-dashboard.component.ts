import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { ComplaintService } from '../../core/services/complaint.service';
import { AiService, AISuggestions } from '../../core/services/ai.service';
import { SocketService } from '../../core/services/socket.service';
import { ToastService } from '../../core/services/toast.service';
import { Complaint } from '../../core/models/complaint.model';
import { NavbarComponent } from '../../shared/navbar.component';
import { SidebarComponent } from '../../shared/sidebar.component';
import { ProfileModalComponent } from '../../shared/profile-modal.component';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent, SidebarComponent, ProfileModalComponent],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col">
      <app-navbar></app-navbar>

      <div class="flex-1 flex flex-col md:flex-row">
        <!-- Sidebar Navigation -->
        <app-sidebar class="hidden md:block"></app-sidebar>

        <!-- Main Content Area -->
        <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <!-- Top Welcome & Quick Action Header -->
          <div class="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div class="flex items-center gap-4 sm:gap-5">
              <!-- Student Profile Avatar with Edit Overlay -->
              <div
                (click)="showProfileModal.set(true)"
                class="relative group cursor-pointer shrink-0"
                title="Click to view & change profile photo"
              >
                <img
                  [src]="authService.currentUser()?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160'"
                  alt="Student Avatar"
                  class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/60 shadow-lg ring-4 ring-white/20 group-hover:scale-105 transition"
                />
                <span class="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-lg bg-blue-900/90 text-white text-[10px] font-bold border border-white/40 shadow-xs flex items-center gap-1 group-hover:bg-blue-600 transition">
                  📷 Edit
                </span>
              </div>

              <div>
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md">
                    Student Care & Facilities Portal
                  </span>
                  <span class="text-xs text-blue-200">ID: {{ authService.currentUser()?.studentId || 'CS2026-042' }}</span>
                </div>
                <h1 class="text-2xl sm:text-3xl font-extrabold mt-1.5 tracking-tight">
                  Welcome, {{ authService.currentUser()?.name }}!
                </h1>
                <p class="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
                  {{ authService.currentUser()?.department || 'Computer Science & Engineering' }} &bull; {{ authService.currentUser()?.phone || 'No phone set' }}
                </p>
              </div>
            </div>

            <!-- Quick Action Buttons -->
            <div class="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                (click)="showProfileModal.set(true)"
                class="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs backdrop-blur-md transition flex items-center gap-1.5"
                title="Change profile picture or details"
              >
                <span>👤 Change Profile Photo</span>
              </button>
              <button
                (click)="activeTab.set('new')"
                class="px-5 py-2.5 rounded-2xl bg-white text-blue-700 font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl hover:bg-blue-50 transition flex items-center gap-2 transform active:scale-95"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>+ Lodge Complaint</span>
              </button>
            </div>
          </div>

          <!-- KPI Metric Cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div class="flex items-center justify-between text-slate-500 mb-2">
                <span class="text-xs font-bold uppercase tracking-wider">My Total Complaints</span>
                <span class="p-2 rounded-xl bg-blue-50 text-blue-600">📁</span>
              </div>
              <p class="text-3xl font-extrabold text-slate-900">{{ myComplaints().length }}</p>
              <p class="text-xs text-slate-400 mt-1">Logged from your account</p>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div class="flex items-center justify-between text-slate-500 mb-2">
                <span class="text-xs font-bold uppercase tracking-wider">Under Review / Pending</span>
                <span class="p-2 rounded-xl bg-amber-50 text-amber-600">⏳</span>
              </div>
              <p class="text-3xl font-extrabold text-amber-600">{{ countPending() }}</p>
              <p class="text-xs text-slate-400 mt-1">Queued for assignment</p>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div class="flex items-center justify-between text-slate-500 mb-2">
                <span class="text-xs font-bold uppercase tracking-wider">In Progress</span>
                <span class="p-2 rounded-xl bg-indigo-50 text-indigo-600">🛠️</span>
              </div>
              <p class="text-3xl font-extrabold text-indigo-600">{{ countInProgress() }}</p>
              <p class="text-xs text-slate-400 mt-1">Technician on site</p>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div class="flex items-center justify-between text-slate-500 mb-2">
                <span class="text-xs font-bold uppercase tracking-wider">Resolved</span>
                <span class="p-2 rounded-xl bg-emerald-50 text-emerald-600">✅</span>
              </div>
              <p class="text-3xl font-extrabold text-emerald-600">{{ countResolved() }}</p>
              <p class="text-xs text-slate-400 mt-1">Work completed</p>
            </div>
          </div>

          <!-- Tab Navigation -->
          <div class="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              (click)="activeTab.set('my-tickets')"
              [ngClass]="activeTab() === 'my-tickets' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'"
              class="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2"
            >
              <span>📋 My Ticket History</span>
              <span class="px-1.5 py-0.5 rounded-full text-xs font-semibold" [ngClass]="activeTab() === 'my-tickets' ? 'bg-white/20' : 'bg-slate-200'">
                {{ myComplaints().length }}
              </span>
            </button>

            <button
              (click)="activeTab.set('new')"
              [ngClass]="activeTab() === 'new' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'"
              class="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2"
            >
              <span>✨ Lodge New Complaint</span>
            </button>

            <button
              (click)="activeTab.set('campus-feed')"
              [ngClass]="activeTab() === 'campus-feed' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'"
              class="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2"
            >
              <span>🌐 Campus Live Feed</span>
              <span class="px-1.5 py-0.5 rounded-full text-xs font-semibold" [ngClass]="activeTab() === 'campus-feed' ? 'bg-white/20' : 'bg-slate-200'">
                {{ allComplaints().length }}
              </span>
            </button>
          </div>

          <!-- ================= TAB 1: LODGE NEW COMPLAINT FORM ================= -->
          <div *ngIf="activeTab() === 'new'" class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in">
            <div class="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 class="text-lg sm:text-xl font-bold text-slate-900">Lodge a Campus Problem</h2>
                <p class="text-xs sm:text-sm text-slate-500">Provide details so our AI can suggest the category and detect duplicate reports.</p>
              </div>
              <span class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/60">
                <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                AI Active Assist
              </span>
            </div>

            <!-- Intelligent Duplicate Alert Banner (if detected) -->
            <div *ngIf="duplicateWarning()" class="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 animate-fade-in space-y-3">
              <div class="flex items-start gap-3">
                <span class="text-2xl shrink-0">⚠️</span>
                <div class="flex-1">
                  <p class="font-bold text-sm">Similar Active Complaint Already Reported in this Location!</p>
                  <p class="text-xs text-amber-800 mt-1 leading-relaxed">
                    {{ duplicateWarning() }}
                  </p>
                </div>
              </div>

              <!-- Matches List -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div *ngFor="let match of duplicateMatches()" class="bg-white/80 p-2.5 rounded-xl border border-amber-200 text-xs flex items-center justify-between">
                  <div>
                    <span class="font-bold text-slate-800">#{{ match.complaintId }}:</span>
                    <span class="text-slate-600 ml-1">{{ match.title }}</span>
                    <span class="text-[10px] text-amber-700 block font-semibold">{{ match.similarityScore }}% match</span>
                  </div>
                  <button
                    type="button"
                    (click)="upvoteExisting(match.id)"
                    class="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] transition shrink-0"
                  >
                    👍 Upvote Ticket
                  </button>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-amber-200 text-xs">
                <span class="text-slate-600">Upvoting an existing complaint helps facilities prioritize it faster.</span>
                <button
                  type="button"
                  (click)="forceSubmitNewComplaint()"
                  class="font-bold text-amber-900 underline hover:no-underline"
                >
                  Submit Anyway as Separate Ticket &rarr;
                </button>
              </div>
            </div>

            <form (ngSubmit)="submitComplaint()" class="space-y-6">
              <!-- Title & Live AI suggestion -->
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Complaint Title / Issue Summary *
                </label>
                <input
                  type="text"
                  [(ngModel)]="newTitle"
                  (ngModelChange)="onTextChange()"
                  name="title"
                  required
                  placeholder="e.g. Broken wooden bench with exposed screws or Ceiling fan vibrating violently"
                  class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm outline-hidden font-medium"
                />
              </div>

              <!-- Description -->
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Detailed Problem Description *
                </label>
                <textarea
                  [(ngModel)]="newDescription"
                  (ngModelChange)="onTextChange()"
                  name="description"
                  rows="3"
                  required
                  placeholder="Describe the condition, how long it has been broken, and if it poses immediate safety concerns..."
                  class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm outline-hidden leading-relaxed"
                ></textarea>
              </div>

              <!-- Real-time AI Category & Priority Suggestions Box -->
              <div *ngIf="aiSuggestion()" class="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <span>✨</span> AI Real-time Intelligent Recommendation
                  </span>
                  <button
                    type="button"
                    (click)="applyAiSuggestions()"
                    class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                  >
                    Apply Recommendations
                  </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div class="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <span class="text-slate-400 block text-[10px] uppercase font-bold">Suggested Category</span>
                      <span class="font-bold text-blue-700 text-sm">{{ aiSuggestion()?.category }}</span>
                    </div>
                    <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {{ Math.round((aiSuggestion()?.categoryConfidence || 0.8) * 100) }}% match
                    </span>
                  </div>

                  <div class="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <span class="text-slate-400 block text-[10px] uppercase font-bold">Suggested Priority</span>
                      <span class="font-bold text-sm" [ngClass]="{
                        'text-rose-600': aiSuggestion()?.priority === 'Emergency',
                        'text-amber-600': aiSuggestion()?.priority === 'High',
                        'text-blue-600': aiSuggestion()?.priority === 'Medium',
                        'text-slate-600': aiSuggestion()?.priority === 'Low'
                      }">
                        {{ aiSuggestion()?.priority }}
                      </span>
                    </div>
                    <span class="text-[11px] text-slate-500 italic max-w-[150px] truncate">
                      {{ aiSuggestion()?.priorityReason }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Category & Priority manual dropdowns -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    [(ngModel)]="newCategory"
                    name="category"
                    (change)="triggerDuplicateCheck()"
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm outline-hidden bg-white"
                  >
                    <option value="Electrical">Electrical (Switches, Lights, Wiring)</option>
                    <option value="Plumbing & Water">Plumbing & Water (Taps, Coolers, Washrooms)</option>
                    <option value="Furniture & Benches">Furniture & Benches (Desks, Chairs, Doors)</option>
                    <option value="Wi-Fi & Network">Wi-Fi & Network (Router, Speed, LAN)</option>
                    <option value="HVAC & Fans">HVAC & Fans (Ceiling Fans, ACs, Cooling)</option>
                    <option value="Classroom Maintenance">Classroom Maintenance (Projectors, Boards)</option>
                    <option value="Cleanliness & Sanitation">Cleanliness & Sanitation (Trash, Cleaning)</option>
                    <option value="Other">Other Campus Facilities</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Priority Level
                  </label>
                  <select
                    [(ngModel)]="newPriority"
                    name="priority"
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm outline-hidden bg-white"
                  >
                    <option value="Low">Low (Minor cosmetic / non-urgent)</option>
                    <option value="Medium">Medium (Routine classroom repair)</option>
                    <option value="High">High (Impacting classes or exams)</option>
                    <option value="Emergency">Emergency (Immediate safety / water / fire hazard)</option>
                  </select>
                </div>
              </div>

              <!-- Location Grid -->
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <span class="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Campus Location Details *
                </span>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">Building / Complex</label>
                    <select
                      [(ngModel)]="newBuilding"
                      (change)="triggerDuplicateCheck()"
                      name="building"
                      class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 text-sm outline-hidden bg-white"
                    >
                      <option value="Engineering Block A">Engineering Block A</option>
                      <option value="Engineering Block B">Engineering Block B</option>
                      <option value="Central Library">Central Library</option>
                      <option value="Technology Tower">Technology Tower</option>
                      <option value="Science & Humanities Block">Science & Humanities Block</option>
                      <option value="Administrative Block">Administrative Block</option>
                      <option value="Student Hostel Block 1">Student Hostel Block 1</option>
                      <option value="Student Hostel Block 2">Student Hostel Block 2</option>
                      <option value="Sports Complex & Gymnasium">Sports Complex & Gymnasium</option>
                      <option value="Campus Cafeteria">Campus Cafeteria</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">Floor</label>
                    <select
                      [(ngModel)]="newFloor"
                      name="floor"
                      class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 text-sm outline-hidden bg-white"
                    >
                      <option value="Ground Floor">Ground Floor</option>
                      <option value="1st Floor">1st Floor</option>
                      <option value="2nd Floor">2nd Floor</option>
                      <option value="3rd Floor">3rd Floor</option>
                      <option value="4th Floor">4th Floor</option>
                      <option value="5th Floor">5th Floor</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">Room / Hall / Lab Number</label>
                    <input
                      type="text"
                      [(ngModel)]="newRoom"
                      (blur)="triggerDuplicateCheck()"
                      name="room"
                      required
                      placeholder="e.g. Room 302 or CS Lab 4"
                      class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 text-sm outline-hidden font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] font-semibold text-slate-600 mb-1">Nearby Landmark / Specific Spot (Optional)</label>
                  <input
                    type="text"
                    [(ngModel)]="newLandmark"
                    name="landmark"
                    placeholder="e.g. Beside lift lobby, near water cooler, or 2nd row from podium"
                    class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 text-sm outline-hidden"
                  />
                </div>
              </div>

              <!-- Image Attachment -->
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Upload Problem Photo (Optional)
                </label>
                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <label class="cursor-pointer px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-slate-600 text-xs font-semibold transition flex items-center gap-2">
                    <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Browse Image file</span>
                    <input type="file" accept="image/*" (change)="onFileSelected($event)" class="hidden" />
                  </label>

                  <div *ngIf="previewImage()" class="relative">
                    <img [src]="previewImage()" class="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-xs" />
                    <button
                      type="button"
                      (click)="previewImage.set(null)"
                      class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold"
                    >
                      &times;
                    </button>
                  </div>

                  <span class="text-xs text-slate-400">JPG, PNG up to 10MB</span>
                </div>
              </div>

              <!-- Submit Buttons -->
              <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  (click)="resetForm()"
                  class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs sm:text-sm transition"
                >
                  Clear Fields
                </button>
                <button
                  type="submit"
                  [disabled]="isSubmitting()"
                  class="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  <span *ngIf="isSubmitting()" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{{ isSubmitting() ? 'Lodging Complaint...' : 'Submit Campus Complaint' }}</span>
                </button>
              </div>
            </form>
          </div>

          <!-- ================= TAB 2: MY TICKETS LIST ================= -->
          <div *ngIf="activeTab() === 'my-tickets'" class="space-y-4 animate-fade-in">
            <!-- Search & Filters -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div class="relative flex-1">
                <input
                  type="text"
                  [(ngModel)]="searchQuery"
                  (ngModelChange)="applyLocalFilters()"
                  placeholder="Search by ticket #, title, or room..."
                  class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-blue-600 text-xs sm:text-sm outline-hidden"
                />
                <span class="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
              </div>

              <div class="flex items-center gap-2">
                <select
                  [(ngModel)]="filterStatus"
                  (change)="applyLocalFilters()"
                  class="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-hidden bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>

                <select
                  [(ngModel)]="filterCategory"
                  (change)="applyLocalFilters()"
                  class="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-hidden bg-white"
                >
                  <option value="all">All Categories</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing & Water">Plumbing & Water</option>
                  <option value="Furniture & Benches">Furniture & Benches</option>
                  <option value="Wi-Fi & Network">Wi-Fi & Network</option>
                  <option value="HVAC & Fans">HVAC & Fans</option>
                  <option value="Classroom Maintenance">Classroom Maintenance</option>
                </select>
              </div>
            </div>

            <!-- Empty State -->
            <div *ngIf="filteredMyComplaints().length === 0" class="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <span class="text-4xl">🎉</span>
              <h3 class="text-base font-bold text-slate-800">No Complaints Found</h3>
              <p class="text-xs text-slate-500 max-w-sm mx-auto">
                No tickets match your filters. You can report any campus maintenance issue at any time.
              </p>
              <button
                (click)="activeTab.set('new')"
                class="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
              >
                <span>+ Lodge New Complaint</span>
              </button>
            </div>

            <!-- Ticket Cards -->
            <div class="grid grid-cols-1 gap-4">
              <div
                *ngFor="let c of filteredMyComplaints()"
                class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition space-y-4"
              >
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div class="flex items-center gap-3">
                    <span class="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-100 text-slate-700 font-mono">
                      #{{ c.complaintId }}
                    </span>
                    <span
                      class="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                      [ngClass]="{
                        'bg-amber-100 text-amber-800': c.status === 'Pending',
                        'bg-blue-100 text-blue-800': c.status === 'Assigned',
                        'bg-indigo-100 text-indigo-800': c.status === 'In Progress',
                        'bg-emerald-100 text-emerald-800': c.status === 'Resolved'
                      }"
                    >
                      ● {{ c.status }}
                    </span>
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      [ngClass]="{
                        'bg-rose-100 text-rose-800': c.priority === 'Emergency',
                        'bg-amber-100 text-amber-800': c.priority === 'High',
                        'bg-blue-100 text-blue-800': c.priority === 'Medium',
                        'bg-slate-100 text-slate-800': c.priority === 'Low'
                      }"
                    >
                      {{ c.priority }} Priority
                    </span>
                  </div>

                  <span class="text-xs text-slate-400">
                    Reported: {{ c.createdAt | date: 'mediumDate' }}
                  </span>
                </div>

                <!-- Title & Description -->
                <div>
                  <h3 class="text-base font-bold text-slate-900">{{ c.title }}</h3>
                  <p class="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">{{ c.description }}</p>
                </div>

                <!-- Location & Category Tags -->
                <div class="flex flex-wrap items-center gap-2 text-xs">
                  <span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium flex items-center gap-1">
                    <span>📍</span> {{ c.location.building }} &bull; {{ c.location.room }} ({{ c.location.floor }})
                  </span>
                  <span class="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium">
                    🏷️ {{ c.category }}
                  </span>
                  <span *ngIf="c.assignedTo" class="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-medium flex items-center gap-1">
                    <span>🛠️</span> Technician: {{ c.assignedTo.name }} ({{ c.assignedTo.department }})
                  </span>
                </div>

                <!-- Real-time Status Stepper -->
                <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <div class="grid grid-cols-4 gap-1 text-center text-[10px] font-bold text-slate-500 mb-1.5">
                    <span [ngClass]="{ 'text-blue-700 font-extrabold': isStepActive(c.status, 'Pending') }">1. Reported</span>
                    <span [ngClass]="{ 'text-blue-700 font-extrabold': isStepActive(c.status, 'Assigned') }">2. Assigned</span>
                    <span [ngClass]="{ 'text-blue-700 font-extrabold': isStepActive(c.status, 'In Progress') }">3. In Progress</span>
                    <span [ngClass]="{ 'text-emerald-700 font-extrabold': isStepActive(c.status, 'Resolved') }">4. Resolved</span>
                  </div>

                  <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500"
                      [style.width]="getStepPercentage(c.status)"
                    ></div>
                  </div>
                </div>

                <!-- Resolved Remarks & Feedback Banner -->
                <div *ngIf="c.status === 'Resolved'" class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="font-bold flex items-center gap-1">
                      <span>✅</span> Resolution Complete
                    </span>
                    <span class="text-[11px] text-emerald-700">
                      {{ c.resolvedAt | date: 'short' }}
                    </span>
                  </div>
                  <p class="text-xs text-emerald-800 leading-relaxed" *ngIf="c.resolutionNotes">
                    "{{ c.resolutionNotes }}"
                  </p>

                  <!-- Feedback Section -->
                  <div class="pt-2 border-t border-emerald-200 flex items-center justify-between">
                    <div *ngIf="c.feedback?.rating" class="flex items-center gap-1.5">
                      <span class="text-amber-500 font-bold">★ {{ c.feedback?.rating }}/5</span>
                      <span class="text-emerald-800 text-[11px]">"{{ c.feedback?.comment || 'Rated' }}"</span>
                    </div>
                    <button
                      *ngIf="!c.feedback?.rating"
                      (click)="openFeedbackModal(c)"
                      class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition"
                    >
                      ⭐ Rate Technician & Service
                    </button>
                  </div>
                </div>

                <!-- Actions: Timeline & Upvote Count -->
                <div class="pt-2 flex items-center justify-between text-xs">
                  <button
                    (click)="openTimelineModal(c)"
                    class="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                  >
                    <span>📜 View Full Live Timeline ({{ c.timeline.length }} entries)</span>
                  </button>

                  <div class="flex items-center gap-1.5 text-slate-500 font-medium">
                    <span>👍 {{ c.upvotes.length }} student upvotes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ================= TAB 3: CAMPUS PROBLEM LIVE FEED ================= -->
          <div *ngIf="activeTab() === 'campus-feed'" class="space-y-4 animate-fade-in">
            <div class="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 class="text-sm font-bold text-slate-900">Live Campus Problem Board</h3>
                <p class="text-xs text-slate-500">Discover active issues across college blocks. Upvote to alert management that multiple students are affected!</p>
              </div>
              <span class="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                {{ allComplaints().length }} Total Campus Issues
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                *ngFor="let item of allComplaints()"
                class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition space-y-3"
              >
                <div class="flex items-center justify-between">
                  <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                    #{{ item.complaintId }}
                  </span>
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    [ngClass]="{
                      'bg-rose-100 text-rose-800': item.priority === 'Emergency',
                      'bg-amber-100 text-amber-800': item.priority === 'High',
                      'bg-blue-100 text-blue-800': item.priority === 'Medium',
                      'bg-slate-100 text-slate-800': item.priority === 'Low'
                    }"
                  >
                    {{ item.priority }}
                  </span>
                </div>

                <h4 class="font-bold text-slate-900 text-sm">{{ item.title }}</h4>
                <p class="text-xs text-slate-600 line-clamp-2">{{ item.description }}</p>

                <div class="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span>📍 {{ item.location.building }} &bull; {{ item.location.room }}</span>
                  <span class="font-medium text-blue-600">{{ item.category }}</span>
                </div>

                <div class="flex items-center justify-between pt-1">
                  <span class="text-xs text-slate-400">
                    By {{ item.submittedBy.name || 'Student' }}
                  </span>
                  <button
                    (click)="upvoteExisting(item._id || item.id)"
                    class="px-3 py-1.5 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <span>👍 Upvote</span>
                    <span class="bg-blue-100 px-1.5 py-0.2 rounded-full text-[10px]">{{ item.upvotes.length }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <!-- ================= MODAL: TIMELINE & STATUS STEPPER ================= -->
      <div *ngIf="selectedComplaintForTimeline()" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto space-y-5 animate-fade-in">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span class="text-xs font-mono font-bold text-blue-600">
                #{{ selectedComplaintForTimeline()?.complaintId }}
              </span>
              <h3 class="font-bold text-slate-900 text-base">Live Activity Timeline</h3>
            </div>
            <button
              (click)="selectedComplaintForTimeline.set(null)"
              class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-lg font-bold"
            >
              &times;
            </button>
          </div>

          <div class="space-y-4 relative pl-4 border-l-2 border-blue-200 ml-2">
            <div *ngFor="let step of selectedComplaintForTimeline()?.timeline" class="relative group">
              <span class="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-blue-100"></span>
              <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800">{{ step.status }}</span>
                  <span class="text-[10px] text-slate-400">{{ step.timestamp | date: 'short' }}</span>
                </div>
                <p class="text-slate-600 leading-relaxed">{{ step.message }}</p>
                <span class="text-[10px] text-slate-400 block">Logged by: {{ step.updatedBy }}</span>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex justify-end">
            <button
              (click)="selectedComplaintForTimeline.set(null)"
              class="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <!-- ================= MODAL: FEEDBACK & RATING ================= -->
      <div *ngIf="selectedComplaintForFeedback()" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-fade-in">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="font-bold text-slate-900 text-base">Rate Maintenance Resolution</h3>
            <button
              (click)="selectedComplaintForFeedback.set(null)"
              class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-lg font-bold"
            >
              &times;
            </button>
          </div>

          <p class="text-xs text-slate-600">
            How satisfied are you with the resolution of:
            <span class="font-bold text-slate-800">"{{ selectedComplaintForFeedback()?.title }}"</span>?
          </p>

          <!-- Interactive 5 Stars -->
          <div class="flex items-center justify-center gap-2 py-3">
            <button
              *ngFor="let star of [1, 2, 3, 4, 5]"
              type="button"
              (click)="feedbackRating.set(star)"
              class="text-3xl transition transform hover:scale-125 focus:outline-hidden"
              [ngClass]="star <= feedbackRating() ? 'text-amber-400' : 'text-slate-300'"
            >
              ★
            </button>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Your Review / Remarks (Optional)</label>
            <textarea
              [(ngModel)]="feedbackComment"
              rows="2"
              placeholder="e.g. Prompt repair, bench is solid and polished now!"
              class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-hidden focus:border-blue-600"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              (click)="selectedComplaintForFeedback.set(null)"
              class="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="submitRating()"
              class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
            >
              Submit Rating
            </button>
          </div>
        </div>
      </div>

      <!-- ================= MODAL: STUDENT PROFILE & AVATAR ================= -->
      <app-profile-modal *ngIf="showProfileModal()" (close)="showProfileModal.set(false)"></app-profile-modal>
    </div>
  `,
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  complaintService = inject(ComplaintService);
  aiService = inject(AiService);
  socketService = inject(SocketService);
  toastService = inject(ToastService);
  route = inject(ActivatedRoute);

  Math = Math;

  activeTab = signal<'my-tickets' | 'new' | 'campus-feed'>('my-tickets');
  showProfileModal = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  // Complaints lists
  myComplaints = signal<Complaint[]>([]);
  allComplaints = signal<Complaint[]>([]);
  filteredMyComplaints = signal<Complaint[]>([]);

  // Search & Filter
  searchQuery = '';
  filterStatus = 'all';
  filterCategory = 'all';

  // New Complaint Form Models
  newTitle = '';
  newDescription = '';
  newCategory = 'Electrical';
  newPriority = 'Medium';
  newBuilding = 'Engineering Block A';
  newFloor = '3rd Floor';
  newRoom = '';
  newLandmark = '';
  previewImage = signal<string | null>(null);

  // AI & Duplicate state
  aiSuggestion = signal<AISuggestions | null>(null);
  duplicateWarning = signal<string | null>(null);
  duplicateMatches = signal<any[]>([]);

  // Modals
  selectedComplaintForTimeline = signal<Complaint | null>(null);
  selectedComplaintForFeedback = signal<Complaint | null>(null);
  feedbackRating = signal<number>(5);
  feedbackComment = '';

  private subs = new Subscription();
  private debounceTimer: any = null;

  ngOnInit(): void {
    // Check query params for default tab (e.g. ?tab=new)
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab.set(params['tab']);
      }
    });

    this.loadMyComplaints();
    this.loadCampusFeed();

    // Listen to real-time events
    this.subs.add(
      this.socketService.complaintCreated$.subscribe(c => {
        this.allComplaints.update(list => [c, ...list]);
        const subId = c.submittedBy?._id || c.submittedBy?.id;
        const myId = this.authService.currentUser()?._id || this.authService.currentUser()?.id;
        if (subId && subId === myId) {
          this.myComplaints.update(list => [c, ...list]);
          this.applyLocalFilters();
        }
      })
    );

    this.subs.add(
      this.socketService.complaintUpdated$.subscribe(c => {
        this.updateLocalComplaint(c);
      })
    );

    this.subs.add(
      this.socketService.complaintResolved$.subscribe(c => {
        this.updateLocalComplaint(c);
        const subId = c.submittedBy?._id || c.submittedBy?.id;
        const myId = this.authService.currentUser()?._id || this.authService.currentUser()?.id;
        if (subId && subId === myId) {
          this.toastService.success('Ticket Resolved!', `Your complaint #${c.complaintId} has been resolved!`);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  loadMyComplaints(): void {
    this.complaintService.getComplaints({ myComplaints: 'true' }).subscribe({
      next: res => {
        if (res.success) {
          this.myComplaints.set(res.complaints);
          this.applyLocalFilters();
        }
      },
    });
  }

  loadCampusFeed(): void {
    this.complaintService.getComplaints().subscribe({
      next: res => {
        if (res.success) {
          this.allComplaints.set(res.complaints);
        }
      },
    });
  }

  updateLocalComplaint(updated: Complaint): void {
    this.myComplaints.update(list =>
      list.map(c => (c._id === updated._id || c.complaintId === updated.complaintId ? updated : c))
    );
    this.allComplaints.update(list =>
      list.map(c => (c._id === updated._id || c.complaintId === updated.complaintId ? updated : c))
    );
    this.applyLocalFilters();
  }

  applyLocalFilters(): void {
    let list = this.myComplaints();

    if (this.filterStatus !== 'all') {
      list = list.filter(c => c.status === this.filterStatus);
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
          c.location.room.toLowerCase().includes(q)
      );
    }

    this.filteredMyComplaints.set(list);
  }

  // Count helpers
  countPending(): number {
    return this.myComplaints().filter(c => c.status === 'Pending').length;
  }
  countInProgress(): number {
    return this.myComplaints().filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
  }
  countResolved(): number {
    return this.myComplaints().filter(c => c.status === 'Resolved').length;
  }

  // AI & Duplicate Handlers
  onTextChange(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (this.newTitle.length > 3 || this.newDescription.length > 5) {
        this.fetchAiSuggestions();
      }
      this.triggerDuplicateCheck();
    }, 450);
  }

  fetchAiSuggestions(): void {
    this.aiService.getSuggestions(this.newTitle, this.newDescription).subscribe({
      next: res => {
        if (res.success && res.suggestions) {
          this.aiSuggestion.set(res.suggestions);
        }
      },
    });
  }

  applyAiSuggestions(): void {
    const s = this.aiSuggestion();
    if (s) {
      this.newCategory = s.category;
      this.newPriority = s.priority;
      this.toastService.info('Applied AI Recommendations', `Category: ${s.category}, Priority: ${s.priority}`);
    }
  }

  triggerDuplicateCheck(): void {
    if (!this.newTitle || !this.newBuilding || !this.newRoom) return;

    this.aiService
      .checkDuplicates({
        title: this.newTitle,
        description: this.newDescription,
        category: this.newCategory,
        location: {
          building: this.newBuilding,
          floor: this.newFloor,
          room: this.newRoom,
        },
      })
      .subscribe({
        next: res => {
          if (res.isDuplicate && res.matches && res.matches.length > 0) {
            this.duplicateWarning.set(res.warningMessage || 'Active duplicate ticket in this room found.');
            this.duplicateMatches.set(res.matches);
          } else {
            this.duplicateWarning.set(null);
            this.duplicateMatches.set([]);
          }
        },
      });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  submitComplaint(forceSubmit = false): void {
    if (!this.newTitle.trim() || !this.newDescription.trim() || !this.newRoom.trim()) {
      this.toastService.warning('Required Fields', 'Please fill in Title, Description, and Room Number.');
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      title: this.newTitle,
      description: this.newDescription,
      category: this.newCategory,
      priority: this.newPriority,
      location: {
        building: this.newBuilding,
        floor: this.newFloor,
        room: this.newRoom,
        landmark: this.newLandmark,
      },
      images: this.previewImage() ? [this.previewImage()!] : [],
      forceSubmit,
    };

    this.complaintService.createComplaint(payload).subscribe({
      next: res => {
        this.isSubmitting.set(false);
        this.toastService.success('Complaint Registered', `Ticket #${res.complaint.complaintId} logged successfully!`);
        this.resetForm();
        this.loadMyComplaints();
        this.activeTab.set('my-tickets');
      },
      error: err => {
        this.isSubmitting.set(false);
        if (err.status === 409 && err.error?.isDuplicate) {
          this.duplicateWarning.set(err.error.message);
          this.duplicateMatches.set(err.error.matches || []);
          this.toastService.warning('Duplicate Alert', 'A similar issue already exists in this location.');
        } else {
          this.toastService.error('Submission Failed', err.error?.message || 'Could not lodge complaint');
        }
      },
    });
  }

  forceSubmitNewComplaint(): void {
    this.submitComplaint(true);
  }

  upvoteExisting(id?: string): void {
    if (!id) return;
    this.complaintService.upvoteComplaint(id).subscribe({
      next: res => {
        this.toastService.success('Upvoted!', 'You upvoted this issue. Facilities alerted.');
        this.loadCampusFeed();
      },
    });
  }

  resetForm(): void {
    this.newTitle = '';
    this.newDescription = '';
    this.newRoom = '';
    this.newLandmark = '';
    this.previewImage.set(null);
    this.aiSuggestion.set(null);
    this.duplicateWarning.set(null);
    this.duplicateMatches.set([]);
  }

  // Status Stepper helpers
  isStepActive(currentStatus: string, step: string): boolean {
    const order = ['Pending', 'Assigned', 'In Progress', 'Resolved'];
    return order.indexOf(currentStatus) >= order.indexOf(step);
  }

  getStepPercentage(status: string): string {
    switch (status) {
      case 'Pending': return '25%';
      case 'Assigned': return '50%';
      case 'In Progress': return '75%';
      case 'Resolved': return '100%';
      default: return '25%';
    }
  }

  openTimelineModal(c: Complaint): void {
    this.selectedComplaintForTimeline.set(c);
  }

  openFeedbackModal(c: Complaint): void {
    this.selectedComplaintForFeedback.set(c);
    this.feedbackRating.set(5);
    this.feedbackComment = '';
  }

  submitRating(): void {
    const c = this.selectedComplaintForFeedback();
    if (!c) return;

    this.complaintService.submitFeedback(c._id || c.id!, {
      rating: this.feedbackRating(),
      comment: this.feedbackComment,
    }).subscribe({
      next: res => {
        this.toastService.success('Feedback Saved', 'Thank you for rating the service!');
        this.selectedComplaintForFeedback.set(null);
        this.loadMyComplaints();
      },
      error: err => {
        this.toastService.error('Feedback Error', err.error?.message || 'Failed to submit rating');
      },
    });
  }
}
