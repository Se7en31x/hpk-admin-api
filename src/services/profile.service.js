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
  "role_id",
  "system_id",
  "department_id",
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

function toNullableInt(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

function normalizeIntArray(value, fieldName) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    const err = new Error(`${fieldName} must be an array of integers`);
    err.statusCode = 400;
    throw err;
  }

  const normalized = [...new Set(value.map((item) => {
    const n = parseInt(item, 10);
    if (Number.isNaN(n)) {
      const err = new Error(`${fieldName} contains an invalid integer: ${item}`);
      err.statusCode = 400;
      throw err;
    }
    return n;
  }))];

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

  // Ensure all nullable integer scalar fields are properly typed
  const intFields = [
    "sex_id", "nationality", "race", "mstatus", "occupation",
    "current_maininscl", "subdistrict_code", "district_code",
    "province_code", "zip_code", "role_id",
  ];
  for (const field of intFields) {
    if (data[field] !== undefined) {
      data[field] = toNullableInt(data[field]);
    }
  }

  data.birth_date = toNullableDate(payload.birth_date);
  data.system_id = normalizeIntArray(payload.system_id, "system_id");
  data.department_id = normalizeIntArray(payload.department_id, "department_id");
  data.status_ = normalizeStatus(payload.status ?? payload.status_);

  validateCommonFields(data);

  return data;
}

async function listProfiles() {
  const profiles = await prisma.profiles.findMany({
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

  const [departments, systems] = await Promise.all([
    prisma.departments.findMany({ select: { id: true, name: true } }),
    prisma.systems.findMany({ select: { id: true, name_th: true } }),
  ]);

  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));
  const sysMap = Object.fromEntries(systems.map((s) => [s.id, s.name_th]));

  return profiles.map((p) => ({
    ...p,
    department: (p.department_id || []).map((id) => deptMap[id] || id),
    system: (p.system_id || []).map((id) => sysMap[id] || id),
  }));
}

async function getProfileById(id) {
  const profile = await prisma.profiles.findFirst({
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

  if (!profile) return null;

  const [departments, systems] = await Promise.all([
    prisma.departments.findMany({
      where: { id: { in: profile.department_id || [] } },
      select: { id: true, name: true },
    }),
    prisma.systems.findMany({
      where: { id: { in: profile.system_id || [] } },
      select: { id: true, name_th: true },
    }),
  ]);

  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));
  const sysMap = Object.fromEntries(systems.map((s) => [s.id, s.name_th]));

  return {
    ...profile,
    department: (profile.department_id || []).map((id) => deptMap[id] || id),
    system: (profile.system_id || []).map((id) => sysMap[id] || id),
  };
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

  if (!data.system_id || data.system_id.length === 0) {
    const err = new Error("system_id is required");
    err.statusCode = 400;
    throw err;
  }

  if (!data.department_id || data.department_id.length === 0) {
    const err = new Error("department_id is required");
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

  if (data.system_id !== undefined && data.system_id.length === 0) {
    const err = new Error("system_id must contain at least 1 item");
    err.statusCode = 400;
    throw err;
  }

  if (data.department_id !== undefined && data.department_id.length === 0) {
    const err = new Error("department_id must contain at least 1 item");
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
