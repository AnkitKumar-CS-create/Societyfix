import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import complaintRoutes from './routes/complaint.routes';
import noticeRoutes from './routes/notice.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();

app.use(helmet()); 
app.use(cors()); 
app.use(express.json()); 

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send({ message: 'SocietyFix API is running!' });
});

export default app;