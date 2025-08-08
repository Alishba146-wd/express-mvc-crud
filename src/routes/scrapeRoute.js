import express from 'express';
import { scrapeFromUrl } from '../controllers/scrapeController.js';

const router = express.Router();

router.post('/scrape', scrapeFromUrl);

export default router;
