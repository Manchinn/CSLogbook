import { useMemo } from 'react';
import dayjs from '../utils/dayjs';
import useAllDeadlines from './useAllDeadlines';

const PROJECT_PREFIXES = ['project', 'project1', 'project2'];

const sortByDueDate = (a, b) => {
  const aDue = a.effective_deadline_local || a.deadline_at_local || null;
  const bDue = b.effective_deadline_local || b.deadline_at_local || null;
  if (!aDue && !bDue) return 0;
  if (!aDue) return 1;
  if (!bDue) return -1;
  return aDue.valueOf() - bDue.valueOf();
};

const isProjectRelated = (relatedTo = '') => {
  const rel = String(relatedTo).toLowerCase();
  return PROJECT_PREFIXES.some((prefix) => rel.startsWith(prefix));
};

export default function useProjectDeadlines({ academicYear, audience = 'student' } = {}) {
  const { deadlines, loading, error, reload } = useAllDeadlines({ academicYear, audience });

  const { projectDeadlines, upcoming } = useMemo(() => {
    const now = dayjs();
    const list = Array.isArray(deadlines)
      ? deadlines.filter((item) => isProjectRelated(item.relatedTo)).slice()
      : [];

    list.sort(sortByDueDate);

    const upcomingList = list
      .filter((item) => {
        const due = item.effective_deadline_local || item.deadline_at_local;
        return due && due.isAfter(now);
      })
      .slice(0, 5);

    return { projectDeadlines: list, upcoming: upcomingList };
  }, [deadlines]);

  return {
    deadlines: projectDeadlines,
    upcoming,
    loading,
    error,
    reload,
  };
}
