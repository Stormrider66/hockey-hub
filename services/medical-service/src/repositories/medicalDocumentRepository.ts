import db from '../db';
import { QueryResult } from 'pg';

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

export const createDocument = async (
  doc: {
    playerId: string;
    title: string;
    documentType: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    injuryId?: string;
    uploadedByUserId: string;
    teamId: string;
  }
): Promise<MedicalDocumentRow> => {
  const {
    playerId,
    title,
    documentType,
    filePath,
    fileSize,
    mimeType,
    injuryId,
    uploadedByUserId,
    teamId,
  } = doc;
  const query = `
    INSERT INTO medical_documents (
      player_id, title, document_type,
      file_path, file_size, mime_type,
      injury_id, uploaded_by_user_id, team_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *;
  `;
  const params = [
    playerId,
    title,
    documentType,
    filePath,
    fileSize,
    mimeType,
    injuryId || null,
    uploadedByUserId,
    teamId,
  ];
  try {
    const result: QueryResult<MedicalDocumentRow> = await db.query(query, params);
    return result.rows[0];
  } catch (error) {
    console.error('[DB Error] Failed to create medical document', error);
    throw new Error('Database error while creating medical document.');
  }
};

export const getDocumentById = async (
  id: string
): Promise<MedicalDocumentRow | null> => {
  try {
    const result: QueryResult<MedicalDocumentRow> = await db.query(
      'SELECT * FROM medical_documents WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('[DB Error] Failed to fetch medical document', id, error);
    throw new Error('Database error while fetching medical document.');
  }
};

export const deleteDocument = async (
  id: string
): Promise<boolean> => {
  try {
    const result = await db.query(
      'DELETE FROM medical_documents WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('[DB Error] Failed to delete medical document', id, error);
    throw new Error('Database error while deleting medical document.');
  }
}; 