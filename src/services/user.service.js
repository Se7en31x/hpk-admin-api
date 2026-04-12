const prisma = require("../config/prisma");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listUsers() {
  return prisma.profiles.findMany({
    orderBy: { created_at: "desc" },
  });
}

async function getUserById(id) {
  return prisma.profiles.findUnique({ 
    where: { id } 
  });
}

async function createUser(userData) {
  const {
    email, password,
    firstname_th, lastname_th, firstname_en, lastname_en,
    cid, birth_date, title_code,
    sex_id, mstatus, phone,
    address_detail, subdistrict_code, district_code, province_code, zip_code,
    profession_id, current_maininscl,
    role_id, status,
    system_id, department_id,
  } = userData;

  const userEmail = email.includes('@') ? email : `${email}@hpk.com`;

  const toInt = (v) => (v != null && v !== '' ? (parseInt(v, 10) || null) : null);
  const toDate = (v) => (v ? new Date(v) : null);

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: userEmail,
    password: password,
    email_confirm: true,
    user_metadata: { role_id: toInt(role_id), system_id: Array.isArray(system_id) ? system_id : [] },
  });

  if (authError) throw authError;

  const userId = authData.user.id;

  const profileData = {
    firstname_th: firstname_th || null,
    lastname_th: lastname_th || null,
    firstname_en: firstname_en || null,
    lastname_en: lastname_en || null,
    cid: cid || null,
    birth_date: toDate(birth_date),
    title_code: title_code || null,
    sex_id: toInt(sex_id),
    mstatus: toInt(mstatus),
    phone: phone || null,
    address_detail: address_detail || null,
    subdistrict_code: toInt(subdistrict_code),
    district_code: toInt(district_code),
    province_code: toInt(province_code),
    zip_code: toInt(zip_code),
    profession_id: profession_id || null,
    current_maininscl: toInt(current_maininscl),
    role_id: toInt(role_id),
    status_: status || 'Active',
    system_id: Array.isArray(system_id) ? system_id : [],
    department_id: Array.isArray(department_id) ? department_id : [],
  };

  try {
    // ใช้ upsert เพื่อรองรับทั้ง Trigger และการสร้างใหม่ (ป้องกัน Error Unique constraint)
    const profile = await prisma.profiles.upsert({
      where: { id: userId },
      update: profileData,
      create: { id: userId, ...profileData },
    });

    return { ...profile, temporaryPassword: password };
  } catch (dbError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw dbError;
  }
}

// --- 🚩 ฟังก์ชันพิเศษ: เปลี่ยนรหัสผ่านโดยไม่ใช้ Email (Admin Override) ---
async function resetUserPassword(userId, newPassword) {
  // ใช้ auth.admin.updateUserById เพื่อเปลี่ยนรหัสผ่านทันทีโดยไม่ต้องยืนยันตัวตน
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  );

  if (error) throw error;
  return { success: true, message: "เปลี่ยนรหัสผ่านสำเร็จ" };
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  resetUserPassword,
};