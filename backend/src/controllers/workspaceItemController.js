const WorkspaceItem = require('../models/WorkspaceItem');
const Workspace = require('../models/Workspace');

// @desc    Get all workspace items for a workspace
// @route   GET /api/workspaces/:workspaceId/items
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
// @route   GET /api/workspaces/items/:id
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
// @route   POST /api/workspaces/:workspaceId/items
// @access  Private
const createWorkspaceItem = async (req, res) => {
  try {
    const {
      title,
      type,
      content,
      fileUrl,
      fileName,
      fileType,
      dueDate,
      priority,
    } = req.body;

    const workspace = await Workspace.findById(req.params.workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if the workspace belongs to the user
    if (workspace.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to add items to this workspace' });
    }

    const workspaceItem = await WorkspaceItem.create({
      title,
      type,
      content,
      fileUrl,
      fileName,
      fileType,
      workspace: req.params.workspaceId,
      user: req.user.id,
      course: workspace.course,
      dueDate,
      priority,
    });

    res.status(201).json(workspaceItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a workspace item
// @route   PUT /api/workspaces/items/:id
// @access  Private
const updateWorkspaceItem = async (req, res) => {
  try {
    const {
      title,
      type,
      content,
      fileUrl,
      fileName,
      fileType,
      dueDate,
      completed,
      priority,
    } = req.body;

    const workspaceItem = await WorkspaceItem.findById(req.params.id);

    if (!workspaceItem) {
      return res.status(404).json({ message: 'Workspace item not found' });
    }

    // Check if the workspace item belongs to the user
    if (workspaceItem.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }

    workspaceItem.title = title || workspaceItem.title;
    workspaceItem.type = type || workspaceItem.type;
    workspaceItem.content = content !== undefined ? content : workspaceItem.content;
    workspaceItem.fileUrl = fileUrl || workspaceItem.fileUrl;
    workspaceItem.fileName = fileName || workspaceItem.fileName;
    workspaceItem.fileType = fileType || workspaceItem.fileType;
    workspaceItem.dueDate = dueDate || workspaceItem.dueDate;
    workspaceItem.completed = completed !== undefined ? completed : workspaceItem.completed;
    workspaceItem.priority = priority || workspaceItem.priority;

    const updatedWorkspaceItem = await workspaceItem.save();

    res.status(200).json(updatedWorkspaceItem);
  } catch (error) {
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