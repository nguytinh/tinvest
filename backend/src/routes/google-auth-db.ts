import express, { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

interface User extends RowDataPacket {
  id: number;
  email: string;
  password: string | null;
  google_id: string | null;
  name: string | null;
  picture: string | null;
  created_at: Date;
}

// Google OAuth login endpoint
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      res.status(400).json({ message: 'No credential provided' });
      return;
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      res.status(400).json({ message: 'Invalid token' });
      return;
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      res.status(400).json({ message: 'Email not provided by Google' });
      return;
    }

    // Check if user exists
    const [rows] = await pool.query<User[]>(
      'SELECT * FROM users WHERE google_id = ? OR email = ?',
      [googleId, email]
    );

    let user: User;

    if (rows.length === 0) {
      // Create new user
      const [result] = await pool.query<ResultSetHeader>(
        'INSERT INTO users (email, google_id, name, picture) VALUES (?, ?, ?, ?)',
        [email, googleId, name, picture]
      );

      // Fetch the newly created user
      const [newUserRows] = await pool.query<User[]>(
        'SELECT * FROM users WHERE id = ?',
        [result.insertId]
      );
      user = newUserRows[0];
    } else {
      user = rows[0];
      
      // Update google_id if user exists but doesn't have it
      if (!user.google_id) {
        await pool.query(
          'UPDATE users SET google_id = ?, name = ?, picture = ? WHERE id = ?',
          [googleId, name, picture, user.id]
        );
        user.google_id = googleId;
        user.name = name || null;
        user.picture = picture || null;
      }
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, googleId: user.google_id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

