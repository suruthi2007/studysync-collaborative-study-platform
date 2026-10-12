const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Resource = require('../models/Resource');
const Group = require('../models/Group');
const { protect } = require('../middleware/authMiddleware');
const { uploadFile, uploadsDir } = require('../config/storage');

// Multer temporary local destination before S3 or local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|png|jpg|jpeg|gif|webp|txt|doc|docx|ppt|pptx/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only document and image files (PDF, images, docs) are allowed.'));
  },
});

// @route   POST /api/resources/upload
// @desc    Upload resource to AWS S3 (or local fallback) and link to group
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    const { title, groupId } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a file to upload' });
    }
    if (!groupId) {
      return res.status(400).json({ success: false, message: 'Group ID is required' });
    }

    // Verify group membership
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Study group not found' });
    }

    const isMember = group.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Only group members can upload resources' });
    }

    // Upload via S3 or local storage engine
    const fileResult = await uploadFile(req.file);

    const resource = await Resource.create({
      title: title || req.file.originalname,
      fileName: fileResult.fileName,
      fileUrl: fileResult.fileUrl,
      fileType: fileResult.fileType,
      fileSize: fileResult.fileSize,
      storageType: fileResult.storageType,
      group: groupId,
      uploadedBy: req.user._id,
    });

    const populatedResource = await Resource.findById(resource._id)
      .populate('uploadedBy', 'name email avatar');

    res.status(201).json({ success: true, resource: populatedResource });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/resources/group/:groupId
// @desc    Get all resources for a specific study group (member only)
router.get('/group/:groupId', protect, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Verify membership
    const isMember = group.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied: Only members can view files' });
    }

    const resources = await Resource.find({ group: groupId })
      .populate('uploadedBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, resources });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/resources/:id
// @desc    Delete a resource (uploader or group creator only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).populate('group');
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const isUploader = resource.uploadedBy.toString() === req.user._id.toString();
    const isCreator = resource.group && resource.group.createdBy.toString() === req.user._id.toString();

    if (!isUploader && !isCreator) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this file' });
    }

    await resource.deleteOne();
    res.json({ success: true, message: 'Resource removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
