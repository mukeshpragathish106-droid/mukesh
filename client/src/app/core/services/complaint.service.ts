import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Complaint } from '../models/complaint.model';

@Injectable({
  providedIn: 'root',
})
export class ComplaintService {
  private readonly apiUrl = '/api/complaints';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getComplaints(filters: any = {}): Observable<{ success: boolean; count: number; complaints: Complaint[] }> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });

    return this.http.get<{ success: boolean; count: number; complaints: Complaint[] }>(this.apiUrl, {
      headers: this.authService.getAuthHeaders(),
      params,
    });
  }

  getComplaintById(id: string): Observable<{ success: boolean; complaint: Complaint }> {
    return this.http.get<{ success: boolean; complaint: Complaint }>(`${this.apiUrl}/${id}`, {
      headers: this.authService.getAuthHeaders(),
    });
  }

  createComplaint(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data, {
      headers: this.authService.getAuthHeaders(),
    });
  }

  upvoteComplaint(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/upvote`, {}, {
      headers: this.authService.getAuthHeaders(),
    });
  }

  submitFeedback(id: string, feedback: { rating: number; comment?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/feedback`, feedback, {
      headers: this.authService.getAuthHeaders(),
    });
  }
}
