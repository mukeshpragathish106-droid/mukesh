import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { NotificationItem } from '../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly apiUrl = '/api/notifications';

  readonly notifications = signal<NotificationItem[]>([]);
  readonly unreadCount = signal<number>(0);

  constructor(private http: HttpClient, private authService: AuthService) {}

  fetchNotifications(): Observable<any> {
    return this.http
      .get<{ success: boolean; count: number; unreadCount: number; notifications: NotificationItem[] }>(this.apiUrl, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(
        tap(res => {
          if (res.success) {
            this.notifications.set(res.notifications || []);
            this.unreadCount.set(res.unreadCount || 0);
          }
        })
      );
  }

  markAsRead(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/read`, {}, {
      headers: this.authService.getAuthHeaders(),
    }).pipe(
      tap(() => {
        this.notifications.update(list =>
          list.map(n => (n._id === id || n.id === id ? { ...n, isRead: true } : n))
        );
        this.unreadCount.update(c => Math.max(0, c - 1));
      })
    );
  }

  markAllRead(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/mark-all-read`, {}, {
      headers: this.authService.getAuthHeaders(),
    }).pipe(
      tap(() => {
        this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
        this.unreadCount.set(0);
      })
    );
  }

  addRealTimeNotification(notif: any): void {
    const item: NotificationItem = {
      _id: 'realtime_' + Date.now(),
      title: notif.title || 'New Notification',
      message: notif.message || '',
      type: notif.type || 'system',
      complaintId: notif.complaintId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.update(list => [item, ...list]);
    this.unreadCount.update(c => c + 1);
  }
}
