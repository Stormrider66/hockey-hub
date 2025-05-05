// @ts-nocheck
import { Router } from 'express';
import {
    getCategories,
    getCategoryById,
    createCategoryHandler,
    updateCategoryHandler,
    deleteCategoryHandler
} from '../controllers/physicalCategoryController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();
router.use(requireAuth);

// Assuming routes like /api/v1/physical-categories
router.get('/', getCategories);
router.post('/', createCategoryHandler);
router.get('/:id', getCategoryById);
router.put('/:id', updateCategoryHandler);
router.delete('/:id', deleteCategoryHandler);

export default router; 