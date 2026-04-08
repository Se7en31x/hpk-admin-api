const lookupService = require("../services/lookup.service");

async function getProfileFormLookups(req, res, next) {
  try {
    const data = await lookupService.getProfileFormLookups();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProfileFormLookups,
};
