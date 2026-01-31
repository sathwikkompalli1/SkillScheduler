const express = require('express');
const router = express.Router();
const { updateOnboarding, getProfile, updateProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getProfile);
router.put('/', protect, updateProfile);
router.put('/onboard', protect, updateOnboarding);

module.exports = router;
