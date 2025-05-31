import db from '../../src/db';
import {
  createDocument,
  getDocumentById,
  deleteDocument,
  MedicalDocumentRow,
} from '../../src/repositories/medicalDocumentRepository';

jest.mock('../../src/db', () => ({
  query: jest.fn(),
}));

const mockedDb = db as unknown as { query: jest.Mock };

describe('medicalDocumentRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDocument', () => {
    it('inserts and returns new document', async () => {
      const input = { playerId: 'p1', title: 't1', documentType: 'X-ray', filePath: 'path', fileSize: 123, mimeType: 'image/png', injuryId: 'i1', uploadedByUserId: 'u1', teamId: 't1' };
      const returned: MedicalDocumentRow = { id: 'd1', player_id: 'p1', title: 't1', document_type: 'X-ray', file_path: 'path', file_size: 123, mime_type: 'image/png', injury_id: 'i1', uploaded_by_user_id: 'u1', team_id: 't1', created_at: new Date(), updated_at: new Date() };
      mockedDb.query.mockResolvedValue({ rows: [returned] });

      const result = await createDocument(input);

      expect(mockedDb.query).toHaveBeenCalled();
      expect(result).toEqual(returned);
    });

    it('throws error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      const input = { playerId: 'p1', title: 't1', documentType: 'X-ray', filePath: 'path', fileSize: 123, mimeType: 'image/png', uploadedByUserId: 'u1', teamId: 't1' } as any;
      await expect(createDocument(input)).rejects.toThrow('Database error while creating medical document.');
    });
  });

  describe('getDocumentById', () => {
    it('returns document when found', async () => {
      const row: MedicalDocumentRow = { id: 'd1', player_id: 'p1', title: 't1', document_type: 'X-ray', file_path: 'path', file_size: 123, mime_type: 'image/png', injury_id: null, uploaded_by_user_id: 'u1', team_id: 't1', created_at: new Date(), updated_at: new Date() };
      mockedDb.query.mockResolvedValue({ rows: [row] });
      const result = await getDocumentById('d1');
      expect(mockedDb.query).toHaveBeenCalledWith(
        'SELECT * FROM medical_documents WHERE id = $1',
        ['d1']
      );
      expect(result).toEqual(row);
    });

    it('returns null when not found', async () => {
      mockedDb.query.mockResolvedValue({ rows: [] });
      const result = await getDocumentById('d1');
      expect(result).toBeNull();
    });

    it('throws error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      await expect(getDocumentById('d1')).rejects.toThrow('Database error while fetching medical document.');
    });
  });

  describe('deleteDocument', () => {
    it('returns true when rowCount > 0', async () => {
      mockedDb.query.mockResolvedValue({ rowCount: 1 });
      const result = await deleteDocument('d1');
      expect(mockedDb.query).toHaveBeenCalledWith(
        'DELETE FROM medical_documents WHERE id = $1',
        ['d1']
      );
      expect(result).toBe(true);
    });

    it('returns false when rowCount = 0', async () => {
      mockedDb.query.mockResolvedValue({ rowCount: 0 });
      const result = await deleteDocument('d1');
      expect(result).toBe(false);
    });

    it('throws error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      await expect(deleteDocument('d1')).rejects.toThrow('Database error while deleting medical document.');
    });
  });
}); 