/**
 * Topic Exam Export Tests
 *
 * ทดสอบ:
 *   E1 - examResultFilter 'pending' → WHERE examResult IS NULL
 *   E2 - examResultFilter 'with-results' → WHERE examResult IS NOT NULL
 *   E3 - ไม่ส่ง examResultFilter → ไม่มี examResult WHERE clause
 *   E4 - sortBy 'titleTh' → ORDER BY projectNameTh
 *   E5 - search sanitization — wildcards ถูก escape, ความยาว cap ที่ 100
 */

// ─── Mock logger ─────────────────────────────────────────────────────────────
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// ─── Mock models ─────────────────────────────────────────────────────────────
const mockFindAll = jest.fn().mockResolvedValue([]);
const mockFindAndCountAll = jest.fn().mockResolvedValue({ rows: [], count: 0 });

jest.mock('../models', () => {
  const actualSequelize = require('sequelize');
  return {
    ProjectDocument: {
      findAll: mockFindAll,
      findAndCountAll: mockFindAndCountAll,
      rawAttributes: {},
    },
    ProjectMember: {},
    Student: {},
    Teacher: {},
    User: {},
    sequelize: {
      col: actualSequelize.col,
      literal: actualSequelize.literal,
    },
    Sequelize: actualSequelize.Sequelize,
  };
});

// ─── Mock database/sequelize ─────────────────────────────────────────────────
jest.mock('../config/database', () => {
  const actualSequelize = require('sequelize');
  return {
    sequelize: {
      col: actualSequelize.col,
      literal: actualSequelize.literal,
      fn: actualSequelize.fn,
    },
  };
});

const { Op } = require('sequelize');
const { getTopicOverview, EXAM_RESULT_FILTER } = require('../services/topicExamService');

beforeEach(() => {
  jest.clearAllMocks();
  mockFindAll.mockResolvedValue([]);
  mockFindAndCountAll.mockResolvedValue({ rows: [], count: 0 });
});

// helper: จับ where ของ main query (call แรก — ก่อน meta queries)
const getMainWhere = () => mockFindAll.mock.calls[0][0].where;
const getMainOrder = () => mockFindAll.mock.calls[0][0].order;

// ─────────────────────────────────────────────────────────────────────────────

describe('E1-E3: examResultFilter → WHERE clause', () => {
  test('E1: pending → examResult IS NULL', async () => {
    await getTopicOverview({ examResultFilter: EXAM_RESULT_FILTER.PENDING });
    expect(getMainWhere().examResult).toBeNull();
  });

  test('E2: with-results → examResult IS NOT NULL', async () => {
    await getTopicOverview({ examResultFilter: EXAM_RESULT_FILTER.WITH_RESULTS });
    expect(getMainWhere().examResult).toEqual({ [Op.ne]: null });
  });

  test('E3: ไม่ส่ง examResultFilter → ไม่มี examResult ใน where', async () => {
    await getTopicOverview({});
    expect(getMainWhere().examResult).toBeUndefined();
  });

  test('E3b: examResultFilter ที่ไม่รู้จัก → ไม่มี examResult ใน where', async () => {
    await getTopicOverview({ examResultFilter: 'unknown-value' });
    expect(getMainWhere().examResult).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('E4: sortBy titleTh → ORDER BY projectNameTh', () => {
  test('E4a: sortBy titleTh asc → [projectNameTh, ASC]', async () => {
    await getTopicOverview({ sortBy: 'titleTh', order: 'asc' });
    expect(getMainOrder()).toContainEqual(['projectNameTh', 'ASC']);
  });

  test('E4b: sortBy titleTh desc → [projectNameTh, DESC]', async () => {
    await getTopicOverview({ sortBy: 'titleTh', order: 'desc' });
    expect(getMainOrder()).toContainEqual(['projectNameTh', 'DESC']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('E5: search sanitization', () => {
  const getSearchPattern = () => {
    const w = getMainWhere();
    // Op.or มี [Op.like] อยู่ใน array elements
    const orClauses = w[Op.or];
    if (!orClauses) return null;
    return orClauses[0]?.projectNameTh?.[Op.like] ?? null;
  };

  test('E5a: % ใน search ถูก escape → \\%', async () => {
    await getTopicOverview({ search: '100%' });
    const pattern = getSearchPattern();
    expect(pattern).toBe('%100\\%%');
  });

  test('E5b: _ ใน search ถูก escape → \\_', async () => {
    await getTopicOverview({ search: 'topic_1' });
    const pattern = getSearchPattern();
    expect(pattern).toBe('%topic\\_1%');
  });

  test('E5c: search ยาวเกิน 100 chars ถูก truncate', async () => {
    const long = 'a'.repeat(200);
    await getTopicOverview({ search: long });
    const pattern = getSearchPattern();
    // pattern คือ %<100 chars>% = 102 chars
    expect(pattern).toHaveLength(102);
  });

  test('E5d: search ปกติไม่มี wildcards — ผ่านตรงๆ', async () => {
    await getTopicOverview({ search: 'โครงงาน' });
    const pattern = getSearchPattern();
    expect(pattern).toBe('%โครงงาน%');
  });
});
