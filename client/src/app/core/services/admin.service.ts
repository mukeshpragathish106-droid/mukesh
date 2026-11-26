import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly apiUrl = '/api/admin';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics`, {
      headers: this.authService.getAuthHeaders(),
    });
  }

  assignComplaint(id: string, assignment: { staffId: string; estimatedHours?: number; notes?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/complaints/${id}/assign`, assignment, {
      headers: this.authService.getAuthHeaders(),
    });
  }

  updateStatusPriority(id: string, data: { status?: string; priority?: string; reason?: string }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/complaints/${id}/status-priority`, data, {
      headers: this.authService.getAuthHeaders(),
    });
  }

  getAllUsers(role?: string): Observable<any> {
    let params = new HttpParams();
    if (role && role !== 'all') params = params.set('role', role);

    return this.http.get<any>(`${this.apiUrl}/users`, {
      headers: this.authService.getAuthHeaders(),
      params,
    });
  }

  toggleUserStatus(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/users/${id}/toggle-status`, {}, {
      headers: this.authService.getAuthHeaders(),
    });
  }
}
