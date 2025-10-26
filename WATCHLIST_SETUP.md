# Per-User Watchlist Setup Guide

## Overview
Each user now has their own personalized watchlist. The admin account keeps the original 28-stock watchlist, while new users start with an empty watchlist.

---

## Step 1: Populate Admin Watchlist

### 1.1 Find Your Admin User ID
Login to **phpMyAdmin** and run:
```sql
SELECT id, email FROM users;
```

Find the admin user (e.g., `admin@tinvest.com`) and note the `id` (probably `1`).

### 1.2 Run the Migration Script
Open the file `MIGRATE_WATCHLIST.sql` in this directory.

**If your admin user ID is NOT 1**, edit the file and replace all instances of `(1,` with `(YOUR_ADMIN_ID,`.

Then in phpMyAdmin, select your database and go to the **SQL** tab. Copy and paste the contents of `MIGRATE_WATCHLIST.sql` and click **Go**.

### 1.3 Verify
Run this query to confirm:
```sql
SELECT COUNT(*) as total_stocks FROM watchlist WHERE user_id = 1;
```

You should see **28 stocks**.

---

## Step 2: Restart Backend Server

The backend now includes the `/api/watchlist` routes for per-user watchlists.

```bash
cd backend
npm run dev
```

If it's already running, stop it (`Ctrl+C`) and restart.

---

## Step 3: Test the Functionality

### Admin User Test
1. **Login** with admin credentials
2. Go to **Watchlists** page
3. You should see all 28 stocks from your watchlist
4. Click **Refresh** to load real-time prices

### New User Test
1. **Sign up** with a new account
2. Go to **Watchlists** page
3. You should see **no stocks** (empty watchlist)
4. New users will need a UI to add/remove stocks (future feature)

---

## API Endpoints

### Get User Watchlist
```
GET /api/watchlist
Headers: Authorization: Bearer <jwt_token>
```

Returns:
```json
{
  "watchlist": [
    {
      "symbol": "NVDA",
      "name": "NVIDIA Corporation",
      "addedAt": "2025-10-20T12:00:00.000Z"
    }
  ]
}
```

### Add Stock to Watchlist
```
POST /api/watchlist/add
Headers: Authorization: Bearer <jwt_token>
Body: {
  "symbol": "AAPL",
  "name": "Apple Inc."
}
```

### Remove Stock from Watchlist
```
DELETE /api/watchlist/remove/:symbol
Headers: Authorization: Bearer <jwt_token>
```

---

## What Changed

### Backend
- ✅ New route: `/backend/src/routes/watchlist.ts`
- ✅ JWT authentication middleware
- ✅ GET, POST, DELETE endpoints for watchlist management
- ✅ Integrated with main server

### Frontend
- ✅ Watchlist page now fetches from API instead of hardcoded list
- ✅ Auth token included in requests
- ✅ Empty state handling for new users
- ✅ Login page stores JWT token
- ✅ Signup page stores JWT token

### Database
- ✅ Admin watchlist populated with 28 stocks
- ✅ New users start with empty watchlists
- ✅ Per-user isolation maintained

---

## Future Enhancements

Consider adding:
- 🔧 UI to add/remove stocks from watchlist
- 🔧 Search functionality to find stocks
- 🔧 Drag-and-drop reordering
- 🔧 Watchlist categories/folders
- 🔧 Import/export watchlist functionality
- 🔧 Share watchlists with other users

---

## Troubleshooting

### "No auth token found"
- Make sure you're logged in
- Check that `localStorage.getItem('token')` returns a value in browser console

### "Failed to fetch watchlist"
- Backend must be running on port 5001
- Check CORS settings allow `http://localhost:3000`
- Verify JWT secret matches in `.env`

### "Empty watchlist for admin"
- Run `MIGRATE_WATCHLIST.sql` in phpMyAdmin
- Verify user ID matches in the SQL script
- Check `SELECT * FROM watchlist WHERE user_id = 1;`

---

## Summary

🎉 **Watchlists are now per-user!**
- Admin keeps their 28-stock watchlist
- New users start fresh
- Each user's data is isolated
- Ready for future watchlist management features

