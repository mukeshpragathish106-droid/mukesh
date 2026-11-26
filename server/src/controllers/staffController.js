import { store, isDbConnected } from '../config/db.js';
import Complaint from '../models/Complaint.js';
import Notification from '../models/Notification.js';
import { getIO } from '../server.js';

export async function getMyTasks(req, res) {
  try {
    const staffId = req.user._id || req.user.id;
    const { status } = req.query;

    if (isDbConnected()) {
      const query = { assignedTo: staffId };
      if (status && status !== 'all') query.status = status;

      const tasks = await Complaint.find(query)
        .populate('submittedBy', 'name email department phone studentId')
        .sort({ priority: -1, createdAt: -1 });

      return res.json({ success: true, count: tasks.length, tasks });
    } else {
      const filter = { assignedTo: staffId };
      if (status && status !== 'all') filter.status = status;

      const tasks = store.findComplaints(filter);
      return res.json({ success: true, count: tasks.length, tasks });
    }
  } catch (err) {
    console.error('Get my tasks error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve tasks.', error: err.message });
  }
}

export async function updateProgress(req, res) {
  try {
    const { id } = req.params;
    const { status, workLog, estimatedHours } = req.body;

    const timelineMsg = `Work Progress updated: ${workLog || 'Maintenance underway.'}`;
    let complaint = null;

    if (isDbConnected()) {
      complaint = await Complaint.findById(id);
      if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

      if (status) complaint.status = status;
      if (estimatedHours) complaint.estimatedHours = Number(estimatedHours);

      complaint.timeline.push({
        status: status || complaint.status,
        message: timelineMsg,
        updatedBy: req.user.name,
        timestamp: new Date(),
      });

      await complaint.save();
      complaint = await Complaint.findById(id)
        .populate('submittedBy', 'name email department phone studentId')
        .populate('assignedTo', 'name email department phone');
    } else {
      const updates = {
        timelineEntry: {
          status: status || 'In Progress',
          message: timelineMsg,
          updatedBy: req.user.name,
          timestamp: new Date(),
        },
      };
      if (status) updates.status = status;
      if (estimatedHours) updates.estimatedHours = Number(estimatedHours);

      complaint = store.updateComplaint(id, updates);
    }

    try {
      const io = getIO();
      if (io) io.emit('complaint:updated', complaint);
    } catch (e) {}

    return res.json({ success: true, message: 'Work progress updated successfully!', complaint });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update progress.', error: err.message });
  }
}

export async function resolveComplaint(req, res) {
  try {
    const { id } = req.params;
    const { resolutionNotes, resolutionProofImage } = req.body;

    if (!resolutionNotes) {
      return res.status(400).json({ success: false, message: 'Resolution notes / remarks are required.' });
    }

    let complaint = null;
    const timelineMsg = `Complaint resolved by ${req.user.name} (${req.user.department}). Remarks: "${resolutionNotes}"`;

    if (isDbConnected()) {
      complaint = await Complaint.findById(id);
      if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

      complaint.status = 'Resolved';
      complaint.resolvedAt = new Date();
      complaint.resolutionNotes = resolutionNotes;
      if (resolutionProofImage) complaint.resolutionProofImage = resolutionProofImage;

      complaint.timeline.push({
        status: 'Resolved',
        message: timelineMsg,
        updatedBy: req.user.name,
        timestamp: new Date(),
      });

      await complaint.save();
      complaint = await Complaint.findById(id)
        .populate('submittedBy', 'name email department phone studentId')
        .populate('assignedTo', 'name email department phone');

      // Notify Student
      if (complaint.submittedBy) {
        await Notification.create({
          recipient: complaint.submittedBy._id,
          targetRole: 'student',
          title: `Complaint #${complaint.complaintId} Resolved!`,
          message: `Your issue "${complaint.title}" has been resolved by maintenance staff. Please rate the service!`,
          type: 'complaint_resolved',
          complaintId: complaint._id,
        });
      }

      // Notify Admin
      await Notification.create({
        targetRole: 'admin',
        title: `Ticket Resolved: #${complaint.complaintId}`,
        message: `${complaint.title} marked resolved by ${req.user.name}.`,
        type: 'complaint_resolved',
        complaintId: complaint._id,
      });
    } else {
      complaint = store.updateComplaint(id, {
        status: 'Resolved',
        resolvedAt: new Date(),
        resolutionNotes,
        resolutionProofImage: resolutionProofImage || '',
        timelineEntry: {
          status: 'Resolved',
          message: timelineMsg,
          updatedBy: req.user.name,
          timestamp: new Date(),
        },
      });

      const subId = complaint.submittedBy?._id || complaint.submittedBy?.id;
      if (subId) {
        store.createNotification({
          recipient: subId,
          targetRole: 'student',
          title: `Complaint #${complaint.complaintId} Resolved!`,
          message: `Your issue "${complaint.title}" has been resolved by maintenance staff. Please rate the service!`,
          type: 'complaint_resolved',
          complaintId: complaint._id,
        });
      }

      store.createNotification({
        targetRole: 'admin',
        title: `Ticket Resolved: #${complaint.complaintId}`,
        message: `${complaint.title} marked resolved by ${req.user.name}.`,
        type: 'complaint_resolved',
        complaintId: complaint._id,
      });
    }

    try {
      const io = getIO();
      if (io) {
        io.emit('complaint:resolved', complaint);
        io.emit('complaint:updated', complaint);
        io.emit('notification:new', {
          title: 'Ticket Resolved',
          message: `Ticket #${complaint.complaintId} resolved by ${req.user.name}`,
        });
      }
    } catch (e) {}

    return res.json({
      success: true,
      message: 'Complaint successfully marked as resolved!',
      complaint,
    });
  } catch (err) {
    console.error('Resolve complaint error:', err);
    return res.status(500).json({ success: false, message: 'Failed to resolve complaint.', error: err.message });
  }
}
