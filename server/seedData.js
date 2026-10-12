const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Group = require('./models/Group');
const Resource = require('./models/Resource');
const Quiz = require('./models/Quiz');
const QuizAttempt = require('./models/QuizAttempt');
const Tutor = require('./models/Tutor');
const Booking = require('./models/Booking');

async function seedDatabase() {
  try {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log(' Database already contains data. Skipping initial seed.');
      return;
    }

    console.log(' Seeding initial demo data for StudySync...');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 1. Create Core Users
    const alice = await User.create({
      name: 'Alice Chen',
      email: 'alice.chen@student.edu',
      password: passwordHash,
      role: 'student',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    });

    const bob = await User.create({
      name: 'Bob Smith',
      email: 'bob.smith@student.edu',
      password: passwordHash,
      role: 'student',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    });

    const tutorSarah = await User.create({
      name: 'Dr. Sarah Lin',
      email: 'sarah.tutor@mit.edu',
      password: passwordHash,
      role: 'tutor',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    });

    const tutorDavid = await User.create({
      name: 'David Miller',
      email: 'david.miller@stanford.edu',
      password: passwordHash,
      role: 'tutor',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    });

    // 2. Create Study Groups
    const calculusGroup = await Group.create({
      name: 'Calculus 101',
      description: 'Weekly study room for limits, derivatives, integrals, and exam prep.',
      subject: 'Mathematics',
      inviteCode: 'calc-101',
      color: '#4F46E5', // Indigo
      createdBy: alice._id,
      members: [alice._id, bob._id],
    });

    const csGroup = await Group.create({
      name: 'CS 50 - Algorithms',
      description: 'Group problem solving: Dynamic Programming, Trees, and Graph algorithms.',
      subject: 'Computer Science',
      inviteCode: 'cs50-algo',
      color: '#059669', // Emerald
      createdBy: bob._id,
      members: [alice._id, bob._id],
    });

    const chemGroup = await Group.create({
      name: 'Organic Chemistry',
      description: 'Reaction mechanisms, stereochemistry, and lab review sessions.',
      subject: 'Chemistry',
      inviteCode: 'chem-202',
      color: '#D97706', // Amber
      createdBy: alice._id,
      members: [alice._id],
    });

    // 3. Create Resources
    await Resource.create([
      {
        title: 'Calculus Cheat Sheet - Derivatives & Chain Rule',
        fileName: 'Calculus_Derivatives_Summary.pdf',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileType: 'application/pdf',
        fileSize: 420000,
        storageType: 's3',
        group: calculusGroup._id,
        uploadedBy: alice._id,
      },
      {
        title: 'Integration by Parts Reference Guide',
        fileName: 'Integration_Techniques_Notes.pdf',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileType: 'application/pdf',
        fileSize: 310000,
        storageType: 's3',
        group: calculusGroup._id,
        uploadedBy: bob._id,
      },
      {
        title: 'Binary Search Tree & BFS/DFS Diagram',
        fileName: 'Tree_Traversals_Cheatsheet.png',
        fileUrl: 'https://images.unsplash.com/photo-1516116211227-bbc3b3531b40?auto=format&fit=crop&w=1200&q=80',
        fileType: 'image/png',
        fileSize: 890000,
        storageType: 's3',
        group: csGroup._id,
        uploadedBy: bob._id,
      },
    ]);

    // 4. Create Quizzes & Flashcards
    const calcQuiz = await Quiz.create({
      title: 'Derivatives & Fundamental Calculus Quiz',
      description: 'Test your grasp of limits, product rule, and critical points.',
      group: calculusGroup._id,
      createdBy: alice._id,
      type: 'quiz',
      questions: [
        {
          question: 'What is the derivative of f(x) = x³ - 5x + 7?',
          options: ['3x² - 5', '3x² + 7', 'x² - 5x', '3x - 5'],
          correctAnswer: 0,
          explanation: 'Using the power rule: d/dx(x³) = 3x², d/dx(-5x) = -5, and d/dx(7) = 0.',
        },
        {
          question: 'What is the limit of (sin x) / x as x approaches 0?',
          options: ['0', '1', 'Infinity', 'Undefined'],
          correctAnswer: 1,
          explanation: 'Standard trigonometric limit: lim (x->0) sin(x)/x = 1.',
        },
        {
          question: 'Which theorem states that if f is continuous on [a,b] and differentiable on (a,b), there exists c such that f\'(c) = (f(b)-f(a))/(b-a)?',
          options: ['Intermediate Value Theorem', 'Mean Value Theorem', 'Rolle\'s Theorem', 'Fundamental Theorem of Calculus'],
          correctAnswer: 1,
          explanation: 'The Mean Value Theorem connects average rate of change with instantaneous rate of change.',
        },
      ],
    });

    const csFlashcards = await Quiz.create({
      title: 'Essential Data Structures & Algorithms Flashcards',
      description: 'Master time complexities and key abstract data types.',
      group: csGroup._id,
      createdBy: bob._id,
      type: 'flashcard',
      flashcards: [
        {
          front: 'What is the average time complexity of searching in a Hash Map?',
          back: 'O(1) Constant Time (assuming uniform hash distribution).',
          hint: 'Think about direct address lookup.',
        },
        {
          front: 'What data structure is used to implement Breadth-First Search (BFS)?',
          back: 'Queue (FIFO - First In, First Out).',
          hint: 'Level-by-level traversal.',
        },
        {
          front: 'What is the worst-case time complexity of QuickSort?',
          back: 'O(n²) occurs when the chosen pivot is always the smallest or greatest element.',
          hint: 'Think about poorly balanced partitions.',
        },
      ],
    });

    // 5. Initial Quiz Attempts for Leaderboard
    await QuizAttempt.create([
      {
        quiz: calcQuiz._id,
        group: calculusGroup._id,
        user: alice._id,
        score: 3,
        totalQuestions: 3,
        accuracyPercentage: 100,
        timeSpentSeconds: 45,
      },
      {
        quiz: calcQuiz._id,
        group: calculusGroup._id,
        user: bob._id,
        score: 2,
        totalQuestions: 3,
        accuracyPercentage: 67,
        timeSpentSeconds: 62,
      },
    ]);

    // 6. Create Verified Tutors in Marketplace
    const tutorProfileSarah = await Tutor.create({
      user: tutorSarah._id,
      name: tutorSarah.name,
      headline: 'MIT Graduate in Applied Math & Differential Equations',
      bio: '5+ years tutoring STEM students with intuitive problem-solving methods and exam strategies. Proven track record helping students ace AP/College Calculus.',
      subjects: ['Calculus', 'Linear Algebra', 'Differential Equations', 'Physics'],
      hourlyRate: 45,
      rating: 4.9,
      reviewsCount: 38,
      isVerified: true,
      avatar: tutorSarah.avatar,
      availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
      availableSlots: ['09:00 - 10:00', '11:00 - 12:00', '14:00 - 15:00', '16:00 - 17:00'],
    });

    const tutorProfileDavid = await Tutor.create({
      user: tutorDavid._id,
      name: tutorDavid.name,
      headline: 'Ex-Google Software Engineer & Stanford CS Mentor',
      bio: 'Specializing in Technical Interviews, Algorithms, System Design, and Full-Stack JavaScript/React. Over 100+ students placed in top tech companies.',
      subjects: ['Data Structures', 'Algorithms', 'JavaScript / React', 'System Design'],
      hourlyRate: 55,
      rating: 5.0,
      reviewsCount: 52,
      isVerified: true,
      avatar: tutorDavid.avatar,
      availableDays: ['Tuesday', 'Thursday', 'Saturday', 'Sunday'],
      availableSlots: ['10:00 - 11:00', '13:00 - 14:00', '15:00 - 16:00', '18:00 - 19:00'],
    });

    // 7. Create a Sample Confirmed Booking
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    await Booking.create({
      tutor: tutorProfileSarah._id,
      student: alice._id,
      date: tomorrowStr,
      timeSlot: '14:00 - 15:00',
      subject: 'Calculus Review: Multivariable chain rule',
      notes: 'Need assistance preparing for midterm exam #2.',
      hourlyRate: tutorProfileSarah.hourlyRate,
      status: 'confirmed',
      meetingRoomId: `session-sarah-${Date.now().toString().slice(-6)}`,
    });

    console.log(' Demo data successfully seeded for StudySync!');
  } catch (error) {
    console.error(' Error seeding database:', error);
  }
}

module.exports = { seedDatabase };
