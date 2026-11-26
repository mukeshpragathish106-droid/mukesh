import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = '/api/auth';
  private readonly TOKEN_KEY = 'smart_campus_jwt';
  private readonly USER_KEY = 'smart_campus_user';

  readonly currentUser = signal<User | null>(this.getStoredUser());
  readonly token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));

  readonly isAuthenticated = computed(() => !!this.currentUser() && !!this.token());
  readonly role = computed(() => this.currentUser()?.role || null);

  constructor(private http: HttpClient, private router: Router) {}

  private getStoredUser(): User | null {
    try {
      const data = localStorage.getItem(this.USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  getAuthHeaders(): { [header: string]: string } {
    const t = this.token();
    return t ? { Authorization: `Bearer ${t}` } : {};
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData).pipe(
      tap(res => {
        if (res.success && res.token && res.user) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.token && res.user) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  demoLogin(role: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/demo-login`, { role }).pipe(
      tap(res => {
        if (res.success && res.token && res.user) {
          this.setSession(res.token, res.user);
          this.redirectByRole(res.user.role);
        }
      })
    );
  }

  updateProfile(data: Partial<User>): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/profile`, data, {
      headers: this.getAuthHeaders(),
    }).pipe(
      tap(res => {
        if (res.success && res.user) {
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
          this.currentUser.set(res.user);
        }
      })
    );
  }

  setSession(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.token.set(token);
    this.currentUser.set(user);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  redirectByRole(userRole?: string): void {
    const r = userRole || this.role();
    if (r === 'admin') {
      this.router.navigate(['/admin']);
    } else if (r === 'staff') {
      this.router.navigate(['/staff']);
    } else {
      this.router.navigate(['/student']);
    }
  }
}
