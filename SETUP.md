# Setup Instructions

## 1. Create .env File

Create a `.env` file in the project root with your API base URL:

```bash
# .env
VITE_API_BASE_URL=http://localhost:8000
```

**Important:** After creating/updating `.env`, restart your dev server:
```bash
npm run dev
```

## 2. Set Developer JWT Token

The API requires authentication. You need to set the developer JWT token after login.

### Option A: Set via Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Run:
```javascript
localStorage.setItem('skrivly_developer_jwt', 'YOUR_JWT_TOKEN_HERE')
```
4. Refresh the page

### Option B: Set via Code

After login, call:
```typescript
import { setDeveloperJWT } from './services/api'
setDeveloperJWT('your-token-here')
```

## 3. Verify Setup

1. Check that `.env` file exists with correct `VITE_API_BASE_URL`
2. Check browser console for any errors
3. Check Network tab to see if requests include `Authorization: Bearer <token>` header
4. Verify the API URL is correct (should be `http://localhost:8000/api/v1/...`)

## Troubleshooting

### 400 Bad Request Error

**Most common causes:**
1. **Missing JWT Token** - Set the developer JWT token in localStorage
2. **Wrong API URL** - Check `.env` file has correct `VITE_API_BASE_URL`
3. **Server not running** - Ensure backend API is running on port 8000

**To check:**
- Open browser DevTools → Application → Local Storage
- Look for `skrivly_developer_jwt` key
- If missing, set it using Option A above

### 401 Unauthorized Error

- Token is missing or invalid
- Token may have expired
- Get a new token from your backend

### CORS Error

- Backend needs to allow requests from `http://localhost:5173` (or your dev server port)
- Check backend CORS settings

## Getting a JWT Token

Based on `curl_commads.md`, you can get a developer JWT token by:

1. **Login Flow** (passwordless):
   ```bash
   # Step 1: Send OTP
   curl -X POST "http://localhost:8000/api/v1/developer-settings/auth/login/" \
     -H "Content-Type: application/json" \
     -d '{"email": "your-email@example.com"}'
   
   # Step 2: Verify OTP (get token from response)
   curl -X POST "http://localhost:8000/api/v1/developer-settings/auth/login-otp-verify/" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "your-email@example.com",
       "otp_code": "123456"
     }'
   ```

2. Copy the `access_token` from the response
3. Set it in localStorage as shown in Option A above


