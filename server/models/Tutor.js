const mongoose = require('mongoose');

const TutorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  headline: {
    type: String,
    default: 'Expert Peer Tutor & Academic Mentor',
  },
  bio: {
    type: String,
    default: '',
  },
  subjects: [{
    type: String,
  }],
  hourlyRate: {
    type: Number,
    required: true,
    min: 0,
  },
  rating: {
    type: Number,
    default: 5.0,
    min: 1,
    max: 5,
  },
  reviewsCount: {
    type: Number,
    default: 12,
  },
  isVerified: {
    type: Boolean,
    default: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  availableDays: [{
    type: String, // e.g. "Monday", "Tuesday", etc.
  }],
  availableSlots: [{
    type: String, // e.g. "09:00 - 10:00", "11:00 - 12:00", "14:00 - 15:00", "16:00 - 17:00"
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Tutor', TutorSchema);
