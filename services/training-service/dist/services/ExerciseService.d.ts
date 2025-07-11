import { ExerciseTemplate, ExerciseCategory } from '../entities';
import { CreateExerciseTemplateDto, UpdateExerciseTemplateDto, ExerciseFilterDto } from '../dto/exercise.dto';
export declare class ExerciseService {
    private readonly logger;
    private readonly exerciseRepository;
    constructor();
    create(dto: CreateExerciseTemplateDto, userId: string, organizationId?: string): Promise<ExerciseTemplate>;
    findAll(filter: ExerciseFilterDto & {
        organizationId?: string;
    }): Promise<{
        data: ExerciseTemplate[];
        total: number;
    }>;
    findById(id: string): Promise<ExerciseTemplate>;
    update(id: string, dto: UpdateExerciseTemplateDto, userId: string): Promise<ExerciseTemplate>;
    delete(id: string, userId: string): Promise<void>;
    searchByName(query: string, organizationId?: string): Promise<ExerciseTemplate[]>;
    findByCategory(category: ExerciseCategory, organizationId?: string): Promise<ExerciseTemplate[]>;
}
//# sourceMappingURL=ExerciseService.d.ts.map