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
    email, password, firstname_th, lastname_th, role, status, system, department 
    // ... ฟิลด์อื่นๆ
  } = userData;

  const userEmail = email.includes('@') ? email : `${email}@hpk.com`;

  // สร้างใน Supabase Auth ด้วย password ที่ส่งมาจากหน้าบ้าน
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: userEmail,
    password: password, // <-- ใช้ค่าที่แอดมินกรอกมา
    email_confirm: true,
    user_metadata: { role, systems: system || [] }
  });

  if (authError) throw authError;

  const userId = authData.user.id;

  try {
    // ใช้ upsert เพื่อรองรับทั้ง Trigger และการสร้างใหม่ (ป้องกัน Error Unique constraint)
    const profile = await prisma.profiles.upsert({
      where: { id: userId },
      update: {
        firstname_th, lastname_th, role,
        status_: status || 'Active',
        system: system || [],
        department: department || [],
        // ... ฟิลด์อื่นๆ ที่เหลือ
      },
      create: {
        id: userId,
        firstname_th, lastname_th, role,
        status_: status || 'Active',
        system: system || [],
        department: department || [],
      }
    });

    return profile;
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