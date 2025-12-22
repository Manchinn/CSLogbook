import StudentTimeline from './StudentTimeline';

// ส่งออกคอมโพเนนต์หลัก
export default StudentTimeline;

// ส่งออกคอมโพเนนต์ย่อยเพื่อใช้แยกในส่วนอื่น ๆ ได้
export { default as TimelineItems } from './TimelineItems';
export { default as ImportantDeadlines } from './ImportantDeadlines';
export { default as Notifications } from './Notifications';
export { default as NextAction } from './NextAction';
export { default as InternshipSection } from './InternshipSection';
export { default as ProjectSection } from './ProjectSection';
export { default as StudyStatistics } from './StudyStatistics';
export { default as EducationPath } from './EducationPath';