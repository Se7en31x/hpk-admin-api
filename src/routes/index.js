const express = require("express");
const userRoutes = require("./user.routes");
const profileRoutes = require("./profile.routes");
const lookupRoutes = require("./lookup.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running",
    timestamp: new Date().toISOString(),
  });
});

router.use("/users", userRoutes);
router.use("/profiles", profileRoutes);
router.use("/lookups", lookupRoutes);

module.exports = router;
