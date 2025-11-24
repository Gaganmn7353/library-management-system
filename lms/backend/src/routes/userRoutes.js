import express from 'express';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { userController } from '../controllers/userController.js';

const router = express.Router();

router.use(authenticate);
router.use(isAdmin);

router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.patch('/:id/status', userController.updateStatus);
router.delete('/:id', userController.deleteUser);

export default router;

