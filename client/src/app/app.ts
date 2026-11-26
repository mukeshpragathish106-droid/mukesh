import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/toast-container.component';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { SocketService } from './core/services/socket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  socketService = inject(SocketService);

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.notificationService.fetchNotifications().subscribe();
      const u = this.authService.currentUser();
      if (u) {
        this.socketService.joinRoom(u._id || u.id!, u.role);
      }
    }

    // Real-time notifications listener
    this.socketService.notificationNew$.subscribe(notif => {
      this.notificationService.addRealTimeNotification(notif);
    });
  }
}
