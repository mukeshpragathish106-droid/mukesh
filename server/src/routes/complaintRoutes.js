import express from 'express';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  upvoteComplaint,
  submitFeedback,
} from '../controllers/complaintController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createComplaint);
router.get('/', getComplaints);
router.get('/:id', getComplaintById);
router.post('/:id/upvote', upvoteComplaint);
router.post('/:id/feedback', submitFeedback);

export default router;
