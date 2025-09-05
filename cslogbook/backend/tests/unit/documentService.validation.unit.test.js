jest.mock('../../utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

// Mock upload config to define allowed document types/categories used in test
jest.mock('../../config/uploadConfig', () => ({
  UPLOAD_CONFIG: {
    DOCUMENT_TYPES: {
      INTERNSHIP: { categories: ['transcript','proposal','progress','final'] },
      PROJECT: { categories: ['proposal','progress','final'] },
    }
  }
}));

describe('documentService validation', () => {
  let documentService;
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../models', () => ({ Document: { create: jest.fn(async (data) => ({ id: 99, ...data })) } }));
    documentService = undefined;
    jest.isolateModules(() => {
      documentService = require('../../services/documentService');
    });
  });

  const file = { path: 'p', filename: 'f.pdf', mimetype: 'application/pdf', size: 10 };

  test('invalid document type throws', async () => {
    await expect(documentService.uploadDocument(1, file, { documentType: 'UNKNOWN', category: 'x' }))
      .rejects.toThrow('ประเภทเอกสารไม่ถูกต้อง');
  });

  test('happy path minimal fields', async () => {
    const out = await documentService.uploadDocument(1, file, { documentType: 'INTERNSHIP', category: 'transcript' });
    expect(out.documentId).toBe(99);
    expect(out.isLate).toBe(false);
  });
});
