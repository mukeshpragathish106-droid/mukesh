import express from 'express';
import { getSuggestions, checkDuplicateTicket, getHotspotAnalysis } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/suggest', getSuggestions);
router.post('/check-duplicates', checkDuplicateTicket);
router.get('/hotspots', getHotspotAnalysis);

export default router;
