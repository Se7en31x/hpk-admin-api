const express = require("express");
const lookupController = require("../controllers/lookup.controller");

const router = express.Router();

router.get("/profile-form", lookupController.getProfileFormLookups);

module.exports = router;
