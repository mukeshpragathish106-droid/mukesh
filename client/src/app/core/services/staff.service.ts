import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class StaffService {
  private readonly apiUrl = '/api/staff';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getMyTasks(status?: string): Observable<any> {
    let params = new HttpParams();
    if (status && status !== 'all') params = params.set('status', status);

    return this.http.get<any>(`${this.apiUrl}/tasks`, {
      headers: this.authService.getAuthHeaders(),
      params,
    });
  }

  updateProgress(id: string, data: { status?: string; workLog?: string; estimatedHours?: number }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/complaints/${id}/progress`, data, {
      headers: this.authService.getAuthHeaders(),
    });
  }

  resolveComplaint(id: string, data: { resolutionNotes: string; resolutionProofImage?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/complaints/${id}/resolve`, data, {
      headers: this.authService.getAuthHeaders(),
    });
  }
}
