const mockCronSchedule = jest.fn();
const mockCronJobStart = jest.fn();
const mockCronJobStop = jest.fn();

jest.mock('node-cron', () => ({
  schedule: (...args) => {
    mockCronSchedule(...args);
    return {
      start: mockCronJobStart,
      stop: mockCronJobStop
    };
  }
}));

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

jest.mock('../../models', () => ({
  Academic: {
    findOne: jest.fn()
  }
}));

const logger = require('../../utils/logger');
const { Academic } = require('../../models');
const dayjs = require('dayjs');

const academicSemesterScheduler = require('../../agents/schedulers/academicSemesterScheduler');

describe('academicSemesterScheduler', () => {
  const originalEnv = process.env.ACADEMIC_AUTO_UPDATE_ENABLED;
  const originalCronEnv = process.env.ACADEMIC_AUTO_UPDATE_CRON;

  afterEach(() => {
    jest.clearAllMocks();
    process.env.ACADEMIC_AUTO_UPDATE_ENABLED = originalEnv;
    process.env.ACADEMIC_AUTO_UPDATE_CRON = originalCronEnv;
    academicSemesterScheduler.stop();
  });

  describe('updateCurrentSemester', () => {
    it('logs warning when no current academic settings found', async () => {
      Academic.findOne.mockResolvedValue(null);

      await academicSemesterScheduler.updateCurrentSemester();

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('ไม่พบข้อมูล'));
    });

    it('updates semester when current date is in second semester range', async () => {
      const updateMock = jest.fn();
      const getMock = jest.fn(() => ({
        currentSemester: 1,
        academicYear: 2568,
        isCurrent: true,
        semester1Range: {},
        semester2Range: {},
        semester3Range: null
      }));

      Academic.findOne.mockResolvedValue({
        get: getMock,
        update: updateMock
      });

      const normalizeSpy = jest
        .spyOn(academicSemesterScheduler, 'normalizeRange')
        .mockImplementation((raw) => (raw ? { start: dayjs(), end: dayjs() } : null));

      const rangeRef = { start: dayjs(), end: dayjs() };
      const determineSpy = jest
        .spyOn(academicSemesterScheduler, 'determineActiveSemester')
        .mockReturnValue({ semester: 2, range: rangeRef });

      await academicSemesterScheduler.updateCurrentSemester();

      expect(updateMock).toHaveBeenCalledWith({ currentSemester: 2 });

      normalizeSpy.mockRestore();
      determineSpy.mockRestore();
    });

    it('updates semester, year, and current flag when entering first semester', async () => {
      const updateMock = jest.fn();
      const getMock = jest.fn(() => ({
        currentSemester: 3,
        academicYear: 2568,
        isCurrent: false,
        semester1Range: {},
        semester2Range: {},
        semester3Range: null
      }));

      Academic.findOne.mockResolvedValue({
        get: getMock,
        update: updateMock
      });

      const startRange = dayjs('2026-06-15');
      const endRange = dayjs('2026-10-15');

      const normalizeSpy = jest
        .spyOn(academicSemesterScheduler, 'normalizeRange')
        .mockImplementation((raw) => (raw ? { start: startRange, end: endRange, raw } : null));

      const determineSpy = jest
        .spyOn(academicSemesterScheduler, 'determineActiveSemester')
        .mockReturnValue({ semester: 1, range: { start: startRange, end: endRange } });

      await academicSemesterScheduler.updateCurrentSemester();

      expect(updateMock).toHaveBeenCalledWith({
        currentSemester: 1,
        academicYear: 2569,
        isCurrent: true
      });

      normalizeSpy.mockRestore();
      determineSpy.mockRestore();
    });
  });

  describe('scheduler controls', () => {
    it('does not start when feature flag is disabled', () => {
      process.env.ACADEMIC_AUTO_UPDATE_ENABLED = 'false';

      const result = academicSemesterScheduler.start();

      expect(result).toBe(false);
      expect(mockCronSchedule).not.toHaveBeenCalled();
      expect(academicSemesterScheduler.isRunning).toBe(false);
    });

    it('starts cron job and triggers immediate update when enabled', async () => {
      process.env.ACADEMIC_AUTO_UPDATE_ENABLED = 'true';

      const updateSpy = jest
        .spyOn(academicSemesterScheduler, 'updateCurrentSemester')
        .mockResolvedValue();

      const result = academicSemesterScheduler.start();

      expect(result).toBe(true);
      expect(mockCronSchedule).toHaveBeenCalled();
      expect(mockCronJobStart).toHaveBeenCalled();
      expect(academicSemesterScheduler.isRunning).toBe(true);
      expect(updateSpy).toHaveBeenCalled();

      updateSpy.mockRestore();
    });

    it('stops cron job when stop is called', () => {
      process.env.ACADEMIC_AUTO_UPDATE_ENABLED = 'true';

      const updateSpy = jest
        .spyOn(academicSemesterScheduler, 'updateCurrentSemester')
        .mockResolvedValue();

      academicSemesterScheduler.start();
      academicSemesterScheduler.stop();

      expect(mockCronJobStop).toHaveBeenCalled();
      expect(academicSemesterScheduler.isRunning).toBe(false);

      updateSpy.mockRestore();
    });
  });
});