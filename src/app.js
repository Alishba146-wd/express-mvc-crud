import express from 'express';
import userRoutes from './routes/userRoutes.js';
import scriptRoutes from './routes/scriptRoutes.js';


const app = express();

app.use(express.json());
app.use('/api/user', userRoutes);
app.use('/scripts', scriptRoutes);

export default app;
