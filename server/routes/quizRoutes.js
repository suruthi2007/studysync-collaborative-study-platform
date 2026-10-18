const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Group = require('../models/Group');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/quizzes
// @desc    Create a quiz or flashcard deck for a group
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, groupId, type, questions, flashcards } = req.body;

    let targetGroupId = groupId;
    if (!targetGroupId) {
      const defaultGroup = await Group.findOne({ members: req.user._id }) || await Group.findOne();
      if (defaultGroup) {
        targetGroupId = defaultGroup._id;
      }
    }

    if (!title || !targetGroupId) {
      return res.status(400).json({ success: false, message: 'Title and groupId are required' });
    }

    const group = await Group.findById(targetGroupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      group.members.push(req.user._id);
      await group.save();
    }

    const quiz = await Quiz.create({
      title,
      description: description || '',
      group: targetGroupId,
      createdBy: req.user._id,
      type: type || 'quiz',
      questions: questions || [],
      flashcards: flashcards || [],
    });

    const populatedQuiz = await Quiz.findById(quiz._id).populate('createdBy', 'name email avatar');
    res.status(201).json({ success: true, quiz: populatedQuiz });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/quizzes
// @desc    Get all quizzes/flashcard sets accessible by user
router.get('/', protect, async (req, res) => {
  try {
    const userGroups = await Group.find({ members: req.user._id }).select('_id');
    const groupIds = userGroups.map(g => g._id);
    const quizzes = await Quiz.find({
      $or: [
        { group: { $in: groupIds } },
        { createdBy: req.user._id }
      ]
    })
      .populate('createdBy', 'name email avatar')
      .populate('group', 'name subject color')
      .sort({ createdAt: -1 });

    res.json({ success: true, quizzes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/quizzes/group/:groupId
// @desc    Get all quizzes/flashcard sets for a group
router.get('/group/:groupId', protect, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const quizzes = await Quiz.find({ group: groupId })
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, quizzes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/quizzes/:id
// @desc    Get single quiz details
router.get('/:id', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('group', 'name subject');

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    res.json({ success: true, quiz });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/quizzes/:id/attempt
// @desc    Submit answers for a quiz, compute score, and record attempt
router.post('/:id/attempt', protect, async (req, res) => {
  try {
    const { answers, timeSpentSeconds } = req.body; // answers: { [questionIndex]: selectedOptionIndex }
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    let score = 0;
    const totalQuestions = quiz.questions.length;
    const questionReview = [];

    quiz.questions.forEach((q, idx) => {
      const selected = answers ? answers[idx] : undefined;
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) score += 1;

      questionReview.push({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        selectedAnswer: selected,
        isCorrect,
        explanation: q.explanation,
      });
    });

    const accuracyPercentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      group: quiz.group,
      user: req.user._id,
      score,
      totalQuestions,
      accuracyPercentage,
      timeSpentSeconds: timeSpentSeconds || 0,
    });

    res.json({
      success: true,
      score,
      totalQuestions,
      accuracyPercentage,
      review: questionReview,
      attemptId: attempt._id,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/quizzes/group/:groupId/leaderboard
// @desc    Get gamified group leaderboard standings
router.get('/group/:groupId/leaderboard', protect, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Aggregate attempts by user for this group
    const leaderboard = await QuizAttempt.aggregate([
      { $match: { group: new (require('mongoose').Types.ObjectId)(groupId) } },
      {
        $group: {
          _id: '$user',
          totalPoints: { $sum: '$score' },
          quizzesTaken: { $sum: 1 },
          avgAccuracy: { $avg: '$accuracyPercentage' },
          lastAttemptDate: { $max: '$completedAt' },
        },
      },
      { $sort: { totalPoints: -1, avgAccuracy: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          _id: 1,
          totalPoints: 1,
          quizzesTaken: 1,
          avgAccuracy: { $round: ['$avgAccuracy', 1] },
          lastAttemptDate: 1,
          name: '$userDetails.name',
          avatar: '$userDetails.avatar',
          email: '$userDetails.email',
        },
      },
    ]);

    res.json({ success: true, leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
