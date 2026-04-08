const express = require("express");
const profileController = require("../controllers/profile.controller");

const router = express.Router();

router.get("/", profileController.listProfiles);
router.get("/:id", profileController.getProfileById);
router.post("/", profileController.createProfile);
router.patch("/:id", profileController.updateProfile);
router.delete("/:id", profileController.deleteProfile);

module.exports = router;
