const express = require('express');
const router = express.Router();
const Tutor = require('../models/Tutor');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/tutors
// @desc    List all verified tutors in marketplace
router.get('/', async (req, res) => {
  try {
    const { subject, maxRate, search } = req.query;
    const query = { isVerified: true };

    if (subject && subject !== 'All') {
      query.subjects = { $in: [new RegExp(subject, 'i')] };
    }

    if (maxRate) {
      query.hourlyRate = { $lte: Number(maxRate) };
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { headline: new RegExp(search, 'i') },
        { bio: new RegExp(search, 'i') },
      ];
    }

    const tutors = await Tutor.find(query)
      .populate('user', 'name email avatar')
      .sort({ rating: -1, hourlyRate: 1 });

    res.json({ success: true, tutors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/tutors/:id
// @desc    Get tutor profile details
router.get('/:id', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id).populate('user', 'name email avatar');
    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Tutor not found' });
    }
    res.json({ success: true, tutor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/tutors/profile
// @desc    Create or update tutor profile
router.post('/profile', protect, async (req, res) => {
  try {
    const { headline, bio, subjects, hourlyRate, availableDays, availableSlots } = req.body;

    let tutor = await Tutor.findOne({ user: req.user._id });
    if (tutor) {
      tutor.headline = headline || tutor.headline;
      tutor.bio = bio || tutor.bio;
      tutor.subjects = subjects || tutor.subjects;
      tutor.hourlyRate = hourlyRate !== undefined ? hourlyRate : tutor.hourlyRate;
      tutor.availableDays = availableDays || tutor.availableDays;
      tutor.availableSlots = availableSlots || tutor.availableSlots;
      await tutor.save();
    } else {
      tutor = await Tutor.create({
        user: req.user._id,
        name: req.user.name,
        headline: headline || 'Peer Tutor & Study Mentor',
        bio: bio || '',
        subjects: subjects || ['Mathematics', 'Computer Science'],
        hourlyRate: hourlyRate || 35,
        avatar: req.user.avatar,
        availableDays: availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        availableSlots: availableSlots || ['10:00 - 11:00', '13:00 - 14:00', '16:00 - 17:00'],
      });
    }

    res.json({ success: true, tutor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
