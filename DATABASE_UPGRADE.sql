-- Upgrade database for watchlist features
-- Run this in phpMyAdmin SQL tab

-- Add favorite column to existing watchlist table
ALTER TABLE watchlist 
ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE AFTER name;

-- Create index for better performance on user_id and favorite sorting
CREATE INDEX idx_watchlist_user_favorite ON watchlist(user_id, is_favorite DESC);

-- Update existing admin watchlist items to not be favorites by default
UPDATE watchlist SET is_favorite = FALSE WHERE user_id = 1;

-- Verify the changes
DESCRIBE watchlist;
SELECT COUNT(*) as total_items FROM watchlist;
