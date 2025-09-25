const { ProjectEvent } = require('../models');

class ProjectEventService {
  async logEvent(projectId, eventType, actorRole, actorUserId, meta = {}) {
    return await ProjectEvent.create({
      projectId,
      eventType,
      actorRole: actorRole || null,
      actorUserId: actorUserId || null,
      metaJson: meta
    });
  }
}

module.exports = new ProjectEventService();
