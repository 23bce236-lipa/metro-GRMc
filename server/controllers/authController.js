const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const signToken = (user) => jwt.sign(
  {
    sub: user._id.toString(),
    email: user.email,
    role: user.role
  },
  process.env.JWT_SECRET || 'dev-secret-change-me',
  { expiresIn: '7d' }
);

exports.register = async (req, res, next) => {
  try {
    const { email, password, role = 'Citizen' } = req.body || {};

    if (!email || !password) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Email and password are required.');
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const allowedRoles = ['Citizen', 'Tech', 'Admin'];

    if (!allowedRoles.includes(role)) {
      throw new ApiError(400, 'INVALID_ROLE', 'The selected role is invalid.');
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      throw new ApiError(409, 'USER_EXISTS', 'A user with that email already exists.');
    }

    const user = await User.create({
      email: cleanEmail,
      password,
      role
    });

    const token = signToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Email and password are required.');
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'The supplied email or password is incorrect.');
    }

    const token = signToken(user);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};
