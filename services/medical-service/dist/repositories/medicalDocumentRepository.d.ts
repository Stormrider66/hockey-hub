export interface MedicalDocumentRow {
    id: string;
    player_id: string;
    title: string;
    document_type: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    injury_id: string | null;
    uploaded_by_user_id: string;
    team_id: string;
    created_at: Date;
    updated_at: Date;
}
export declare const createDocument: (doc: {
    playerId: string;
    title: string;
    documentType: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    injuryId?: string;
    uploadedByUserId: string;
    teamId: string;
}) => Promise<MedicalDocumentRow>;
export declare const getDocumentById: (id: string) => Promise<MedicalDocumentRow | null>;
export declare const deleteDocument: (id: string) => Promise<boolean>;
//# sourceMappingURL=medicalDocumentRepository.d.ts.map