import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface AISuggestions {
  category: string;
  categoryConfidence: number;
  categoryReason: string;
  priority: string;
  priorityConfidence: number;
  priorityReason: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  warningMessage?: string | null;
  matches: Array<{
    complaintId: string;
    id: string;
    title: string;
    status: string;
    category: string;
    location: any;
    similarityScore: number;
    upvotesCount: number;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private readonly apiUrl = '/api/ai';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getSuggestions(title: string, description: string): Observable<{ success: boolean; suggestions: AISuggestions }> {
    return this.http.post<{ success: boolean; suggestions: AISuggestions }>(
      `${this.apiUrl}/suggest`,
      { title, description },
      { headers: this.authService.getAuthHeaders() }
    );
  }

  checkDuplicates(payload: {
    title: string;
    description: string;
    category: string;
    location: any;
  }): Observable<{ success: boolean } & DuplicateCheckResult> {
    return this.http.post<{ success: boolean } & DuplicateCheckResult>(
      `${this.apiUrl}/check-duplicates`,
      payload,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  getHotspotAnalysis(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/hotspots`, {
      headers: this.authService.getAuthHeaders(),
    });
  }
}
