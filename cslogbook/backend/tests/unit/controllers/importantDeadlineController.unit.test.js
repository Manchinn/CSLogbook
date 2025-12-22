jest.mock('../../../services/importantDeadlineService', () => ({
  getAll: jest.fn(),
}));

jest.mock('../../../models', () => ({
  Document: {
    findAll: jest.fn(),
  },
}));

const importantDeadlineService = require('../../../services/importantDeadlineService');
const { Document } = require('../../../models');
const { getAll, getAllForStudent } = require('../../../controllers/importantDeadlineController');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createDeadlineRecord = (data) => ({
  ...data,
  toJSON() {
    const { toJSON, ...rest } = this;
    return { ...rest };
  },
});

describe('importantDeadlineController.getAll', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-15T09:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns published deadlines enriched with local date/time', async () => {
    importantDeadlineService.getAll.mockResolvedValue([
      createDeadlineRecord({
        id: 1,
        name: 'Deadline A',
        isPublished: true,
        deadlineAt: '2025-02-01T00:00:00Z',
      }),
      createDeadlineRecord({
        id: 2,
        name: 'Hidden deadline',
        isPublished: false,
        publishAt: '2025-02-01T00:00:00Z',
        deadlineAt: '2025-03-01T00:00:00Z',
      }),
    ]);

    const req = { query: {} };
    const res = createMockRes();

    await getAll(req, res);

    expect(importantDeadlineService.getAll).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: [
          expect.objectContaining({
            id: 1,
            deadlineDate: '2025-02-01',
            deadlineTime: '07:00:00', // Asia/Bangkok (+7h)
          }),
        ],
      }),
    );
  });
});

describe('importantDeadlineController.getAllForStudent', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('maps submissions for deadlines when documents exist', async () => {
    importantDeadlineService.getAll.mockResolvedValue([
      createDeadlineRecord({
        id: 10,
        name: 'Internship log',
        isPublished: true,
        relatedTo: 'internship',
        deadlineAt: '2025-02-10T00:00:00Z',
      }),
    ]);

    Document.findAll.mockResolvedValue([
      {
        importantDeadlineId: 10,
        status: 'submitted',
        submittedAt: '2025-02-05T04:00:00Z',
        created_at: '2025-02-05T04:00:00Z',
        isLate: false,
      },
    ]);

    const req = { query: {}, user: { userId: 501 } };
    const res = createMockRes();

    await getAllForStudent(req, res);

    expect(Document.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 501,
        }),
      }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: [
          expect.objectContaining({
            id: 10,
            hasSubmission: true,
            submission: expect.objectContaining({
              status: 'submitted',
              submitted: true,
            }),
          }),
        ],
      }),
    );
  });

  it('skips document lookup when user is missing', async () => {
    importantDeadlineService.getAll.mockResolvedValue([
      createDeadlineRecord({ id: 15, isPublished: true, deadlineAt: '2025-03-01T00:00:00Z' }),
    ]);

    const req = { query: {}, user: null };
    const res = createMockRes();

    await getAllForStudent(req, res);

    expect(Document.findAll).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.any(Array),
      }),
    );
  });
});


