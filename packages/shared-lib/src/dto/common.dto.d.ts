export declare class PaginationDto {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc' | 'ASC' | 'DESC';
}
export declare class SearchDto extends PaginationDto {
    q?: string;
    filters?: string[];
    startDate?: string;
    endDate?: string;
}
export declare class IdParamDto {
    id: string;
}
export declare class IdsDto {
    ids: string[];
}
export declare class BulkOperationDto {
    ids: string[];
    operation: string;
}
export declare class DateRangeDto {
    startDate: string;
    endDate: string;
    groupBy?: string;
}
export declare class FileUploadDto {
    filename: string;
    mimetype: string;
    size: number;
    description?: string;
}
export declare class NotificationDto {
    title: string;
    message: string;
    type?: string;
    recipientIds?: string[];
    actionUrl?: string;
    actionLabel?: string;
}
//# sourceMappingURL=common.dto.d.ts.map