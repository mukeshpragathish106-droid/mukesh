export interface NotificationItem {
  _id: string;
  id?: string;
  recipient?: string;
  targetRole?: string;
  title: string;
  message: string;
  type: string;
  complaintId?: string;
  isRead: boolean;
  createdAt: string;
}
