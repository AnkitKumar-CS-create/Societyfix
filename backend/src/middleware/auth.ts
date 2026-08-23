import type { Request, Response, NextFunction } from 'express';
import jwt = require('jsonwebtoken');
import type { JwtPayload } from 'jsonwebtoken';

// This extends the standard Express request to include our custom user data
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

// 1. General Authentication (Requires a valid login)
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  
  // Strict check to ensure the token actually exists after splitting
  if (!token) {
    res.status(401).json({ message: 'Authentication required. Malformed token.' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    // Safely decode and cast
    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    // Ensure the payload is an object and has our required fields
    if (!decoded || typeof decoded === 'string' || !decoded.userId || !decoded.role) {
      res.status(401).json({ message: 'Invalid token structure.' });
      return;
    }
    
    // Attach the user info to the request
    req.user = {
      userId: decoded.userId as string,
      role: decoded.role as string
    };
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token.' });
    return;
  }
};

// 2. Admin Only Access
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ message: 'Access denied. Admins only.' });
    return;
  }
  next();
};

// 3. Resident Only Access
export const requireResident = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'RESIDENT') {
    res.status(403).json({ message: 'Access denied. Residents only.' });
    return;
  }
  next();
};
