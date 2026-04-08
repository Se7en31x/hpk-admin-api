const userService = require("../services/user.service");

async function listUsers(req, res, next) {
  try {
    const users = await userService.listUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const result = await userService.createUser(req.body);
    
    res.status(201).json({ 
      success: true, 
      message: "สร้างบัญชีผู้ใช้งานสำเร็จ",
      data: result 
    });
  } catch (err) {
    if (err.message && err.message.includes('already registered')) {
      return res.status(400).json({ 
        success: false, 
        message: "อีเมลหรือชื่อผู้ใช้งานนี้มีในระบบแล้ว" 
      });
    }
    next(err);
  }
}

async function adminResetPassword(req, res, next) {
  try {
    const { userId, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "รหัสผ่านต้องยาว 6 ตัวขึ้นไป" });
    }

    const result = await userService.resetUserPassword(userId, newPassword);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  adminResetPassword,
};