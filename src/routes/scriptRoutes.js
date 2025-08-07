import express from 'express';
import { exec } from 'child_process';
import path from 'path';

const router = express.Router();

router.post('/run', (req, res) => {
  const { scriptName } = req.body;

  if (!scriptName) {
    return res.status(400).json({ error: 'Missing scriptName in request body' });
  }

  const scriptPath = path.resolve(`scripts/${scriptName}.mjs`);

  exec(`node ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error('Script error:', stderr);
      return res.status(500).json({ error: stderr });
    }
    res.json({ message: 'Script ran successfully', output: stdout });
  });
});

export default router;
