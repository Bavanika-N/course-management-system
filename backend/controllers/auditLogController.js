const AuditLog = require("../models/auditLogModel");

const getAuditLogs = async (req, res) => {
  try {
    const query = req.query;
    const readString = (name) => {
      const value = query[name];
      return value === undefined || typeof value === "string"
        ? value
        : null;
    };

    const entityTypeValue = readString("entityType");
    const entityIdValue = readString("entityId");
    const actorValue = readString("actor");
    const actionValue = readString("action");
    const from = readString("from");
    const to = readString("to");
    const pageValue = readString("page");
    const limitValue = readString("limit");

    if (
      entityTypeValue === null ||
      entityIdValue === null ||
      actorValue === null ||
      actionValue === null ||
      from === null ||
      to === null ||
      pageValue === null ||
      limitValue === null
    ) {
      return res.status(400).json({
        message: "Query parameters must be provided once as strings",
      });
    }

    const parsePositiveInteger = (value) => {
      if (value === undefined || !/^[1-9]\d*$/.test(value)) {
        return null;
      }

      const parsed = Number(value);
      return Number.isSafeInteger(parsed) ? parsed : null;
    };

    const page = pageValue === undefined ? 1 : parsePositiveInteger(pageValue);
    const limit = limitValue === undefined ? 20 : parsePositiveInteger(limitValue);

    if (page === null || limit === null || limit > 100) {
      return res.status(400).json({
        message: "Page or limit is invalid",
      });
    }

    const filters = {
      entityType: entityTypeValue || undefined,
      entityId: entityIdValue || undefined,
      actor: actorValue || undefined,
      action: actionValue || undefined,
      from: from || undefined,
      to: to || undefined,
    };

    const maxFilterLength = 100;
    if (
      (filters.entityType && filters.entityType.length > 50) ||
      (filters.entityId && filters.entityId.length > 64) ||
      (filters.actor && filters.actor.length > maxFilterLength) ||
      (filters.action && filters.action.length > maxFilterLength)
    ) {
      return res.status(400).json({
        message: "An audit log filter is too long",
      });
    }

    const isValidDate = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
      }

      const date = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value;
    };

    if (
      (filters.entityType && !["course", "enrollment"].includes(filters.entityType)) ||
      (filters.entityId && !/^[1-9]\d*$/.test(filters.entityId)) ||
      (filters.from && !isValidDate(filters.from)) ||
      (filters.to && !isValidDate(filters.to)) ||
      (filters.from && filters.to && filters.from > filters.to)
    ) {
      return res.status(400).json({
        message: "An audit log filter is invalid",
      });
    }

    const offset = (page - 1) * limit;
    if (!Number.isSafeInteger(offset)) {
      return res.status(400).json({
        message: "Page is too large",
      });
    }

    const result = await AuditLog.getPage({
      ...filters,
      limit,
      offset,
    });

    return res.status(200).json({
      message: "Audit logs retrieved successfully",
      auditLogs: result.auditLogs,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error("Error getting audit logs:", error.message);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  getAuditLogs,
};
