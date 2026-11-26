import { store, isDbConnected } from '../config/db.js';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { analyzeHotspots } from '../services/aiService.js';
import { getIO } from '../server.js';

export async function assignComplaint(req, res) {
  try {
    const { id } = req.params;
    const { staffId, estimatedHours = 24, notes = '' } = req.body;

    if (!staffId) {
      return res.status(400).json({ success: false, message: 'Staff member ID is required.' });
    }

    let staff = null;
    let complaint = null;

    if (isDbConnected()) {
      staff = await User.findById(staffId);
      if (!staff || staff.role !== 'staff') {
        return res.status(404).json({ success: false, message: 'Valid maintenance staff member not found.' });
      }

      complaint = await Complaint.findById(id);
      if (!complaint) {
        return res.status(404).json({ success: false, message: 'Complaint not found.' });
      }

      complaint.assignedTo = staff._id;
      complaint.assignedAt = new Date();
      complaint.status = 'Assigned';
      complaint.estimatedHours = Number(estimatedHours) || 24;

      const timelineMsg = `Assigned to ${staff.name} (${staff.department}). Estimated completion: ${estimatedHours}h. ${notes ? 'Note: ' + notes : ''}`;
      complaint.timeline.push({
        status: 'Assigned',
        message: timelineMsg,
        updatedBy: req.user.name,
        timestamp: new Date(),
      });

      await complaint.save();
      complaint = await Complaint.findById(id)
        .populate('submittedBy', 'name email department phone studentId')
        .populate('assignedTo', 'name email department phone');

      // Notify Staff
      await Notification.create({
        recipient: staff._id,
        targetRole: 'staff',
        title: 'New Complaint Assigned',
        message: `You were assigned ticket #${complaint.complaintId}: ${complaint.title}`,
        type: 'complaint_assigned',
        complaintId: complaint._id,
      });

      // Notify Student
      if (complaint.submittedBy) {
        await Notification.create({
          recipient: complaint.submittedBy._id,
          targetRole: 'student',
          title: 'Staff Assigned to Your Complaint',
          message: `${staff.name} (${staff.department}) is assigned to #${complaint.complaintId}.`,
          type: 'complaint_assigned',
          complaintId: complaint._id,
        });
      }
    } else {
      staff = store.findUserById(staffId);
      if (!staff || staff.role !== 'staff') {
        return res.status(404).json({ success: false, message: 'Valid maintenance staff member not found.' });
      }

      const timelineMsg = `Assigned to ${staff.name} (${staff.department}). Estimated completion: ${estimatedHours}h. ${notes ? 'Note: ' + notes : ''}`;

      complaint = store.updateComplaint(id, {
        assignedTo: staff,
        assignedAt: new Date(),
        status: 'Assigned',
        estimatedHours: Number(estimatedHours) || 24,
        timelineEntry: {
          status: 'Assigned',
          message: timelineMsg,
          updatedBy: req.user.name,
          timestamp: new Date(),
        },
      });

      store.createNotification({
        recipient: staff._id || staff.id,
        targetRole: 'staff',
        title: 'New Complaint Assigned',
        message: `You were assigned ticket #${complaint.complaintId}: ${complaint.title}`,
        type: 'complaint_assigned',
        complaintId: complaint._id,
      });

      const subId = complaint.submittedBy?._id || complaint.submittedBy?.id;
      if (subId) {
        store.createNotification({
          recipient: subId,
          targetRole: 'student',
          title: 'Staff Assigned to Your Complaint',
          message: `${staff.name} (${staff.department}) is assigned to #${complaint.complaintId}.`,
          type: 'complaint_assigned',
          complaintId: complaint._id,
        });
      }
    }

    try {
      const io = getIO();
      if (io) {
        io.emit('complaint:updated', complaint);
        io.emit('notification:new', {
          title: 'Ticket Assigned',
          message: `Ticket #${complaint.complaintId} assigned to ${staff.name}`,
        });
      }
    } catch (e) {}

    return res.json({
      success: true,
      message: `Complaint successfully assigned to ${staff.name}!`,
      complaint,
    });
  } catch (err) {
    console.error('Assign complaint error:', err);
    return res.status(500).json({ success: false, message: 'Failed to assign complaint.', error: err.message });
  }
}

export async function updateStatusPriority(req, res) {
  try {
    const { id } = req.params;
    const { status, priority, reason = '' } = req.body;

    let complaint = null;
    const updates = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;

    const timelineMsg = `Admin updated details: ${status ? 'Status -> ' + status + '; ' : ''}${priority ? 'Priority -> ' + priority + '; ' : ''}${reason ? 'Reason: ' + reason : ''}`;

    if (isDbConnected()) {
      complaint = await Complaint.findById(id);
      if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

      if (status) complaint.status = status;
      if (priority) complaint.priority = priority;
      if (status === 'Resolved' && !complaint.resolvedAt) {
        complaint.resolvedAt = new Date();
      }

      complaint.timeline.push({
        status: complaint.status,
        message: timelineMsg,
        updatedBy: req.user.name,
        timestamp: new Date(),
      });

      await complaint.save();
      complaint = await Complaint.findById(id)
        .populate('submittedBy', 'name email department phone studentId')
        .populate('assignedTo', 'name email department phone');
    } else {
      updates.timelineEntry = {
        status: status || 'Updated',
        message: timelineMsg,
        updatedBy: req.user.name,
        timestamp: new Date(),
      };
      if (status === 'Resolved') updates.resolvedAt = new Date();

      complaint = store.updateComplaint(id, updates);
    }

    try {
      const io = getIO();
      if (io) io.emit('complaint:updated', complaint);
    } catch (e) {}

    return res.json({ success: true, message: 'Complaint status/priority updated.', complaint });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Update failed.', error: err.message });
  }
}

export async function getAnalytics(req, res) {
  try {
    let allComplaints = [];
    let staffMembers = [];

    if (isDbConnected()) {
      allComplaints = await Complaint.find().lean();
      staffMembers = await User.find({ role: 'staff' }).select('name department avatar email').lean();
    } else {
      allComplaints = store.findComplaints();
      staffMembers = store.findUsers({ role: 'staff' });
    }

    // Counts
    const total = allComplaints.length;
    const pending = allComplaints.filter(c => c.status === 'Pending').length;
    const assigned = allComplaints.filter(c => c.status === 'Assigned').length;
    const inProgress = allComplaints.filter(c => c.status === 'In Progress').length;
    const resolved = allComplaints.filter(c => c.status === 'Resolved').length;
    const emergency = allComplaints.filter(c => c.priority === 'Emergency' && c.status !== 'Resolved').length;

    // Category breakdown
    const categoryCounts = {};
    for (const c of allComplaints) {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    }
    const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0,
    }));

    // Priority breakdown
    const priorityCounts = { Low: 0, Medium: 0, High: 0, Emergency: 0 };
    for (const c of allComplaints) {
      if (priorityCounts[c.priority] !== undefined) {
        priorityCounts[c.priority]++;
      }
    }

    // Average resolution time in hours
    const resolvedItems = allComplaints.filter(c => c.resolvedAt && c.createdAt);
    let avgResolutionHours = 14.5;
    if (resolvedItems.length > 0) {
      const totalDurationMs = resolvedItems.reduce((acc, c) => {
        return acc + (new Date(c.resolvedAt) - new Date(c.createdAt));
      }, 0);
      avgResolutionHours = Math.round((totalDurationMs / (resolvedItems.length * 3600 * 1000)) * 10) / 10;
    }

    // Average student satisfaction rating
    const ratedItems = allComplaints.filter(c => c.feedback?.rating);
    const avgRating = ratedItems.length > 0
      ? Math.round((ratedItems.reduce((acc, c) => acc + c.feedback.rating, 0) / ratedItems.length) * 10) / 10
      : 4.6;

    // Staff workload stats
    const staffStats = staffMembers.map(staff => {
      const staffId = (staff._id || staff.id).toString();
      const staffComplaints = allComplaints.filter(c => {
        const assId = c.assignedTo?._id || c.assignedTo?.id || c.assignedTo;
        return assId && assId.toString() === staffId;
      });

      return {
        id: staffId,
        name: staff.name,
        department: staff.department,
        avatar: staff.avatar,
        activeTasks: staffComplaints.filter(c => c.status !== 'Resolved' && c.status !== 'Rejected').length,
        resolvedTasks: staffComplaints.filter(c => c.status === 'Resolved').length,
        totalAssigned: staffComplaints.length,
      };
    });

    // Hotspot analysis
    const hotspotData = analyzeHotspots(allComplaints);

    return res.json({
      success: true,
      analytics: {
        summary: {
          total,
          pending,
          assigned,
          inProgress,
          resolved,
          emergency,
          resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
          avgResolutionHours,
          avgRating,
        },
        categoryData,
        priorityCounts,
        staffStats,
        hotspots: hotspotData.hotspots,
        criticalLocationsCount: hotspotData.criticalLocations,
      },
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ success: false, message: 'Analytics computation failed.', error: err.message });
  }
}

export async function getAllUsers(req, res) {
  try {
    const { role } = req.query;

    if (isDbConnected()) {
      const query = {};
      if (role && role !== 'all') query.role = role;
      const users = await User.find(query).select('-password').sort({ createdAt: -1 });
      return res.json({ success: true, count: users.length, users });
    } else {
      const filter = {};
      if (role && role !== 'all') filter.role = role;
      const users = store.findUsers(filter).map(u => {
        const safe = { ...u };
        delete safe.password;
        return safe;
      });
      return res.json({ success: true, count: users.length, users });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users.', error: err.message });
  }
}

export async function toggleUserStatus(req, res) {
  try {
    const { id } = req.params;
    let user = null;

    if (isDbConnected()) {
      user = await User.findById(id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      user.status = user.status === 'active' ? 'inactive' : 'active';
      await user.save();
      const safe = user.toObject();
      delete safe.password;
      return res.json({ success: true, message: `User status changed to ${user.status}.`, user: safe });
    } else {
      user = store.findUserById(id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      const updated = store.updateUser(id, { status: newStatus });
      const safe = { ...updated };
      delete safe.password;
      return res.json({ success: true, message: `User status changed to ${newStatus}.`, user: safe });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update user status.', error: err.message });
  }
}
