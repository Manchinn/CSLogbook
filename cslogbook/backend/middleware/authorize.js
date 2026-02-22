const permissions = require('../policies/permissions');
const { Teacher } = require('../models');

const POSITION_ALIASES = {
  'หัวหน้าภาควิชา': 'head_of_department'
};

const normalizeKey = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim().toLowerCase();
};

const getRoleKey = (user) => normalizeKey(user?.role);

const enrichTeacherContext = async (user) => {
  const role = getRoleKey(user);
  if (role !== 'teacher') {
    return;
  }

  if (user._teacherContextResolved) {
    return;
  }

  const hasTeacherContext =
    user.teacherId &&
    user.teacherType &&
    (user.position || user.teacherPosition) &&
    typeof user.canAccessTopicExam === 'boolean' &&
    typeof user.canExportProject1 === 'boolean';

  if (hasTeacherContext) {
    user._teacherContextResolved = true;
    return;
  }

  const teacher = await Teacher.findOne({
    where: { userId: user.userId },
    attributes: [
      'teacherId',
      'teacherType',
      'position',
      'canAccessTopicExam',
      'canExportProject1'
    ]
  });

  if (!teacher) {
    user._teacherContextResolved = true;
    return;
  }

  if (!user.teacherId) user.teacherId = teacher.teacherId;
  if (!user.teacherType) user.teacherType = teacher.teacherType;
  if (!user.position) user.position = user.teacherPosition || teacher.position;
  if (!user.teacherPosition) user.teacherPosition = teacher.position;
  if (typeof user.canAccessTopicExam !== 'boolean') {
    user.canAccessTopicExam = Boolean(teacher.canAccessTopicExam);
  }
  if (typeof user.canExportProject1 !== 'boolean') {
    user.canExportProject1 = Boolean(teacher.canExportProject1);
  }

  user._teacherContextResolved = true;
};

const buildPrincipalKeys = (user) => {
  const keys = new Set();
  const role = getRoleKey(user);
  if (!role) return keys;

  keys.add(role);

  if (role === 'teacher') {
    const teacherType = normalizeKey(user.teacherType);
    if (teacherType) {
      keys.add(`teacher:${teacherType}`);
    }

    const position = String(user.position || user.teacherPosition || '').trim();
    if (position) {
      keys.add(`teacher:${normalizeKey(position)}`);
      keys.add(`teacher:position:${normalizeKey(position)}`);

      const alias = POSITION_ALIASES[position];
      if (alias) {
        keys.add(`teacher:${normalizeKey(alias)}`);
      }
    }

    if (user.canAccessTopicExam) {
      keys.add('teacher:topic_exam_access');
    }

    if (user.canExportProject1) {
      keys.add('teacher:can_export_project1');
    }
  } else {
    const position = String(user.position || '').trim();
    if (position) {
      keys.add(`${role}:${normalizeKey(position)}`);
      keys.add(`${role}:position:${normalizeKey(position)}`);
    }
  }

  return keys;
};

const forbidden = (res) =>
  res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'You do not have permission to perform this action'
    }
  });

const unauthorized = (res) =>
  res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication is required'
    }
  });

const fromAllowed = (allowed = []) => {
  const normalizedAllowed = Array.isArray(allowed)
    ? allowed.map(normalizeKey).filter(Boolean)
    : [];

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return unauthorized(res);
      }

      if (!normalizedAllowed.length) {
        return forbidden(res);
      }

      await enrichTeacherContext(req.user);
      const principalKeys = buildPrincipalKeys(req.user);
      const isAllowed = normalizedAllowed.some((key) => principalKeys.has(key));

      if (!isAllowed) {
        return forbidden(res);
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Failed to validate permissions'
        }
      });
    }
  };
};

const authorize = (resource, action) => {
  const allowed = permissions?.[resource]?.[action] || [];
  return fromAllowed(allowed);
};

authorize.fromAllowed = fromAllowed;

module.exports = authorize;
