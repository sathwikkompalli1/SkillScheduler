const express = require('express');
const router = express.Router();
const {
    generatePlan,
    replan,
    replanSkill,
    getResources,
    previewTopics
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/generate-plan/:skillId', protect, generatePlan);
router.post('/replan', protect, replan);
router.post('/replan-skill/:skillId', protect, replanSkill);
router.post('/resources', protect, getResources);
router.post('/preview-topics', protect, previewTopics);

module.exports = router;
