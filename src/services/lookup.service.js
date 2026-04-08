const prisma = require("../config/prisma");

async function getProfileFormLookups() {
  const [titles, sexes, mstatuses, roles, systems, departments, provinces, districts, subdistricts] = await Promise.all([
    prisma.lookup_titles.findMany({
      select: { title_code: true, name: true, short_name: true },
      orderBy: { title_code: "asc" },
    }),
    prisma.lookup_sex.findMany({
      select: { sex_code: true, sex: true },
      orderBy: { sex_code: "asc" },
    }),
    prisma.lookup_mstatus.findMany({
      select: { mstatus_code: true, mstatus: true },
      orderBy: { mstatus_code: "asc" },
    }),
    prisma.roles.findMany({
      where: { OR: [{ is_disabled: false }, { is_disabled: null }] },
      select: { id: true, code: true, role_name_th: true, role_name_en: true },
      orderBy: { id: "asc" },
    }),
    prisma.systems.findMany({
      where: { OR: [{ is_disabled: false }, { is_disabled: null }] },
      select: { id: true, system_code: true, name_th: true, name_en: true },
      orderBy: { id: "asc" },
    }),
    prisma.departments.findMany({
      where: { OR: [{ is_disable: false }, { is_disable: null }] },
      select: { id: true, name: true, name_en: true, code: true },
      orderBy: { code: "asc" },
    }),
    prisma.lookup_province.findMany({
      select: { province: true, value: true },
      orderBy: { value: "asc" },
    }),
    prisma.lookup_district.findMany({
      select: { district: true, provcode: true, distcode: true, value: true },
      orderBy: { value: "asc" },
    }),
    prisma.lookup_subdistrict.findMany({
      select: { subdistrict: true, provcode: true, distcode: true, subdistcode: true, value: true },
      orderBy: { value: "asc" },
    }),
  ]);

  return {
    titles,
    sexes,
    mstatuses,
    roles,
    systems,
    departments,
    provinces,
    districts,
    subdistricts,
  };
}

module.exports = {
  getProfileFormLookups,
};
