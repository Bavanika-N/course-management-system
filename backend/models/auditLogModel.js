const db = require("../config/db");

const AuditLog = {
  async getPage({
    entityType,
    entityId,
    actor,
    action,
    from,
    to,
    limit,
    offset,
  }) {
    const conditions = [];
    const values = [];

    if (entityType) {
      conditions.push("entity_type = ?");
      values.push(entityType);
    }

    if (entityId) {
      conditions.push("entity_id = ?");
      values.push(entityId);
    }

    if (actor) {
      const escapedActor = actor.replace(/[!%_]/g, "!$&");
      const actorPattern = `%${escapedActor}%`;
      if (/^[1-9]\d*$/.test(actor)) {
        conditions.push("(actor_id = ? OR actor_username LIKE ? ESCAPE '!')");
        values.push(Number(actor), actorPattern);
      } else {
        conditions.push("actor_username LIKE ? ESCAPE '!'");
        values.push(actorPattern);
      }
    }

    if (action) {
      conditions.push("action = ?");
      values.push(action);
    }

    if (from) {
      conditions.push("created_at >= ?");
      values.push(from);
    }

    if (to) {
      conditions.push("created_at < DATE_ADD(?, INTERVAL 1 DAY)");
      values.push(to);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM audit_logs
       ${whereClause}`,
      values
    );

    const [rows] = await db.execute(
      `SELECT
          id,
          actor_id,
          actor_username,
          actor_role,
          action,
          entity_type,
          entity_id,
          previous_data,
          new_data,
          ip_address,
          created_at
       FROM audit_logs
       ${whereClause}
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    return {
      auditLogs: rows,
      total: Number(countRows[0].total),
    };
  },
};

module.exports = AuditLog;
