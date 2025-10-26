# Google OAuth 2.0 Setup Guide

This guide will help you set up Google OAuth 2.0 authentication for Tinvest.

## Step 1: Google Cloud Platform Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Go to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**

### Configure OAuth Consent Screen (if not done already)

1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** user type
3. Fill in the required information:
   - App name: `Tinvest`
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes: `email` and `profile`
5. Save and continue

### Create OAuth 2.0 Client ID

1. Application type: **Web application**
2. Name: `Tinvest Web Client`

3. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   http://localhost:5001
   ```

4. **Authorized redirect URIs:**
   ```
   http://localhost:3000
   http://localhost:5001/api/auth/google/callback
   ```

5. Click **Create**
6. Copy your **Client ID** and **Client Secret**

## Step 2: Environment Variables Setup

### Frontend (.env in /frontend folder)

Create a `.env` file in the `frontend` directory:

```env
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
VITE_STOCK_API_KEY=demo
```

### Backend (.env in /backend folder)

Update the `.env` file in the `backend` directory:

```env
PORT=5001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development

# Google OAuth
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
```

## Step 3: Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Or install separately
cd frontend && npm install
cd ../backend && npm install
```

## Step 4: Start the Application

```bash
# From the root directory
npm run dev
```

This will start:
- Frontend at `http://localhost:3000`
- Backend at `http://localhost:5001`

## Step 5: Test the OAuth Flow

1. Navigate to `http://localhost:3000`
2. Click the "Sign in with Google" button
3. Select your Google account
4. You should be redirected to the dashboard

## Troubleshooting

### "redirect_uri_mismatch" Error

Make sure your redirect URIs in Google Cloud Console exactly match:
- `http://localhost:3000`
- `http://localhost:5001/api/auth/google/callback`

### "Invalid Client" Error

- Check that your Client ID and Client Secret are correct
- Make sure you've added them to the `.env` files
- Restart both frontend and backend servers after adding env variables

### CORS Issues

The backend is configured to accept requests from any origin in development. If you still have CORS issues, check that your backend is running on port 5001.

## Production Deployment

When deploying to production:

1. Add your production URLs to Google Cloud Console:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com`, `https://api.yourdomain.com/api/auth/google/callback`

2. Update your environment variables with production values

3. Make sure to use HTTPS in production (required by Google)

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique JWT secrets in production
- Regularly rotate your secrets
- Consider implementing refresh tokens for long-lived sessions
- Add rate limiting to prevent abuse

