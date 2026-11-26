import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { store, isDbConnected } from '../config/db.js';
import User from '../models/User.js';

function generateToken(id, role) {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'smart_campus_super_secret_jwt_key_2026_xyz!',
    { expiresIn: '7d' }
  );
}

export async function register(req, res) {
  try {
    const { name, email, password, department, phone, studentId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    if (isDbConnected()) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role: 'student', // Public registration is strictly for students
        department: department || 'General',
        phone: phone || '',
        studentId: studentId || '',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      });

      const token = generateToken(user._id, user.role);
      const safeUser = user.toObject();
      delete safeUser.password;

      return res.status(201).json({
        success: true,
        message: 'Student account created successfully!',
        token,
        user: safeUser,
      });
    } else {
      const existing = store.findUserByEmail(email);
      if (existing) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = store.createUser({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'student',
        department: department || 'General',
        phone: phone || '',
        studentId: studentId || '',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      });

      const token = generateToken(user._id, user.role);
      const safeUser = { ...user };
      delete safeUser.password;

      return res.status(201).json({
        success: true,
        message: 'Student account created successfully!',
        token,
        user: safeUser,
      });
    }
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Registration failed.', error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    let user = null;
    let isMatch = false;

    if (isDbConnected()) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        isMatch = await user.comparePassword(password);
      }
    } else {
      user = store.findUserByEmail(email);
      if (user) {
        isMatch = await bcrypt.compare(password, user.password);
      }
    }

    if (!user || !isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact campus admin.' });
    }

    const token = generateToken(user._id || user.id, user.role);
    const safeUser = isDbConnected() ? user.toObject() : { ...user };
    delete safeUser.password;

    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Login failed.', error: err.message });
  }
}

export async function getMe(req, res) {
  return res.json({
    success: true,
    user: req.user,
  });
}

export async function demoLogin(req, res) {
  try {
    const { role } = req.body;
    let targetEmail = 'mukesh.patel@campus.edu'; // default student

    if (role === 'admin') targetEmail = 'admin@campus.edu';
    else if (role === 'staff') targetEmail = 'rajesh.kumar@campus.edu';
    else if (role === 'staff_civil') targetEmail = 'anita.sharma@campus.edu';
    else if (role === 'staff_it') targetEmail = 'vikram.singh@campus.edu';
    else if (role === 'student_priya') targetEmail = 'priya.verma@campus.edu';

    let user = null;
    if (isDbConnected()) {
      user = await User.findOne({ email: targetEmail });
    } else {
      user = store.findUserByEmail(targetEmail);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: `Demo account for role '${role}' not found.` });
    }

    const token = generateToken(user._id || user.id, user.role);
    const safeUser = isDbConnected() ? user.toObject() : { ...user };
    delete safeUser.password;

    return res.json({
      success: true,
      message: `Switched into ${user.role.toUpperCase()} account as ${user.name}!`,
      token,
      user: safeUser,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Demo login failed.', error: err.message });
  }
}

export async function updateProfile(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const { name, avatar, phone, department, studentId } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;
    if (phone !== undefined) updates.phone = phone;
    if (department) updates.department = department;
    if (studentId) updates.studentId = studentId;

    let updatedUser = null;

    if (isDbConnected()) {
      updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
      if (!updatedUser) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      return res.json({
        success: true,
        message: 'Profile updated successfully!',
        user: updatedUser,
      });
    } else {
      updatedUser = store.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      const safe = { ...updatedUser };
      delete safe.password;
      return res.json({
        success: true,
        message: 'Profile updated successfully!',
        user: safe,
      });
    }
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile.', error: err.message });
  }
}
