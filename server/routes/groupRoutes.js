const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Group = require('../models/Group');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/groups
// @desc    Create a new study group
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, subject, color } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    // Unique short invite code e.g. "calc-8a9b"
    const inviteCode = `${name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4)}-${Math.random().toString(36).substring(2, 6)}`;

    const group = await Group.create({
      name,
      description: description || '',
      subject: subject || 'General',
      inviteCode,
      color: color || '#4F46E5',
      createdBy: req.user._id,
      members: [req.user._id],
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('createdBy', 'name email avatar')
      .populate('members', 'name email avatar');

    res.status(201).json({ success: true, group: populatedGroup });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/groups
// @desc    Get all groups the logged-in user belongs to
router.get('/', protect, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('createdBy', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, groups });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/groups/:id
// @desc    Get single group details if member
router.get('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('members', 'name email avatar');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check membership
    const isMember = group.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied: You are not a member of this study group' });
    }

    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/groups/join
// @desc    Join a study group using an invite link or code
router.post('/join', protect, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ success: false, message: 'Invite code is required' });
    }

    const cleanCode = inviteCode.trim();
    const group = await Group.findOne({ inviteCode: cleanCode });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Invalid study group invite code' });
    }

    // Check if already a member
    const isAlreadyMember = group.members.some(
      (m) => m.toString() === req.user._id.toString()
    );

    if (!isAlreadyMember) {
      group.members.push(req.user._id);
      await group.save();
    }

    const updatedGroup = await Group.findById(group._id)
      .populate('createdBy', 'name email avatar')
      .populate('members', 'name email avatar');

    res.json({ success: true, group: updatedGroup, message: 'Successfully joined group!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
