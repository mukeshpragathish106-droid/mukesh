import { store, isDbConnected } from '../config/db.js';
import Complaint from '../models/Complaint.js';
import Notification from '../models/Notification.js';
import { suggestCategory, suggestPriority, checkDuplicates } from '../services/aiService.js';
import { getIO } from '../server.js';

export async function createComplaint(req, res) {
  try {
    const {
      title,
      description,
      category,
      location,
      priority,
      images = [],
      forceSubmit = false,
    } = req.body;

    if (!title || !description || !location?.building || !location?.room) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, building, and room number are required.',
      });
    }

    // AI suggestions if omitted or to enhance
    const finalCategory = category || suggestCategory(title, description).category;
    const finalPriority = priority || suggestPriority(title, description, finalCategory).priority;

    // Check existing complaints for duplicates
    let existingList = [];
    if (isDbConnected()) {
      existingList = await Complaint.find({ status: { $in: ['Pending', 'Assigned', 'In Progress'] } }).lean();
    } else {
      existingList = store.findComplaints();
    }

    const dupCheck = checkDuplicates(
      { title, description, category: finalCategory, location },
      existingList
    );

    // If duplicate found and user hasn't confirmed forceSubmit, prompt student
    if (dupCheck.isDuplicate && !forceSubmit) {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        message: dupCheck.warningMessage,
        matches: dupCheck.matches,
      });
    }

    const studentInfo = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      department: req.user.department,
      phone: req.user.phone,
    };

    let newComplaint = null;

    if (isDbConnected()) {
      const count = (await Complaint.countDocuments()) + 1001;
      const complaintId = `CMP-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

      newComplaint = await Complaint.create({
        complaintId,
        title,
        description,
        category: finalCategory,
        location,
        priority: finalPriority,
        images,
        submittedBy: req.user._id,
        timeline: [
          {
            status: 'Pending',
            message: `Complaint submitted by student ${req.user.name}.`,
            updatedBy: req.user.name,
            timestamp: new Date(),
          },
        ],
      });

      // Populate submittedBy
      newComplaint = await Complaint.findById(newComplaint._id).populate('submittedBy', 'name email department phone');

      // Create notification for Admin & Staff
      await Notification.create({
        targetRole: 'admin',
        title: `New ${finalPriority} Priority Complaint`,
        message: `${newComplaint.complaintId}: ${title} reported in ${location.building} - ${location.room}.`,
        type: 'complaint_created',
        complaintId: newComplaint._id,
      });
    } else {
      newComplaint = store.createComplaint({
        title,
        description,
        category: finalCategory,
        location,
        priority: finalPriority,
        images,
        submittedBy: studentInfo,
      });

      store.createNotification({
        targetRole: 'admin',
        title: `New ${finalPriority} Priority Complaint`,
        message: `${newComplaint.complaintId}: ${title} reported in ${location.building} - ${location.room}.`,
        type: 'complaint_created',
        complaintId: newComplaint._id,
      });
    }

    // Broadcast real-time Socket.IO event
    try {
      const io = getIO();
      if (io) {
        io.emit('complaint:created', newComplaint);
        io.emit('notification:new', {
          targetRole: 'admin',
          title: `New ${finalPriority} Priority Complaint`,
          message: `${newComplaint.complaintId} logged in ${location.building}`,
          complaintId: newComplaint._id,
        });
      }
    } catch (e) {
      console.warn('Socket emit error:', e.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Complaint successfully registered!',
      complaint: newComplaint,
    });
  } catch (err) {
    console.error('Create complaint error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create complaint.', error: err.message });
  }
}

export async function getComplaints(req, res) {
  try {
    const { status, category, priority, building, search, myComplaints } = req.query;

    if (isDbConnected()) {
      const query = {};
      if (status && status !== 'all') query.status = status;
      if (category && category !== 'all') query.category = category;
      if (priority && priority !== 'all') query.priority = priority;
      if (building && building !== 'all') query['location.building'] = building;
      if (myComplaints === 'true' && req.user.role === 'student') query.submittedBy = req.user._id;

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { complaintId: { $regex: search, $options: 'i' } },
          { 'location.room': { $regex: search, $options: 'i' } },
        ];
      }

      const list = await Complaint.find(query)
        .populate('submittedBy', 'name email department phone studentId')
        .populate('assignedTo', 'name email department phone')
        .sort({ createdAt: -1 });

      return res.json({ success: true, count: list.length, complaints: list });
    } else {
      const filter = { status, category, priority, building, search };
      if (myComplaints === 'true' && req.user.role === 'student') {
        filter.submittedBy = req.user._id || req.user.id;
      }

      const list = store.findComplaints(filter);
      return res.json({ success: true, count: list.length, complaints: list });
    }
  } catch (err) {
    console.error('Get complaints error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch complaints.', error: err.message });
  }
}

export async function getComplaintById(req, res) {
  try {
    const { id } = req.params;
    let complaint = null;

    if (isDbConnected()) {
      complaint = await Complaint.findById(id)
        .populate('submittedBy', 'name email department phone studentId')
        .populate('assignedTo', 'name email department phone');
    } else {
      complaint = store.findComplaintById(id);
    }

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    return res.json({ success: true, complaint });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving complaint.', error: err.message });
  }
}

export async function upvoteComplaint(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    let complaint = null;

    if (isDbConnected()) {
      complaint = await Complaint.findById(id);
      if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

      const index = complaint.upvotes.indexOf(userId);
      if (index > -1) {
        complaint.upvotes.splice(index, 1);
      } else {
        complaint.upvotes.push(userId);
      }
      await complaint.save();
      complaint = await Complaint.findById(id)
        .populate('submittedBy', 'name email department phone studentId')
        .populate('assignedTo', 'name email department phone');
    } else {
      complaint = store.findComplaintById(id);
      if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

      if (!complaint.upvotes) complaint.upvotes = [];
      const index = complaint.upvotes.indexOf(userId);
      if (index > -1) {
        complaint.upvotes.splice(index, 1);
      } else {
        complaint.upvotes.push(userId);
      }
    }

    try {
      const io = getIO();
      if (io) io.emit('complaint:updated', complaint);
    } catch (e) {}

    return res.json({
      success: true,
      message: 'Upvote updated.',
      upvotesCount: complaint.upvotes.length,
      complaint,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error toggling upvote.', error: err.message });
  }
}

export async function submitFeedback(req, res) {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Valid rating between 1 and 5 is required.' });
    }

    let complaint = null;
    const feedbackObj = {
      rating: Number(rating),
      comment: comment || '',
      submittedAt: new Date(),
    };

    if (isDbConnected()) {
      complaint = await Complaint.findById(id);
      if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

      complaint.feedback = feedbackObj;
      complaint.timeline.push({
        status: complaint.status,
        message: `Student left ${rating}-star feedback: "${comment || 'No comment'}"`,
        updatedBy: req.user.name,
        timestamp: new Date(),
      });
      await complaint.save();
    } else {
      complaint = store.updateComplaint(id, {
        feedback: feedbackObj,
        timelineEntry: {
          status: 'Resolved',
          message: `Student left ${rating}-star feedback: "${comment || 'No comment'}"`,
          updatedBy: req.user.name,
          timestamp: new Date(),
        },
      });
    }

    try {
      const io = getIO();
      if (io) io.emit('complaint:updated', complaint);
    } catch (e) {}

    return res.json({ success: true, message: 'Thank you for your feedback!', complaint });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Feedback submission failed.', error: err.message });
  }
}
