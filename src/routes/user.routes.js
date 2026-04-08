const express = require("express");
const userController = require("../controllers/user.controller");

const router = express.Router();

router.get("/", userController.listUsers);
router.get("/:id", userController.getUserById);
router.post("/create", userController.createUser);
router.post("/reset-password", userController.adminResetPassword);

module.exports = router;
