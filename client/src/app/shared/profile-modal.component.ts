import { Component, EventEmitter, Input, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5 animate-fade-in">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <span>👤</span>
            </div>
            <div>
              <h3 class="font-extrabold text-slate-900 text-lg">Student Profile & Photo</h3>
              <p class="text-xs text-slate-500">Update your campus avatar and student information</p>
            </div>
          </div>
          <button
            (click)="closeModal()"
            class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-lg font-bold transition"
          >
            &times;
          </button>
        </div>

        <!-- Avatar Upload Section -->
        <div class="p-5 bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-slate-50 rounded-2xl border border-blue-100/80 flex flex-col sm:flex-row items-center gap-5">
          <!-- Current Avatar with edit overlay -->
          <div class="relative group shrink-0">
            <img
              [src]="previewAvatar() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'"
              alt="Profile Avatar"
              class="w-24 h-24 rounded-2xl object-cover border-3 border-white shadow-md ring-2 ring-blue-500/30"
            />
            <label
              class="absolute inset-0 rounded-2xl bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer backdrop-blur-[2px]"
            >
              <svg class="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="text-[10px] font-bold">Change</span>
              <input type="file" accept="image/*" (change)="onFileSelected($event)" class="hidden" />
            </label>
          </div>

          <!-- Upload actions -->
          <div class="flex-1 space-y-2 text-center sm:text-left">
            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <label class="cursor-pointer px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Upload Photo</span>
                <input type="file" accept="image/*" (change)="onFileSelected($event)" class="hidden" />
              </label>

              <button
                type="button"
                (click)="toggleCustomUrl.set(!toggleCustomUrl())"
                class="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs transition"
              >
                {{ toggleCustomUrl() ? 'Hide URL' : 'Paste Image URL' }}
              </button>
            </div>
            <p class="text-[11px] text-slate-500">
              Upload any personal picture (JPG, PNG, WebP) or select an avatar preset below.
            </p>
          </div>
        </div>

        <!-- Custom Image URL input if expanded -->
        <div *ngIf="toggleCustomUrl()" class="p-3 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in">
          <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Direct Image URL</label>
          <div class="flex gap-2">
            <input
              type="url"
              [(ngModel)]="customImageUrl"
              placeholder="https://example.com/my-photo.jpg"
              class="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs outline-hidden focus:border-blue-600"
            />
            <button
              type="button"
              (click)="applyCustomUrl()"
              class="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs"
            >
              Preview
            </button>
          </div>
        </div>

        <!-- Quick Preset Avatars -->
        <div class="space-y-2">
          <span class="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Or Choose from Student Avatars
          </span>
          <div class="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
            <button
              *ngFor="let avatarUrl of presetAvatars"
              type="button"
              (click)="selectPresetAvatar(avatarUrl)"
              class="relative rounded-xl overflow-hidden border-2 transition transform hover:scale-105 group"
              [ngClass]="previewAvatar() === avatarUrl ? 'border-blue-600 ring-2 ring-blue-500/40 shadow-md' : 'border-slate-200 hover:border-slate-400'"
            >
              <img [src]="avatarUrl" class="w-full h-12 sm:h-14 object-cover" />
              <div
                *ngIf="previewAvatar() === avatarUrl"
                class="absolute inset-0 bg-blue-600/30 flex items-center justify-center text-white text-xs font-bold"
              >
                ✓
              </div>
            </button>
          </div>
        </div>

        <!-- Student Profile Details Form -->
        <div class="space-y-3.5 pt-2 border-t border-slate-100">
          <span class="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Student Information
          </span>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                [(ngModel)]="profileName"
                class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-hidden focus:border-blue-600 font-medium"
              />
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Student Roll / ID</label>
              <input
                type="text"
                [(ngModel)]="profileStudentId"
                class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-hidden focus:border-blue-600 font-mono"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Department</label>
              <select
                [(ngModel)]="profileDepartment"
                class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-hidden focus:border-blue-600 bg-white"
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
              <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone Number</label>
              <input
                type="tel"
                [(ngModel)]="profilePhone"
                placeholder="+91 98765 00000"
                class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-hidden focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-xs text-slate-400">Updates sync in real-time</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="closeModal()"
              class="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="saveProfile()"
              [disabled]="isSaving()"
              class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <span *ngIf="isSaving()" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>{{ isSaving() ? 'Saving...' : 'Save Profile & Photo' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProfileModalComponent implements OnInit {
  authService = inject(AuthService);
  toastService = inject(ToastService);

  @Output() close = new EventEmitter<void>();

  previewAvatar = signal<string>('');
  toggleCustomUrl = signal<boolean>(false);
  customImageUrl = '';
  isSaving = signal<boolean>(false);

  profileName = '';
  profileStudentId = '';
  profileDepartment = '';
  profilePhone = '';

  // Realistic curated campus student avatar presets
  readonly presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', // Student female 1
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', // Student female 2 (Priya)
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200', // Student female 3
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200', // Student male 1
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', // Student male 2
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', // Student male 3
  ];

  ngOnInit(): void {
    const u = this.authService.currentUser();
    if (u) {
      this.previewAvatar.set(u.avatar || this.presetAvatars[0]);
      this.profileName = u.name || '';
      this.profileStudentId = u.studentId || '';
      this.profileDepartment = u.department || 'Computer Science & Engineering';
      this.profilePhone = u.phone || '';
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        this.previewAvatar.set(base64Data);
        this.toastService.info('Image Loaded', 'Preview updated! Click Save Profile & Photo to apply.');
      };
      reader.readAsDataURL(file);
    }
  }

  selectPresetAvatar(url: string): void {
    this.previewAvatar.set(url);
  }

  applyCustomUrl(): void {
    if (this.customImageUrl.trim()) {
      this.previewAvatar.set(this.customImageUrl.trim());
      this.toastService.info('URL Applied', 'Previewing custom image');
    }
  }

  saveProfile(): void {
    this.isSaving.set(true);

    const payload = {
      name: this.profileName,
      avatar: this.previewAvatar(),
      studentId: this.profileStudentId,
      department: this.profileDepartment,
      phone: this.profilePhone,
    };

    this.authService.updateProfile(payload).subscribe({
      next: res => {
        this.isSaving.set(false);
        this.toastService.success('Profile Updated', 'Your profile image and details were successfully saved!');
        this.closeModal();
      },
      error: err => {
        this.isSaving.set(false);
        this.toastService.error('Update Failed', err.error?.message || 'Could not save profile changes');
      },
    });
  }

  closeModal(): void {
    this.close.emit();
  }
}
