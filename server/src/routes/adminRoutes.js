import express from 'express';
import {
  assignComplaint,
  updateStatusPriority,
  getAnalytics,
  getAllUsers,
  toggleUserStatus,
} from '../controllers/adminController.js';
import { protect, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('admin'));

router.post('/complaints/:id/assign', assignComplaint);
router.patch('/complaints/:id/status-priority', updateStatusPriority);
router.get('/analytics', getAnalytics);
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle-status', toggleUserStatus);

export default router;
