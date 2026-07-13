import express from 'express';
import { showLogin } from '../controllers/pagesController';

const router = express.Router();

router.get('/', showLogin);

export default router;
