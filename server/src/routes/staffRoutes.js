import express from 'express';
import {
  getMyTasks,
  updateProgress,
  resolveComplaint,
} from '../controllers/staffController.js';
import { protect, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('staff', 'admin'));

router.get('/tasks', getMyTasks);
router.patch('/complaints/:id/progress', updateProgress);
router.post('/complaints/:id/resolve', resolveComplaint);

export default router;
