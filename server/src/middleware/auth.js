import jwt from 'jsonwebtoken';
import { store, isDbConnected } from '../config/db.js';
import User from '../models/User.js';

export async function protect(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smart_campus_super_secret_jwt_key_2026_xyz!');

    if (isDbConnected()) {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'User belonging to token no longer exists.' });
      }
      req.user = user;
    } else {
      const user = store.findUserById(decoded.id);
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found in system.' });
      }
      const safeUser = { ...user };
      delete safeUser.password;
      req.user = safeUser;
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.', error: err.message });
  }
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles: [${roles.join(', ')}]. Your role is '${req.user?.role}'.`,
      });
    }
    next();
  };
}
