import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject, Observable } from 'rxjs';
import { Complaint } from '../models/complaint.model';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket!: Socket;
  private complaintCreatedSubject = new Subject<Complaint>();
  private complaintUpdatedSubject = new Subject<Complaint>();
  private complaintResolvedSubject = new Subject<Complaint>();
  private notificationNewSubject = new Subject<any>();

  public complaintCreated$: Observable<Complaint> = this.complaintCreatedSubject.asObservable();
  public complaintUpdated$: Observable<Complaint> = this.complaintUpdatedSubject.asObservable();
  public complaintResolved$: Observable<Complaint> = this.complaintResolvedSubject.asObservable();
  public notificationNew$: Observable<any> = this.notificationNewSubject.asObservable();

  constructor() {
    this.connect();
  }

  private connect(): void {
    // In dev mode with proxy or standalone, connect to host
    this.socket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      console.log('[Socket.IO] Connected to real-time notification engine with id:', this.socket.id);
    });

    this.socket.on('complaint:created', (complaint: Complaint) => {
      this.complaintCreatedSubject.next(complaint);
    });

    this.socket.on('complaint:updated', (complaint: Complaint) => {
      this.complaintUpdatedSubject.next(complaint);
    });

    this.socket.on('complaint:resolved', (complaint: Complaint) => {
      this.complaintResolvedSubject.next(complaint);
    });

    this.socket.on('notification:new', (notif: any) => {
      this.notificationNewSubject.next(notif);
    });
  }

  joinRoom(userId: string, role: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join', { userId, role });
    }
  }
}
