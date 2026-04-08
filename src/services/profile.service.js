const prisma = require("../config/prisma");

const writableFields = [
  "firstname_th",
  "lastname_th",
  "firstname_en",
  "lastname_en",
  "sex_id",
  "birth_date",
  "nationality",
  "race",
  "mstatus",
  "occupation",
  "phone",
  "current_maininscl",
  "subdistrict_code",
  "district_code",
  "province_code",
  "zip_code",
  "address_detail",
  "cid",
  "profession_id",
  "title_code",
  "role",
  "system",
  "department",
];

const allowedStatuses = ["Active", "Disabled", "Banned"];

function normalizeStatus(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const normalized = String(value).trim();
  if (!allowedStatuses.includes(normalized)) {
    const err = new Error(`status must be one of: ${allowedStatuses.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }
  return normalized;
}

function toNullableDate(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const err = new Error("birth_date is invalid");
    err.statusCode = 400;
    throw err;
  }
  return parsed;
}

function normalizeStringArray(value, fieldName) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    const err = new Error(`${fieldName} must be an array of strings`);
    err.statusCode = 400;
    throw err;
  }

  const normalized = [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];

  if (normalized.length > 50) {
    const err = new Error(`${fieldName} has too many items`);
    err.statusCode = 400;
    throw err;
  }

  return normalized;
}

function validateCommonFields(data) {
  if (data.cid != null && data.cid !== "" && !/^\d{13}$/.test(String(data.cid))) {
    const err = new Error("cid must be 13 digits");
    err.statusCode = 400;
    throw err;
  }

  if (data.phone != null && data.phone !== "") {
    const compactPhone = String(data.phone).replace(/[-\s]/g, "");
    if (!/^\d{9,10}$/.test(compactPhone)) {
      const err = new Error("phone must be 9-10 digits");
      err.statusCode = 400;
      throw err;
    }
  }

  if (data.birth_date instanceof Date && data.birth_date > new Date()) {
    const err = new Error("birth_date cannot be in the future");
    err.statusCode = 400;
    throw err;
  }
}

function normalizeProfilePayload(payload) {
  const data = {};

  for (const field of writableFields) {
    if (payload[field] !== undefined) {
      data[field] = payload[field];
    }
  }

  data.birth_date = toNullableDate(payload.birth_date);
  data.system = normalizeStringArray(payload.system, "system");
  data.department = normalizeStringArray(payload.department, "department");
  data.status_ = normalizeStatus(payload.status ?? payload.status_);

  validateCommonFields(data);

  if (data.role != null && data.role !== "" && String(data.role).length > 50) {
    const err = new Error("role is too long (max 50 chars)");
    err.statusCode = 400;
    throw err;
  }

  return data;
}

async function listProfiles() {
  return prisma.profiles.findMany({
    where: {
      deleted_at: null,
    },
    include: {
      users: {
        select: {
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });
}

async function getProfileById(id) {
  return prisma.profiles.findFirst({
    where: {
      id,
      deleted_at: null,
    },
    include: {
      users: {
        select: {
          email: true,
          role: true,
        },
      },
    },
  });
}

async function createProfile(payload) {
  const { id, ...rest } = payload;

  if (!id) {
    const err = new Error("id is required");
    err.statusCode = 400;
    throw err;
  }

  const data = normalizeProfilePayload(rest);
  data.id = id;

  if (!data.firstname_th || !data.lastname_th) {
    const err = new Error("firstname_th and lastname_th are required");
    err.statusCode = 400;
    throw err;
  }

  if (!data.system || data.system.length === 0) {
    const err = new Error("system is required");
    err.statusCode = 400;
    throw err;
  }

  if (!data.department || data.department.length === 0) {
    const err = new Error("department is required");
    err.statusCode = 400;
    throw err;
  }

  if (!data.status_) {
    data.status_ = "Active";
  }

  return prisma.profiles.create({ data });
}

async function updateProfile(id, payload) {
  const data = normalizeProfilePayload(payload);

  if (Object.keys(data).length === 0) {
    const err = new Error("No fields to update");
    err.statusCode = 400;
    throw err;
  }

  if (data.system !== undefined && data.system.length === 0) {
    const err = new Error("system must contain at least 1 item");
    err.statusCode = 400;
    throw err;
  }

  if (data.department !== undefined && data.department.length === 0) {
    const err = new Error("department must contain at least 1 item");
    err.statusCode = 400;
    throw err;
  }

  data.updated_at = new Date();

  return prisma.profiles.update({
    where: { id },
    data,
  });
}

async function deleteProfile(id) {
  return prisma.profiles.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      updated_at: new Date(),
      status_: "Disabled",
    },
  });
}

module.exports = {
  listProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
};
