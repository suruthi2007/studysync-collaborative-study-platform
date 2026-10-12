const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Tutor = require('../models/Tutor');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/bookings
// @desc    Book a slot with strict anti-double-booking validation
router.post('/', protect, async (req, res) => {
  try {
    const { tutorId, date, timeSlot, subject, notes } = req.body;

    if (!tutorId || !date || !timeSlot) {
      return res.status(400).json({ success: false, message: 'Tutor, date, and time slot are required' });
    }

    const tutor = await Tutor.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Tutor not found' });
    }

    // Check if student is booking their own tutor profile
    if (tutor.user.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot book your own session' });
    }

    // STRICT DOUBLE-BOOKING CHECK
    const existingConflict = await Booking.findOne({
      tutor: tutorId,
      date,
      timeSlot,
      status: 'confirmed',
    });

    if (existingConflict) {
      return res.status(409).json({
        success: false,
        message: `Double-booking prevention: Slot "${timeSlot}" on ${date} has already been reserved. Please pick another time.`,
      });
    }

    // Generate unique study room ID for the booked session
    const meetingRoomId = `session-${tutorId.toString().slice(-4)}-${Date.now().toString().slice(-6)}`;

    const booking = await Booking.create({
      tutor: tutorId,
      student: req.user._id,
      date,
      timeSlot,
      subject: subject || (tutor.subjects[0] || 'General Tutoring'),
      notes: notes || '',
      hourlyRate: tutor.hourlyRate,
      status: 'confirmed',
      meetingRoomId,
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('tutor')
      .populate('student', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Session successfully booked! Room reserved.',
      booking: populatedBooking,
    });
  } catch (err) {
    // Catch unique index violation if race condition occurs
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Conflict: This exact slot was just booked by another student.',
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/bookings/booked-slots
// @desc    Get all booked time slots for a tutor on a given date (for calendar gray-out)
router.get('/booked-slots', async (req, res) => {
  try {
    const { tutorId, date } = req.query;
    if (!tutorId || !date) {
      return res.status(400).json({ success: false, message: 'tutorId and date are required' });
    }

    const bookings = await Booking.find({
      tutor: tutorId,
      date,
      status: 'confirmed',
    }).select('timeSlot');

    const bookedSlots = bookings.map(b => b.timeSlot);
    res.json({ success: true, bookedSlots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/bookings/my
// @desc    Get user's appointments (both as student and as tutor)
router.get('/my', protect, async (req, res) => {
  try {
    // Find bookings where user is student
    const studentBookings = await Booking.find({ student: req.user._id })
      .populate({
        path: 'tutor',
        populate: { path: 'user', select: 'name email avatar' },
      })
      .sort({ date: 1, timeSlot: 1 });

    // Check if user is a tutor
    const tutorProfile = await Tutor.findOne({ user: req.user._id });
    let tutorBookings = [];
    if (tutorProfile) {
      tutorBookings = await Booking.find({ tutor: tutorProfile._id })
        .populate('student', 'name email avatar')
        .sort({ date: 1, timeSlot: 1 });
    }

    res.json({
      success: true,
      asStudent: studentBookings,
      asTutor: tutorBookings,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PATCH /api/bookings/:id/cancel
// @desc    Cancel a booking
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify ownership
    if (booking.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this booking' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled successfully', booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
