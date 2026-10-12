const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutor',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  timeSlot: {
    type: String, // e.g. "14:00 - 15:00"
    required: true,
  },
  subject: {
    type: String,
    default: 'General Tutoring',
  },
  notes: {
    type: String,
    default: '',
  },
  hourlyRate: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed'],
    default: 'confirmed',
  },
  meetingRoomId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a tutor cannot be double-booked for the exact same date and timeSlot
BookingSchema.index({ tutor: 1, date: 1, timeSlot: 1, status: 1 });

module.exports = mongoose.model('Booking', BookingSchema);
