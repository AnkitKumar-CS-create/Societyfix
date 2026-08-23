import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, apartmentNumber, block } = req.body;

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'Email is already registered.' });
      return;
    }

    // 2. Hash the password securely
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Create the user in the database (Default role is RESIDENT)
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        apartmentNumber,
        block,
      },
    });

    // 4. Generate JWT Token
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign({ userId: newUser.id, role: newUser.role }, secret, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    // 2. Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    // 3. Generate JWT Token
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // req.user comes from our auth middleware!
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, apartmentNumber: true, block: true } // Don't send password hash back!
    });

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching profile.' });
  }
};