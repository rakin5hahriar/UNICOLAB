const WorkspaceItem = require('../models/WorkspaceItem');
const Workspace = require('../models/Workspace');
const mongoose = require('mongoose');

// @desc    Get all workspace items for a workspace
// @route   GET /api/workspace-items/workspace/:workspaceId
// @access  Private
const getWorkspaceItems = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if the workspace belongs to the user
    if (workspace.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this workspace' });
    }

    const workspaceItems = await WorkspaceItem.find({
      workspace: req.params.workspaceId,
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json(workspaceItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single workspace item
// @route   GET /api/workspace-items/:id
// @access  Private
const getWorkspaceItem = async (req, res) => {
  try {
    const workspaceItem = await WorkspaceItem.findById(req.params.id)
      .populate('workspace', 'name')
      .populate('course', 'title code');

    if (!workspaceItem) {
      return res.status(404).json({ message: 'Workspace item not found' });
    }

    // Check if the workspace item belongs to the user
    if (workspaceItem.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this item' });
    }

    res.status(200).json(workspaceItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new workspace item
// @route   POST /api/workspace-items
// @access  Private
const createWorkspaceItem = async (req, res) => {
  try {
    const workspaceId = req.body.workspace;
    
    // Validate required fields
    if (!req.body.title) {
      return res.status(400).json({
        message: 'Title is required',
        details: 'Please provide a title for the workspace item.'
      });
    }
    
    // Validate workspaceId is a valid ObjectId
    if (!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({ 
        message: 'Invalid workspace ID format',
        details: 'The provided workspace ID is either missing or not in the correct format.'
      });
    }
    
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ 
        message: 'Workspace not found',
        details: 'The specified workspace does not exist.'
      });
    }

    // Check if the workspace belongs to the user
    if (workspace.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Not authorized',
        details: 'You are not authorized to add items to this workspace.'
      });
    }

    // Create the workspace item with all possible fields
    const workspaceItem = await WorkspaceItem.create({
      ...req.body,
      user: req.user.id,
      course: workspace.course // Ensure course ID is set from workspace
    });

    // Return the created item
    res.status(201).json(workspaceItem);
  } catch (error) {
    console.error('Error creating workspace item:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        details: error.message
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid ID format',
        details: `The provided ID for ${error.path} is not in the correct format.`
      });
    }
    
    res.status(500).json({ 
      message: 'Server error',
      details: 'An error occurred while creating the workspace item.'
    });
  }
};

// @desc    Update a workspace item
// @route   PUT /api/workspaces/items/:id
// @access  Private
const updateWorkspaceItem = async (req, res) => {
  try {
    // Validate item ID
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        message: 'Invalid item ID format',
        details: 'The provided item ID is either missing or not in the correct format.'
      });
    }

    const {
      title,
      type,
      content,
      fileUrl,
      fileName,
      fileType,
      embedUrl,
      documentUrl,
      documentProvider,
      dueDate,
      completed,
      priority,
      tags,
      checklistItems,
      reminderEnabled,
      reminderDate,
      reminderTime,
      status,
      completionPercentage
    } = req.body;

    const workspaceItem = await WorkspaceItem.findById(req.params.id);

    if (!workspaceItem) {
      return res.status(404).json({ message: 'Workspace item not found' });
    }

    // Check if the workspace item belongs to the user
    if (workspaceItem.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }

    // Update all fields
    workspaceItem.title = title || workspaceItem.title;
    workspaceItem.type = type || workspaceItem.type;
    workspaceItem.content = content !== undefined ? content : workspaceItem.content;
    workspaceItem.fileUrl = fileUrl || workspaceItem.fileUrl;
    workspaceItem.fileName = fileName || workspaceItem.fileName;
    workspaceItem.fileType = fileType || workspaceItem.fileType;
    workspaceItem.embedUrl = embedUrl || workspaceItem.embedUrl;
    workspaceItem.documentUrl = documentUrl || workspaceItem.documentUrl;
    workspaceItem.documentProvider = documentProvider || workspaceItem.documentProvider;
    workspaceItem.dueDate = dueDate || workspaceItem.dueDate;
    workspaceItem.completed = completed !== undefined ? completed : workspaceItem.completed;
    workspaceItem.priority = priority || workspaceItem.priority;
    workspaceItem.tags = tags || workspaceItem.tags;
    workspaceItem.checklistItems = checklistItems || workspaceItem.checklistItems;
    workspaceItem.reminderEnabled = reminderEnabled !== undefined ? reminderEnabled : workspaceItem.reminderEnabled;
    workspaceItem.reminderDate = reminderDate || workspaceItem.reminderDate;
    workspaceItem.reminderTime = reminderTime || workspaceItem.reminderTime;
    workspaceItem.status = status || workspaceItem.status;
    workspaceItem.completionPercentage = completionPercentage !== undefined ? completionPercentage : workspaceItem.completionPercentage;

    const updatedWorkspaceItem = await workspaceItem.save();

    res.status(200).json(updatedWorkspaceItem);
  } catch (error) {
    console.error('Error updating workspace item:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid ID format',
        details: `The provided ID for ${error.path} is not in the correct format.`
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        details: error.message
      });
    }
    
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a workspace item
// @route   DELETE /api/workspaces/items/:id
// @access  Private
const deleteWorkspaceItem = async (req, res) => {
  try {
    const workspaceItem = await WorkspaceItem.findById(req.params.id);

    if (!workspaceItem) {
      return res.status(404).json({ message: 'Workspace item not found' });
    }

    // Check if the workspace item belongs to the user
    if (workspaceItem.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }

    await workspaceItem.deleteOne();

    res.status(200).json({ message: 'Workspace item removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWorkspaceItems,
  getWorkspaceItem,
  createWorkspaceItem,
  updateWorkspaceItem,
  deleteWorkspaceItem,
}; 