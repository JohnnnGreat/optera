import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  private removeNotificationSubject = new Subject<string>();

  notifications$: Observable<Notification> = this.notificationSubject.asObservable();
  removeNotification$: Observable<string> = this.removeNotificationSubject.asObservable();

  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  success(title: string, message: string, duration: number = 5000): void {
    this.show('success', title, message, duration);
  }

  error(title: string, message: string, duration: number = 7000): void {
    this.show('error', title, message, duration);
  }

  warning(title: string, message: string, duration: number = 6000): void {
    this.show('warning', title, message, duration);
  }

  info(title: string, message: string, duration: number = 5000): void {
    this.show('info', title, message, duration);
  }

  private show(type: NotificationType, title: string, message: string, duration: number): void {
    const notification: Notification = {
      id: this.generateId(),
      type,
      title,
      message,
      duration,
      timestamp: new Date(),
    };

    this.notificationSubject.next(notification);

    // if (duration > 0) {
    //   setTimeout(() => {
    //     this.remove(notification.id);
    //   }, duration);
    // }
  }

  remove(id: string): void {
    this.removeNotificationSubject.next(id);
  }
}
