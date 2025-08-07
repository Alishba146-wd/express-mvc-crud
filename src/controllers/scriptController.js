import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runScript = async (req, res) => {
  try {
    const scriptPath = pathToFileURL(path.join(__dirname, '../scripts/myFirstScript.mjs'));
    const { default: runFormTests } = await import(scriptPath.href);

    const results = await runFormTests();
    res.json({ message: 'Tests completed', results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
