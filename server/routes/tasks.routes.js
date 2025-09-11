import { Router } from 'express';
import TasksController from '../controllers/TasksController.js';

const router = Router();
const controller = new TasksController();

// Bulk delete FIRST
router.post('/bulk-delete', controller.bulkDelete);
router.delete('/bulk-delete', controller.bulkDelete);
router.patch('/bulk-delete', controller.bulkDelete);

// Collection
router.get('/', controller.list);
router.post('/', controller.create);

// Item (numeric ids only)
router.get('/:id(\\d+)', controller.get);
router.put('/:id(\\d+)', controller.update);
router.patch('/:id(\\d+)', controller.patch);
router.delete('/:id(\\d+)', controller.remove);

export default router;