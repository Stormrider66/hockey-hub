import { Router } from 'express';
import {
    getExercises,
    getExerciseById,
    createExerciseHandler,
    updateExerciseHandler,
    deleteExerciseHandler
} from '../controllers/exerciseController';

// TODO: Add auth middleware

const router = Router();

router.get('/', getExercises);
router.post('/', createExerciseHandler);
router.get('/:id', getExerciseById);
router.put('/:id', updateExerciseHandler);
router.delete('/:id', deleteExerciseHandler);

// TODO: Add route for getting exercise categories?
// router.get('/categories', ...);

export default router; 