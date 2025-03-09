const Workspace = require('../models/Workspace');
const Course = require('../models/Course');

// @desc    Get all workspaces for the logged-in user
// @route   GET /api/workspaces
// @access  Private
const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ user: req.user.id })
      .populate('course', 'title code')
      .sort({ createdAt: -1 });
    res.status(200).json(workspaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get workspaces by course
// @route   GET /api/workspaces/course/:courseId
// @access  Private
const getWorkspacesByCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if the course belongs to the user
    if (course.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this course' });
    }

    const workspaces = await Workspace.find({
      course: req.params.courseId,
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json(workspaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single workspace
// @route   GET /api/workspaces/:id
// @access  Private
const getWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id).populate('course', 'title code');

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if the workspace belongs to the user
    if (workspace.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this workspace' });
    }

    res.status(200).json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new workspace
// @route   POST /api/workspaces
// @access  Private
const createWorkspace = async (req, res) => {
  try {
    const { name, description, course, color, icon } = req.body;

    // Check if the course exists and belongs to the user
    const courseExists = await Course.findById(course);

    if (!courseExists) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (courseExists.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to create a workspace for this course' });
    }

    const workspace = await Workspace.create({
      name,
      description,
      course,
      user: req.user.id,
      color: color || '#3498db',
      icon: icon || 'book',
    });

    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a workspace
// @route   PUT /api/workspaces/:id
// @access  Private
const updateWorkspace = async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;

    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if the workspace belongs to the user
    if (workspace.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this workspace' });
    }

    workspace.name = name || workspace.name;
    workspace.description = description || workspace.description;
    workspace.color = color || workspace.color;
    workspace.icon = icon || workspace.icon;

    const updatedWorkspace = await workspace.save();

    res.status(200).json(updatedWorkspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a workspace
// @route   DELETE /api/workspaces/:id
// @access  Private
const deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if the workspace belongs to the user
    if (workspace.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this workspace' });
    }

    await workspace.deleteOne();

    res.status(200).json({ message: 'Workspace removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWorkspaces,
  getWorkspacesByCourse,
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
}; 