import { Router } from 'express';
import { listTable } from '../controllers/baseController.js';
import { getSettings } from '../controllers/settingsController.js';
import { createDocument, generateNumber, listDocuments } from '../controllers/documentController.js';

export const apiRouter = Router();
apiRouter.get('/health', (req, res) => res.json({ status: 'ok' }));
apiRouter.get('/settings', getSettings);
apiRouter.get('/customers', listTable('customers'));
apiRouter.get('/products', listTable('products'));
apiRouter.get('/documents', listDocuments);
apiRouter.get('/documents/next-number', generateNumber);
apiRouter.post('/documents', createDocument);
