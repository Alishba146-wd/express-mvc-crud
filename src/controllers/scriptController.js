import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runScript = async (req, res) => {
  const { scriptName } = req.body;

  if (!scriptName) {
    return res.status(400).json({ error: 'Missing scriptName in request body' });
  }

  try {
    const scriptPath = path.resolve(__dirname, `../scripts/${scriptName}.mjs`);
    const scriptModule = await import(pathToFileURL(scriptPath)); // dynamic ES module import

    if (typeof scriptModule.default !== 'function') {
      return res.status(500).json({ error: 'Script does not export a default function' });
    }

    const output = await scriptModule.default(); // run the script's default exported function

    res.json({
      message: 'Script ran successfully',
      output: output || '✅ Script completed.'
    });

  } catch (error) {
    console.error('Script execution error:', error);
    res.status(500).json({ error: error.message });
  }
};
