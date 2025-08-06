const app = require('./app');
const { connectDB } = require('./config/db');

const port = 3000;

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
});
