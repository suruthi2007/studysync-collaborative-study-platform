const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Group = require('../models/Group');
const Resource = require('../models/Resource');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
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

// @route   GET /api/groups/explore
// @desc    Get all platform groups to discover and join
router.get('/explore/all', protect, async (req, res) => {
  try {
    const allGroups = await Group.find({})
      .populate('createdBy', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, groups: allGroups });
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
// @desc    Join a study group using an invite link or code (flexible matching)
router.post('/join', protect, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode || !inviteCode.trim()) {
      return res.status(400).json({ success: false, message: 'Invite code is required' });
    }

    // Clean input: handle full URL pasting or whitespace
    let cleanCode = inviteCode.trim();
    if (cleanCode.includes('/')) {
      cleanCode = cleanCode.split('/').filter(Boolean).pop();
    }
    cleanCode = cleanCode.trim();

    // Flexible lookup: by inviteCode (case-insensitive) or by group name (case-insensitive)
    let group = await Group.findOne({
      $or: [
        { inviteCode: { $regex: new RegExp(`^${cleanCode}$`, 'i') } },
        { name: { $regex: new RegExp(`^${cleanCode}$`, 'i') } },
      ],
    });

    if (!group) {
      // Find sample active groups to guide the user
      const samples = await Group.find({}).select('inviteCode name').limit(4);
      const suggestions = samples.map(s => `${s.inviteCode} (${s.name})`).join(', ');

      return res.status(404).json({
        success: false,
        message: `Group code "${cleanCode}" was not found. Valid sample codes you can join: ${suggestions || 'None available'}`,
      });
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

    res.json({
      success: true,
      group: updatedGroup,
      message: isAlreadyMember ? 'You are already a member of this group!' : `Successfully joined "${group.name}"!`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/groups/:id
// @desc    Delete a study group (creator) or remove membership (deny / leave)
router.delete('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Study group not found' });
    }

    const isCreator = group.createdBy && group.createdBy.toString() === req.user._id.toString();
    const isMember = group.members.some(m => m.toString() === req.user._id.toString());

    if (!isCreator && !isMember) {
      return res.status(403).json({ success: false, message: 'You are not a member of this study group' });
    }

    // If the creator deletes the group or if only 1 member remains, delete completely
    if (isCreator || group.members.length <= 1) {
      // Cascade delete resources
      await Resource.deleteMany({ group: group._id });

      // Cascade delete quizzes and attempts
      const quizzes = await Quiz.find({ group: group._id });
      const quizIds = quizzes.map(q => q._id);
      if (quizIds.length > 0) {
        await QuizAttempt.deleteMany({ quiz: { $in: quizIds } });
        await Quiz.deleteMany({ group: group._id });
      }

      await Group.findByIdAndDelete(group._id);

      return res.json({
        success: true,
        action: 'deleted',
        message: `Study group "${group.name}" has been permanently deleted.`,
      });
    } else {
      // Regular member leaving / denying membership
      group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
      await group.save();

      return res.json({
        success: true,
        action: 'left',
        message: `You have left "${group.name}".`,
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/groups/:id/leave
// @desc    Explicitly leave a study group
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Study group not found' });
    }

    group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
    if (group.members.length === 0) {
      await Resource.deleteMany({ group: group._id });
      await Quiz.deleteMany({ group: group._id });
      await Group.findByIdAndDelete(group._id);
      return res.json({ success: true, message: `Group "${group.name}" removed as all members left.` });
    }

    await group.save();
    res.json({ success: true, message: `You have left "${group.name}".` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

