const express = require('express');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes below this line are protected and require authentication
router.use(protect);

// GET all users - accessible by all authenticated users
router.route('/').get(getUsers);

// POST new user - accessible only by admin
router.route('/').post(authorize('admin'), createUser);

// GET, PUT, DELETE user by ID - accessible by admin or the user themselves
router.route('/:id').get(getUserById);
router.route('/:id').put(updateUser);
router.route('/:id').delete(authorize('admin'), deleteUser);

module.exports = router; 