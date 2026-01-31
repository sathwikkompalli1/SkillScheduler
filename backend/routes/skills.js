const express = require('express');
const router = express.Router();
const {
    createSkill,
    getSkills,
    getSkill,
    updateSkill,
    deleteSkill,
    updateSkillProgress
} = require('../controllers/skillController');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(protect, getSkills)
    .post(protect, createSkill);

router.route('/:id')
    .get(protect, getSkill)
    .put(protect, updateSkill)
    .delete(protect, deleteSkill);

router.put('/:id/progress', protect, updateSkillProgress);

module.exports = router;
