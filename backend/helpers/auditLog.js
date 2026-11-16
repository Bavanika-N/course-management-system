const sensitiveKeyPattern = /password|passwd|secret|token|hash/i;

const removeSensitiveFields = (value) => {
  if (Array.isArray(value)) {
    return value.map(removeSensitiveFields);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !sensitiveKeyPattern.test(key))
      .map(([key, nestedValue]) => [key, removeSensitiveFields(nestedValue)])
  );
};

const createAuditContext = (req) => ({
  actorId: req.user.id,
  actorUsername: req.user.username,
  actorRole: req.user.role,
  ipAddress: req.ip || req.socket?.remoteAddress || null,
});

const insertAuditLog = async (connection, event) => {
  const previousData = event.previousData == null
    ? null
    : JSON.stringify(removeSensitiveFields(event.previousData));
  const newData = event.newData == null
    ? null
    : JSON.stringify(removeSensitiveFields(event.newData));

  await connection.execute(
    `INSERT INTO audit_logs
      (
        actor_id,
        actor_username,
        actor_role,
        action,
        entity_type,
        entity_id,
        previous_data,
        new_data,
        ip_address
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      event.actorId,
      event.actorUsername,
      event.actorRole,
      event.action,
      event.entityType,
      String(event.entityId),
      previousData,
      newData,
      event.ipAddress,
    ]
  );
};

module.exports = {
  createAuditContext,
  insertAuditLog,
};
