import { normalizeIncomingTracks } from '../constants/projectTracks';

export const PROJECT_ACTIVATION_BLOCK_STATUSES = ['in_progress', 'completed', 'archived'];

const STATUS_BLOCK_MESSAGES = {
	in_progress: 'โครงงานอยู่ในสถานะกำลังดำเนินการแล้ว',
	completed: 'โครงงานเสร็จสิ้นแล้ว',
	archived: 'โครงงานถูกเก็บถาวร'
};

const ensureNormalizedProject = (project) => {
	if (!project) return project;
	if (Array.isArray(project.tracks) && project.tracks.length) return project;
	return normalizeIncomingTracks(project);
};

export const extractProjectTrackCodes = (project) => {
	if (!project) return [];
	const normalized = ensureNormalizedProject(project);
	if (Array.isArray(normalized?.tracks)) {
		return normalized.tracks.filter(Boolean);
	}
	if (normalized?.track) {
		return [normalized.track];
	}
	return [];
};

export const buildProjectActivationChecklist = (project) => {
	const normalized = ensureNormalizedProject(project);
	if (!normalized) return [];
	const trackCodes = extractProjectTrackCodes(normalized);
	return [
		{ key: 'members', label: 'มีสมาชิกครบ 2 คน', pass: (normalized.members?.length === 2) },
		{ key: 'advisor', label: 'เลือกอาจารย์ที่ปรึกษา', pass: !!normalized.advisorId },
		{ key: 'name_th', label: 'ชื่อโครงงานพิเศษภาษาไทย', pass: !!normalized.projectNameTh },
		{ key: 'name_en', label: 'ชื่อโครงงานพิเศษภาษาอังกฤษ', pass: !!normalized.projectNameEn },
		{ key: 'type', label: 'ระบุประเภทโครงงานพิเศษ', pass: !!normalized.projectType },
		{ key: 'track', label: 'ระบุหมวด', pass: trackCodes.length > 0 }
	];
};

export const evaluateProjectReadiness = (project) => {
	if (!project) {
		return {
			checklist: [],
			missingReasons: ['ยังไม่มีข้อมูลโครงงาน'],
			blockingMessage: null,
			canActivate: false
		};
	}

	const normalized = ensureNormalizedProject(project);
	const checklist = buildProjectActivationChecklist(normalized);
	const missingChecklist = checklist.filter(item => !item.pass).map(item => item.label);
	const blockingMessage = PROJECT_ACTIVATION_BLOCK_STATUSES.includes(normalized.status)
		? (STATUS_BLOCK_MESSAGES[normalized.status] || 'สถานะปัจจุบันไม่อนุญาตให้เริ่ม')
		: null;

	return {
		checklist,
		missingReasons: missingChecklist,
		blockingMessage,
		canActivate: !blockingMessage && missingChecklist.length === 0
	};
};
