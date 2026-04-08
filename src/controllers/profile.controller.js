const profileService = require("../services/profile.service");

async function listProfiles(req, res, next) {
  try {
    const profiles = await profileService.listProfiles();
    res.json({ success: true, data: profiles });
  } catch (err) {
    next(err);
  }
}

async function getProfileById(req, res, next) {
  try {
    const profile = await profileService.getProfileById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

async function createProfile(req, res, next) {
  try {
    const profile = await profileService.createProfile(req.body);
    res.status(201).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const profile = await profileService.updateProfile(req.params.id, req.body);
    res.json({ success: true, data: profile });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }
    next(err);
  }
}

async function deleteProfile(req, res, next) {
  try {
    await profileService.deleteProfile(req.params.id);
    res.json({ success: true, message: "Profile deleted" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }
    next(err);
  }
}

module.exports = {
  listProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
};
