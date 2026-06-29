import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import customersRouter from './routes/customers.js';
import productsRouter from './routes/products.js';
import documentsRouter from './routes/documents.js';
import reportsRouter from './routes/reports.js';
import backupRouter from './routes/backup.js';
import settingsRouter from './routes/settings.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const port = process.env.PORT || 10000;

app.use(cors({
  origin: process.env.FRONTEND_URL?.split(',') || ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'tong-service-it-billing-api' });
});

app.use('/api/customers', customersRouter);
app.use('/api/products', productsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/backup', backupRouter);
app.use('/api/settings', settingsRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Billing API running on port ${port}`);
});
