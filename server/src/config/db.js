import mongoose from 'mongoose';
import { initialUsers, initialComplaints, initialNotifications } from '../seeds/seedData.js';

let isMongooseConnected = false;

// In-memory / persistent mock store fallback for environments where local MongoDB is not running
class DataStore {
  constructor() {
    this.users = [];
    this.complaints = [];
    this.notifications = [];
  }

  init() {
    this.users = JSON.parse(JSON.stringify(initialUsers));
    this.complaints = JSON.parse(JSON.stringify(initialComplaints));
    this.notifications = JSON.parse(JSON.stringify(initialNotifications));
    console.log(`[DataStore] Fallback database initialized with ${this.users.length} users, ${this.complaints.length} complaints, and ${this.notifications.length} notifications.`);
  }

  // Users
  findUserByEmail(email) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id) {
    return this.users.find(u => (u._id || u.id) === id.toString());
  }

  findUsers(query = {}) {
    let result = [...this.users];
    if (query.role) result = result.filter(u => u.role === query.role);
    if (query.department) result = result.filter(u => u.department === query.department);
    return result;
  }

  createUser(userData) {
    const id = 'usr_' + Date.now() + Math.random().toString(36).substring(2, 6);
    const newUser = {
      _id: id,
      id,
      ...userData,
      status: userData.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  updateUser(id, updates) {
    const user = this.findUserById(id);
    if (!user) return null;
    Object.assign(user, updates, { updatedAt: new Date() });
    return user;
  }

  // Complaints
  findComplaints(filter = {}) {
    let list = [...this.complaints];

    if (filter.status && filter.status !== 'all') {
      list = list.filter(c => c.status === filter.status);
    }
    if (filter.category && filter.category !== 'all') {
      list = list.filter(c => c.category === filter.category);
    }
    if (filter.priority && filter.priority !== 'all') {
      list = list.filter(c => c.priority === filter.priority);
    }
    if (filter.building && filter.building !== 'all') {
      list = list.filter(c => c.location?.building === filter.building);
    }
    if (filter.submittedBy) {
      list = list.filter(c => {
        const subId = c.submittedBy?._id || c.submittedBy?.id || c.submittedBy;
        return subId.toString() === filter.submittedBy.toString();
      });
    }
    if (filter.assignedTo) {
      list = list.filter(c => {
        const assId = c.assignedTo?._id || c.assignedTo?.id || c.assignedTo;
        return assId && assId.toString() === filter.assignedTo.toString();
      });
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.complaintId.toLowerCase().includes(q) ||
        c.location?.building.toLowerCase().includes(q) ||
        c.location?.room.toLowerCase().includes(q)
      );
    }

    // Sort by latest first
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  findComplaintById(id) {
    return this.complaints.find(c => (c._id || c.id) === id.toString() || c.complaintId === id);
  }

  createComplaint(complaintData) {
    const count = this.complaints.length + 1001;
    const complaintId = `CMP-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
    const id = 'cmp_' + Date.now() + Math.random().toString(36).substring(2, 6);

    const newComplaint = {
      _id: id,
      id,
      complaintId,
      ...complaintData,
      status: complaintData.status || 'Pending',
      priority: complaintData.priority || 'Medium',
      upvotes: complaintData.upvotes || [],
      timeline: complaintData.timeline || [
        {
          status: 'Pending',
          message: 'Complaint submitted by student and queued for review.',
          updatedBy: complaintData.submittedBy?.name || 'Student',
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.complaints.unshift(newComplaint);
    return newComplaint;
  }

  updateComplaint(id, updates) {
    const complaint = this.findComplaintById(id);
    if (!complaint) return null;

    if (updates.timelineEntry) {
      if (!complaint.timeline) complaint.timeline = [];
      complaint.timeline.push(updates.timelineEntry);
      delete updates.timelineEntry;
    }

    Object.assign(complaint, updates, { updatedAt: new Date() });
    return complaint;
  }

  // Notifications
  findNotifications(recipientId, role) {
    return this.notifications
      .filter(n => {
        if (!n.recipient && (n.targetRole === 'all' || n.targetRole === role)) return true;
        const recId = n.recipient?._id || n.recipient?.id || n.recipient;
        return recId && recId.toString() === recipientId.toString();
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  createNotification(notifData) {
    const id = 'notif_' + Date.now() + Math.random().toString(36).substring(2, 6);
    const newNotif = {
      _id: id,
      id,
      ...notifData,
      isRead: false,
      createdAt: new Date(),
    };
    this.notifications.unshift(newNotif);
    return newNotif;
  }

  markNotificationAsRead(id) {
    const notif = this.notifications.find(n => (n._id || n.id) === id.toString());
    if (notif) notif.isRead = true;
    return notif;
  }

  markAllNotificationsRead(recipientId, role) {
    this.notifications.forEach(n => {
      const recId = n.recipient?._id || n.recipient?.id || n.recipient;
      if (
        (!n.recipient && (n.targetRole === 'all' || n.targetRole === role)) ||
        (recId && recId.toString() === recipientId.toString())
      ) {
        n.isRead = true;
      }
    });
  }
}

export const store = new DataStore();

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_campus';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    isMongooseConnected = true;
    console.log(`[Database] MongoDB Connected successfully to host: ${conn.connection.host}`);
  } catch (err) {
    isMongooseConnected = false;
    console.warn(`[Database] MongoDB connection to "${uri}" was unavailable (${err.message}).`);
    console.log('[Database] Initiating built-in high-performance in-memory store.');
    store.init();
    console.log('[Database] Ready! All APIs, real-time events, and intelligent suggestions are active.');
  }
}

export function isDbConnected() {
  return isMongooseConnected;
}
