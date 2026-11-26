import { suggestCategory, suggestPriority, checkDuplicates, analyzeHotspots } from '../services/aiService.js';
import { store, isDbConnected } from '../config/db.js';
import Complaint from '../models/Complaint.js';

export async function getSuggestions(req, res) {
  try {
    const { title = '', description = '' } = req.body;

    const categorySuggestion = suggestCategory(title, description);
    const prioritySuggestion = suggestPriority(title, description, categorySuggestion.category);

    return res.json({
      success: true,
      suggestions: {
        category: categorySuggestion.category,
        categoryConfidence: categorySuggestion.confidence,
        categoryReason: categorySuggestion.reason,
        priority: prioritySuggestion.priority,
        priorityConfidence: prioritySuggestion.confidence,
        priorityReason: prioritySuggestion.reason,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Suggestion error', error: err.message });
  }
}

export async function checkDuplicateTicket(req, res) {
  try {
    const { title = '', description = '', category = '', location = {} } = req.body;

    let existing = [];
    if (isDbConnected()) {
      existing = await Complaint.find({ status: { $in: ['Pending', 'Assigned', 'In Progress'] } }).lean();
    } else {
      existing = store.findComplaints();
    }

    const result = checkDuplicates({ title, description, category, location }, existing);

    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Duplicate check error', error: err.message });
  }
}

export async function getHotspotAnalysis(req, res) {
  try {
    let complaints = [];
    if (isDbConnected()) {
      complaints = await Complaint.find().lean();
    } else {
      complaints = store.findComplaints();
    }

    const hotspotReport = analyzeHotspots(complaints);
    return res.json({ success: true, report: hotspotReport });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Hotspot analysis error', error: err.message });
  }
}
