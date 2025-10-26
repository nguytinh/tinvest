import express, { Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

interface WatchlistItem extends RowDataPacket {
  id: number;
  user_id: number;
  symbol: string;
  name: string;
  is_favorite: boolean;
  added_at: Date;
}

// Middleware to verify JWT token
const authenticateToken = (req: any, res: Response, next: any): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ message: 'Access token required' });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err: any, user: any) => {
    if (err) {
      res.status(403).json({ message: 'Invalid or expired token' });
      return;
    }
    req.user = user;
    next();
  });
};

// Get user's watchlist
router.get('/', authenticateToken, async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;

    const [rows] = await pool.query<WatchlistItem[]>(
      'SELECT * FROM watchlist WHERE user_id = ? ORDER BY is_favorite DESC, added_at DESC',
      [userId]
    );

    res.json({
      watchlist: rows.map(item => ({
        symbol: item.symbol,
        name: item.name,
        isFavorite: item.is_favorite,
        addedAt: item.added_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add stock to watchlist
router.post('/add', authenticateToken, async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { symbol, name } = req.body;

    if (!symbol || !name) {
      res.status(400).json({ message: 'Symbol and name are required' });
      return;
    }

    // Check if already in watchlist
    const [existing] = await pool.query<WatchlistItem[]>(
      'SELECT * FROM watchlist WHERE user_id = ? AND symbol = ?',
      [userId, symbol]
    );

    if (existing.length > 0) {
      res.status(400).json({ message: 'Stock already in watchlist' });
      return;
    }

    // Add to watchlist
    await pool.query<ResultSetHeader>(
      'INSERT INTO watchlist (user_id, symbol, name, is_favorite) VALUES (?, ?, ?, FALSE)',
      [userId, symbol, name]
    );

    res.status(201).json({ message: 'Stock added to watchlist' });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle favorite status
router.put('/favorite/:symbol', authenticateToken, async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { symbol } = req.params;
    const { isFavorite } = req.body;

    if (typeof isFavorite !== 'boolean') {
      res.status(400).json({ message: 'isFavorite must be a boolean' });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE watchlist SET is_favorite = ? WHERE user_id = ? AND symbol = ?',
      [isFavorite, userId, symbol]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Stock not found in watchlist' });
      return;
    }

    res.json({ message: `Stock ${isFavorite ? 'favorited' : 'unfavorited'} successfully` });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove stock from watchlist
router.delete('/remove/:symbol', authenticateToken, async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { symbol } = req.params;

    await pool.query(
      'DELETE FROM watchlist WHERE user_id = ? AND symbol = ?',
      [userId, symbol]
    );

    res.json({ message: 'Stock removed from watchlist' });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

