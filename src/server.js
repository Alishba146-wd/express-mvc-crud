import app from './app.js';
import { connectDB } from './config/db.js';

const port = 3000;

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
});
