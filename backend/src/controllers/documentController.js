const Document = require('../models/Document');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get all documents for a user (owned and shared)
 * @route   GET /api/documents
 * @access  Private
 */
const getDocuments = asyncHandler(async (req, res) => {
  // Find documents where user is the owner
  const ownedDocuments = await Document.find({ owner: req.user.id })
    .sort({ updatedAt: -1 })
    .populate('owner', 'name email')
    .populate('shared.user', 'name email');

  // Find documents shared with the user
  const sharedDocuments = await Document.find({ 'shared.user': req.user.id })
    .sort({ updatedAt: -1 })
    .populate('owner', 'name email')
    .populate('shared.user', 'name email');

  res.status(200).json({
    owned: ownedDocuments,
    shared: sharedDocuments
  });
});

/**
 * @desc    Get a single document by ID
 * @route   GET /api/documents/:id
 * @access  Private
 */
const getDocumentById = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id)
    .populate('owner', 'name email')
    .populate('shared.user', 'name email');

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check if user has access to this document
  const access = document.hasAccess(req.user.id);
  if (!access) {
    res.status(403);
    throw new Error('You do not have permission to access this document');
  }

  res.status(200).json({
    ...document.toObject(),
    accessLevel: access
  });
});

/**
 * @desc    Create a new document
 * @route   POST /api/documents
 * @access  Private
 */
const createDocument = asyncHandler(async (req, res) => {
  const { name, content } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Please provide a name for the document');
  }

  const document = await Document.create({
    name,
    content: content || '',
    owner: req.user.id,
    version: 1
  });

  res.status(201).json(document);
});

/**
 * @desc    Update a document
 * @route   PUT /api/documents/:id
 * @access  Private
 */
const updateDocument = asyncHandler(async (req, res) => {
  const { name, content, version } = req.body;
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check if user has access to edit this document
  const access = document.hasAccess(req.user.id);
  if (!access || access === 'view') {
    res.status(403);
    throw new Error('You do not have permission to edit this document');
  }

  // Simple version check for conflict resolution
  if (version && document.version > version) {
    res.status(409);
    throw new Error('Document has been modified by another user');
  }

  // Update document fields
  if (name) document.name = name;
  if (content !== undefined) {
    document.content = content;
    document.version += 1;
  }
  document.lastModified = Date.now();

  const updatedDocument = await document.save();

  res.status(200).json(updatedDocument);
});

/**
 * @desc    Delete a document
 * @route   DELETE /api/documents/:id
 * @access  Private
 */
const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Only the owner can delete a document
  if (document.owner.toString() !== req.user.id) {
    res.status(403);
    throw new Error('You do not have permission to delete this document');
  }

  await document.remove();

  res.status(200).json({ message: 'Document deleted' });
});

/**
 * @desc    Share a document with another user
 * @route   POST /api/documents/:id/share
 * @access  Private
 */
const shareDocument = asyncHandler(async (req, res) => {
  const { email, access } = req.body;

  if (!email || !access) {
    res.status(400);
    throw new Error('Please provide an email and access level');
  }

  // Find the document
  const document = await Document.findById(req.params.id);
  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Only the owner can share a document
  if (document.owner.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Only the owner can share this document');
  }

  // Find the user to share with
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Don't share with the owner
  if (user._id.toString() === req.user.id) {
    res.status(400);
    throw new Error('You cannot share a document with yourself');
  }

  // Check if already shared with this user
  const alreadyShared = document.shared.find(
    share => share.user.toString() === user._id.toString()
  );

  if (alreadyShared) {
    // Update access level if already shared
    alreadyShared.access = access;
  } else {
    // Add new share
    document.shared.push({
      user: user._id,
      access
    });
  }

  await document.save();

  res.status(200).json({
    message: `Document shared with ${user.email}`,
    document
  });
});

/**
 * @desc    Remove share access for a user
 * @route   DELETE /api/documents/:id/share/:userId
 * @access  Private
 */
const removeShare = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Only the owner can remove share access
  if (document.owner.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Only the owner can modify sharing settings');
  }

  // Remove the user from shared list
  document.shared = document.shared.filter(
    share => share.user.toString() !== req.params.userId
  );

  await document.save();

  res.status(200).json({
    message: 'Share access removed',
    document
  });
});

module.exports = {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  removeShare
}; 