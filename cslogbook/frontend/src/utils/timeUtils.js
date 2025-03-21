import dayjs from 'dayjs';

export const calculateWorkHours = (timeIn, timeOut) => {
  if (!timeIn || !timeOut) return 0;
  const startTime = dayjs(timeIn, "HH:mm");
  const endTime = dayjs(timeOut, "HH:mm");
  const hours = endTime.diff(startTime, "hour", true);
  return Math.round(hours * 2) / 2;
};

export const getEntryStatus = (entry) => {
  if (!entry.workDescription) return "pending";
  if (!entry.workHours) return "incomplete";
  if (!entry.supervisorApproved || !entry.advisorApproved) return "submitted";
  return "approved";
};