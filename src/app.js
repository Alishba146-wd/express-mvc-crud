import express from 'express';
import userRoutes from './routes/userRoutes.js';
import scriptRoutes from './routes/scriptRoutes.js';
import scrapeRoutes from './routes/scrapeRoute.js';


const app = express();

app.use(express.json());
app.use('/api/user', userRoutes);
app.use('/scripts', scriptRoutes);
app.use('/api', scrapeRoutes);

export default app;
