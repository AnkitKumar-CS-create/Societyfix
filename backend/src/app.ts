import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import complaintRoutes from './routes/complaint.routes';
import noticeRoutes from './routes/notice.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/admin', adminRoutes);

export default app;