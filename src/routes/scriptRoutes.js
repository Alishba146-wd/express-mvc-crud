import express from 'express';
import { runScript } from '../controllers/scriptController.js';

const router = express.Router();

router.post('/run', runScript);

export default router;
