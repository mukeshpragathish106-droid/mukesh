import express from 'express';
import { register, login, getMe, demoLogin, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/demo-login', demoLogin);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);

export default router;
