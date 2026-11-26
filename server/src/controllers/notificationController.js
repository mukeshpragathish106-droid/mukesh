import { store, isDbConnected } from '../config/db.js';
import Notification from '../models/Notification.js';

export async function getNotifications(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const role = req.user.role;

    if (isDbConnected()) {
      const notifications = await Notification.find({
        $or: [
          { recipient: userId },
          { recipient: null, targetRole: { $in: ['all', role] } },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(30);

      const unreadCount = notifications.filter(n => !n.isRead).length;

      return res.json({ success: true, count: notifications.length, unreadCount, notifications });
    } else {
      const notifications = store.findNotifications(userId, role);
      const unreadCount = notifications.filter(n => !n.isRead).length;

      return res.json({ success: true, count: notifications.length, unreadCount, notifications });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.', error: err.message });
  }
}

export async function markAsRead(req, res) {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const notif = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
      return res.json({ success: true, notification: notif });
    } else {
      const notif = store.markNotificationAsRead(id);
      return res.json({ success: true, notification: notif });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to mark as read.', error: err.message });
  }
}

export async function markAllRead(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const role = req.user.role;

    if (isDbConnected()) {
      await Notification.updateMany(
        {
          $or: [
            { recipient: userId },
            { recipient: null, targetRole: { $in: ['all', role] } },
          ],
        },
        { isRead: true }
      );
      return res.json({ success: true, message: 'All notifications marked as read.' });
    } else {
      store.markAllNotificationsRead(userId, role);
      return res.json({ success: true, message: 'All notifications marked as read.' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to mark all as read.', error: err.message });
  }
}
