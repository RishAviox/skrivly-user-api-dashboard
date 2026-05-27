# Developer Settings API - cURL Commands

Replace the following placeholders:
- `BASE_URL`: Your API base URL (e.g., `http://localhost:8000` or `https://api.skrivly.com`)
- `NORMAL_USER_JWT`: Your normal Skrivly user JWT (for authenticated endpoints)
- `DEVELOPER_JWT`: Your developer account JWT (after signup/login)
- `EMAIL`: Developer email address (can be same as normal account email)
- `OTP_CODE`: 6-digit OTP code received via email
- `PASSWORD`: Your developer account password (only for signup, not login)

---

## 📑 Table of Contents

1. [Developer Account Flow](#-developer-account-flow)
   - [Which Flow Should I Use?](#-which-flow-should-i-use)
   - [Check Developer Account Status](#1-check-developer-account-status)
   - [Signup Flow](#-signup-flow-works-for-both-existing-and-new-users)
   - [Login Flow](#-login-flow-for-all-users---no-account-required)
   - [Complete Flow Examples](#-complete-flow-examples)

2. [API Key Management](#-api-key-management-requires-enterprise-plan)
   - [Check Enterprise Plan Status](#7-check-enterprise-plan-status)
   - [List API Keys](#8-list-api-keys)
   - [Create API Key](#9-create-api-key)
   - [Revoke API Key](#10-revoke-api-key)
   - [Regenerate API Key](#11-regenerate-api-key)

3. [API Usage Tracking](#-api-usage-tracking-requires-developer-account)
   - [Get API Usage Overview](#12-get-api-usage-overview)
   - [Get API Usage Log](#13-get-api-usage-log)
   - [Export API Usage Log as CSV](#14-export-api-usage-log-as-csv)
   - [Get Daily API Usage Statistics](#15-get-daily-api-usage-statistics)

4. [Dashboard API](#-dashboard-api-requires-developer-account)
   - [Get Dashboard Data](#16-get-dashboard-data)

5. [Billing & Invoices](#-billing--invoices-requires-developer-account)
   - [List Monthly Invoices](#17-list-monthly-invoices)
   - [Get Current Month Billing Summary](#18-get-current-month-billing-summary)

6. [Profile Management](#-profile-management-requires-developer-account)
   - [Get Profile Information](#19-get-profile-information)
   - [Update Profile Information](#20-update-profile-information)
   - [Get Organization Details](#21-get-organization-details)
   - [Delete Developer Account](#22-delete-developer-account)

7. [Send Documents Flow APIs](#-send-documents-flow-apis-all-accessible-via-developer-api-keys)
   - [Send Document API](#23-send-document-api)
   - [List Documents API](#24-list-documents-api)
   - [Create Document API](#25-create-document-api)
   - [Retrieve/Update/Delete Document API](#26-retrieveupdatedelete-document-api)
   - [Update Latest Document File API](#27-update-latest-document-file-api)
   - [Manage Signers API](#28-manage-signers-api)
   - [Update Signer Details API](#29-update-signer-details-api)
   - [Signer Update Management API](#30-signer-update-management-api)
   - [Document Signer Update API](#31-document-signer-update-api)
   - [Document Retrieve API](#32-document-retrieve-api)
   - [Document Preview API](#33-document-preview-api)
   - [Document View Details API](#34-document-view-details-api)
   - [Activity Log API](#35-activity-log-api)
   - [Document Reminder API](#36-document-reminder-api)
   - [Resend Signed Document API](#37-resend-signed-document-api)

8. [Additional Resources](#-additional-resources)
   - [Send Document API Example](#send-document-api-example)

---

## 🔐 Developer Account Flow

**Important Notes:**
- Developer accounts are **separate** from normal Skrivly user accounts
- **You can use any email** for developer accounts (doesn't need to match your normal account email)
- Developer accounts are linked to your organization
- After creating a developer account, you can switch between normal and developer accounts
- **Login is passwordless** - uses email + OTP only (no password required)
- **Signup requires password** - for account creation

---

## 🚀 Which Flow Should I Use?

### ✅ **I HAVE a Skrivly account** (already logged in)
→ Use **Signup Flow** (Steps 2-4 below) **with JWT token**
- Include: `Authorization: Bearer ${NORMAL_USER_JWT}` header
- Email is optional (auto-picked from your account)
- Creates developer account only
- Payment methods are checked automatically

### 🆕 **I DON'T HAVE a Skrivly account** (new user)
→ Use **Signup Flow** (Steps 2-4 below) **without JWT token**
- Don't include: Authorization header (no authentication needed)
- Email is required
- Creates both normal Skrivly account AND developer account
- Payment method collection is included

### 🔑 **I want to LOGIN to my developer account**
→ Use **Login Flow** (Steps 5-6 below)
- Requires: **NO authentication** (passwordless - email + OTP only)
- Works for both existing developer accounts and normal accounts

---

### 1. Check Developer Account Status
**Requires:** Normal Skrivly user JWT
**Purpose:** Check if developer account exists (for developer settings page)

```bash
curl -X GET "${BASE_URL}/api/v1/developer-settings/auth/account-status/" \
  -H "Authorization: Bearer ${NORMAL_USER_JWT}"
```

**Response (if account exists):**
```json
{
  "has_developer_account": true,
  "developer_account_id": "...",
  "developer_account_name": "...",
  "developer_account_email": "developer@example.com"
}
```

**Response (if no account):**
```json
{
  "has_developer_account": false,
  "suggested_email": "user@example.com"  // Your normal account email (use same email)
}
```

---

## 📝 Signup Flow (Works for Both Existing and New Users)

**✅ Unified Flow:** The same endpoints work for both authenticated users (existing Skrivly accounts) and fresh users (no account).

**How it works:**
- **If you're authenticated** (have JWT token): Email is optional (auto-picked from your account), creates developer account only
- **If you're not authenticated** (no JWT token): Email is required, creates both normal Skrivly account + developer account

### 2. Developer Account Signup - Send OTP
**Requires:** Optional - JWT token if you have a Skrivly account
**Purpose:** Send OTP to email for verification (first step of signup)

```bash
# If you have a Skrivly account (authenticated)
curl -X POST "${BASE_URL}/api/v1/developer-settings/auth/signup/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${NORMAL_USER_JWT}" \
  -d '{
    "email": "developer@example.com"  // Optional: If not provided, uses your logged-in user's email
  }'

# If you don't have a Skrivly account (not authenticated)
curl -X POST "${BASE_URL}/api/v1/developer-settings/auth/signup/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com"  // Required: Must provide email
  }'
```

**Response:** OTP sent to email

**Important:** 
- **If authenticated:** Email is optional - if not provided, automatically uses your logged-in user's email
- **If not authenticated:** Email is required - must provide an email address
- **You can use any email** - doesn't need to match your normal account email
- Developer accounts are separate from normal user accounts

---

### 3. Developer Account Signup - Verify OTP
**Requires:** Optional - JWT token if you have a Skrivly account
**Purpose:** Verify OTP code (second step of signup)

```bash
# If you have a Skrivly account (authenticated)
curl -X POST "${BASE_URL}/api/v1/developer-settings/auth/verify-otp/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${NORMAL_USER_JWT}" \
  -d '{
    "email": "developer@example.com",  // Optional: If not provided, uses your logged-in user's email
    "otp_code": "123456"
  }'

# If you don't have a Skrivly account (not authenticated)
curl -X POST "${BASE_URL}/api/v1/developer-settings/auth/verify-otp/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",  // Required: Must provide email
    "otp_code": "123456"
  }'
```

**Response:** OTP verified successfully (account creation happens in next step)

**Note:** 
- **If authenticated:** Email is optional - uses the same email from step 2 (or your logged-in user's email)
- **If not authenticated:** Email is required - must provide the same email from step 2

---

### 4. Developer Account Signup - Create Account with Password
**Requires:** Optional - JWT token if you have a Skrivly account
**Purpose:** Create developer account (final step of signup)
- **If authenticated:** Creates developer account only
- **If not authenticated:** Creates normal Skrivly account + developer account + collects payment

```bash
# If you have a Skrivly account (authenticated)
curl -X PUT "${BASE_URL}/api/v1/developer-settings/auth/create-account/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${NORMAL_USER_JWT}" \
  -d '{
    "email": "developer@example.com",  // Optional: If not provided, uses your logged-in user's email
    "password": "YourSecurePassword123!"
  }'

# If you don't have a Skrivly account (not authenticated)
curl -X PUT "${BASE_URL}/api/v1/developer-settings/auth/create-account/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",  // Required: Must provide email
    "password": "YourSecurePassword123!",
    "first_name": "John",  // Optional
    "last_name": "Doe",    // Optional
    "phone_number": "+1234567890"  // Optional
  }'
```

**Note:** 
- **If authenticated:** Email is optional - automatically uses the same email from steps 2 and 3 (or your logged-in user's email)
- **If not authenticated:** Email is required, and you can optionally provide first_name, last_name, phone_number

**Response:** Developer account created + developer JWT tokens returned

**If you already have payment methods on file:**
```json
{
  "user_details": {
    "access_token": "...",
    "refresh_token": "...",
    "user_type": "developer",
    ...
  },
  "organisation_details": {...},
  "developer_account": {
    "id": "...",
    "name": "...",
    "status": "active"
  }
}
```

**If you need to add payment method:**
```json
{
  "user_details": {
    "access_token": "...",
    "refresh_token": "...",
    "user_type": "developer",
    ...
  },
  "organisation_details": {...},
  "developer_account": {...},
  "payment_setup_url": "https://checkout.stripe.com/...",
  "checkout_session_id": "cs_...",
  "payment_required": true
}
```

**Important:**
- The system automatically checks if you (or your organization owner) have payment methods in Stripe
- If payment methods exist → Account created, tokens returned
- If no payment methods → Account created, but you'll receive a `payment_setup_url` to add a payment method
- Payment collection is done via Stripe Checkout in "setup" mode (no charge, just collects payment method)

**Save the `access_token` as `${DEVELOPER_JWT}` for switching to developer account.**

---

## 🔑 Login Flow (For All Users - No Account Required)

**✅ Use this flow if:** You want to login to your developer account (works for both existing users and new users)

**Key Features:**
- **NO authentication required** - passwordless login
- Works for existing developer accounts
- If you have a normal account but no developer account, it will create one for you
- If you have no account, it will tell you to use the Fresh User Signup Flow

### 5. Developer Account Login - Email Only (Passwordless)
**Requires:** No authentication (anyone can use this)
**Purpose:** Login with email only - sends OTP (no password required)

```bash
curl -X POST "${BASE_URL}/api/v1/developer-settings/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@example.com"  // No password needed!
  }'
```

**Response (if developer account exists):** OTP sent to email
```json
{
  "data": null,
  "status": "success",
  "message": "OTP sent to your email. Please verify to complete login.",
  "status_code": 200,
  "enabled_2fa": true
}
```

**Response (if normal account exists, no developer account):** OTP sent + will create developer account after verification
```json
{
  "action": "data_created",
  "status": "success",
  "message": "OTP sent to your email. After verification, your developer account will be created.",
  "data": {
    "normal_account_exists": true,
    "user_id": "...",
    "email": "developer@example.com"
  }
}
```

**Response (if no account exists):** Signup required
```json
{
  "action": "signup_required",
  "status": "success",
  "message": "No account found. Please signup to create a developer account.",
  "data": {
    "requires_signup": true,
    "email": "developer@example.com"
  }
}
```

**Note:** 
- **No password required** for developer account login
- If normal account exists, developer account will be created automatically after OTP verification
- If no account exists, use the fresh user signup flow (see below)

---

### 6. Developer Account Login - Verify OTP
**Requires:** No authentication (AllowAny)
**Purpose:** Verify OTP and get developer JWT tokens

```bash
curl -X POST "${BASE_URL}/api/v1/developer-settings/auth/login-otp-verify/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@example.com",
    "otp_code": "123456"
  }'
```

**Response:** Developer JWT tokens returned

**If developer account exists (or normal account with payment method):**
```json
{
  "user_details": {
    "access_token": "...",
    "refresh_token": "...",
    "user_type": "developer",
    ...
  },
  "organisation_details": {...},
  "developer_account": {...}
}
```

**If normal account exists but no payment method (developer account created):**
```json
{
  "user_details": {
    "access_token": "...",
    "refresh_token": "...",
    "user_type": "developer",
    ...
  },
  "organisation_details": {...},
  "developer_account": {...},
  "payment_setup_url": "https://checkout.stripe.com/...",
  "checkout_session_id": "cs_...",
  "payment_required": true
}
```

**Note:** 
- If developer account exists → Returns tokens directly
- If normal account exists (no dev account) → Creates developer account
  - If payment method exists → Returns tokens
  - If no payment method → Returns tokens + `payment_setup_url` to add payment method
- If no account exists → Returns error (use signup flow)

---

---

## 🧪 Complete Flow Examples

### Flow A: Authenticated User Creates Developer Account
```bash
# Step 1: Check account status
curl -X GET "${BASE_URL}/api/v1/developer-settings/auth/account-status/" \
  -H "Authorization: Bearer ${NORMAL_USER_JWT}"

# Step 2: Send OTP for signup
curl -X POST "${BASE_URL}/api/v1/developer-settings/auth/signup/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${NORMAL_USER_JWT}" \
  -d '{"email": "developer@example.com"}'

# Step 3: Verify OTP
curl -X POST "${BASE_URL}/api/v1/developer-settings/auth/verify-otp/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${NORMAL_USER_JWT}" \
  -d '{
    "email": "developer@example.com",
    "otp_code": "123456"
  }'

# Step 4: Create account with password
curl -X PUT "${BASE_URL}/api/v1/developer-settings/auth/create-account/?email=developer@example.com" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${NORMAL_USER_JWT}" \
  -d '{"password": "YourSecurePassword123!"}'

# Response contains developer JWT tokens
```

---

### Flow B: Login to Developer Account (Passwordless)
```bash
# Step 1: Login with email only (no password!)
curl -X POST "${BASE_URL}/api/v1/developer-settings/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{"email": "developer@example.com"}'

# Response: OTP sent to email

# Step 2: Verify OTP
curl -X POST "${BASE_URL}/api/v1/developer-settings/auth/login-otp-verify/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@example.com",
    "otp_code": "123456"
  }'

# Response: Developer JWT tokens
# If normal account exists (no dev account), developer account is created automatically
```

---

### Flow C: Fresh User Signup (No Existing Account)
**Note:** Use the same unified signup endpoints as Flow A, but **without** the Authorization header.

```bash
# Step 1: Send OTP (no authentication required)
curl -X POST "${BASE_URL}/api/v1/developer-settings/auth/signup/" \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com"}'  # Email is REQUIRED for unauthenticated users

# Step 2: Verify OTP (no authentication required)
curl -X POST "${BASE_URL}/api/v1/developer-settings/auth/verify-otp/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",  # Email is REQUIRED
    "otp_code": "123456"
  }'

# Step 3: Create account with payment (no authentication required)
curl -X PUT "${BASE_URL}/api/v1/developer-settings/auth/create-account/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",  # Email is REQUIRED
    "password": "YourSecurePassword123!",
    "first_name": "John",  # Optional
    "last_name": "Doe",    # Optional
    "phone_number": "+1234567890"  # Optional
  }'

# Response includes payment_setup_url - redirect user to complete payment setup
# After payment setup, user can login with email + OTP (no password needed for login)
```

---

## 📝 Notes

1. **Separate Accounts**: Developer accounts are completely separate from normal Skrivly user accounts, even if they use the same email address.

2. **No Plan Restrictions**: Developer accounts are available to all authenticated users (no enterprise plan required).

3. **Account Switching**: After creating a developer account, users can switch between their normal account and developer account using different JWT tokens.

4. **Organization Binding**: Developer accounts are automatically linked to the organization of the user who created them.

5. **Email Flexibility**: You can use **any email address** for your developer account - it doesn't need to match your normal account email.

6. **Passwordless Login**: Developer account login **does NOT require password** - only email + OTP. This makes it easier for API access.

7. **Signup Flow (Authenticated Users)**: 
   - Requires authenticated normal user
   - **Email is required** - you can use any valid email address
   - Step 1: Send OTP → Step 2: Verify OTP → Step 3: Create account with password
   - Returns developer JWT tokens for immediate use

8. **Login Flow (Passwordless)**: 
   - No authentication required (AllowAny)
   - **Email only** - no password needed
   - Step 1: Send OTP → Step 2: Verify OTP → Get tokens
   - If developer account exists → Returns tokens
   - If normal account exists (no dev account) → Creates developer account → Returns tokens
   - If no account exists → Returns signup_required (use fresh user signup)

9. **Fresh User Signup Flow**: 
   - For users with no existing Skrivly account
   - Uses the same unified endpoints as authenticated users (`/auth/signup/`, `/auth/verify-otp/`, `/auth/create-account/`)
   - **Do NOT include Authorization header** (no JWT token needed)
   - Email is **REQUIRED** (not optional like authenticated users)
   - Step 1: Send OTP → Step 2: Verify OTP → Step 3: Create account with password + payment
   - Creates both normal account and developer account
   - Collects payment method via Stripe checkout session
   - Returns payment setup URL

10. **Payment Collection**: Fresh users must complete payment setup to save card details. The payment_setup_url in the response should be opened in a browser to complete the process.

11. **Password Requirements**: Password is only required during signup (for account creation), not during login. Password should meet your system's password requirements (typically minimum 8 characters).

12. **No Admin CRUD**: Developer accounts can only be created through the signup flow. There are no admin endpoints to create/manage them directly.

13. **Response Structure**: The response structure includes `user_details`, `organisation_details`, and `developer_account` fields.

---

## 🔑 API Key Management (Requires Enterprise Plan)

**Important Notes:**
- API key generation requires an **enterprise plan subscription**
- API keys are used for programmatic access to the Skrivly API
- Each API key has a name, key, and secret (secret shown only once on creation)
- API keys can be revoked or regenerated
- Revoked keys cannot be used but remain visible in the list

**All API key endpoints require:**
- Developer account JWT authentication (`DEVELOPER_JWT`)
- Active developer account
- Enterprise plan subscription (checked automatically)

---

### 7. Check Enterprise Plan Status
**Requires:** Developer account JWT
**Purpose:** Check if your developer account has enterprise plan (for UI display)

```bash
curl -X GET "${BASE_URL}/api/v1/developer-settings/api-keys/check-plan/" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}"
```

**Response (if enterprise plan exists):**
```json
{
  "action": "data_retrieved",
  "status": "success",
  "message": "Enterprise plan verified. API key generation allowed.",
  "data": {
    "has_enterprise_plan": true,
    "message": "Enterprise plan verified. API key generation allowed."
  }
}
```

**Response (if no enterprise plan):**
```json
{
  "action": "data_retrieved",
  "status": "success",
  "message": "Enterprise plan required. Please upgrade to an enterprise plan to generate API keys.",
  "data": {
    "has_enterprise_plan": false,
    "message": "Enterprise plan required. Please upgrade to an enterprise plan to generate API keys."
  }
}
```

---

### 8. List API Keys
**Requires:** Developer account JWT
**Purpose:** Get all API keys for your developer account

```bash
# List only active keys (default)
curl -X GET "${BASE_URL}/api/v1/developer-settings/api-keys/" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}"

# Include inactive/revoked keys
curl -X GET "${BASE_URL}/api/v1/developer-settings/api-keys/?include_inactive=true" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}"
```

**Response:**
```json
{
  "action": "data_retrieved",
  "status": "success",
  "message": "API keys retrieved successfully.",
  "data": {
    "api_keys": [
      {
        "id": "uuid-here",
        "key_name": "Production API Key",
        "is_active": true,
        "last_used": "2026-02-03T10:30:00Z",
        "created_at": "2026-02-01T08:00:00Z",
        "expires_at": null,
        "is_expired": false
      },
      {
        "id": "uuid-here-2",
        "key_name": "Test API Key",
        "is_active": false,
        "last_used": "2026-02-02T15:20:00Z",
        "created_at": "2026-01-15T09:00:00Z",
        "expires_at": null,
        "is_expired": false
      }
    ],
    "total_count": 2
  }
}
```

**Note:** API keys and secrets are **never** shown in the list for security reasons. They are only shown once when created.

---

### 9. Create API Key
**Requires:** Developer account JWT + Enterprise plan
**Purpose:** Generate a new API key for your developer account

```bash
curl -X POST "${BASE_URL}/api/v1/developer-settings/api-keys/create/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}" \
  -d '{
    "key_name": "Production API Key",
    "expires_in_days": 365  // Optional: Key expiration in days
  }'
```

**Response:**
```json
{
  "action": "data_created",
  "status": "success",
  "message": "API key created successfully. Please save the API key and secret securely. They will not be shown again.",
  "data": {
    "id": "uuid-here",
    "key_name": "Production API Key",
    "api_key": "your-api-key-here",
    "api_secret": "your-api-secret-here",
    "created_at": "2026-02-03T10:30:00Z",
    "expires_at": "2027-02-03T10:30:00Z",
    "warning": "Please save the API key and secret securely. They will not be shown again."
  }
}
```

**Important:**
- ⚠️ **Save the API key and secret immediately** - they are shown only once
- Enterprise plan is required (checked automatically)
- If no enterprise plan, you'll get a permission denied error
- `expires_in_days` is optional - if not provided, key never expires

---

### 10. Revoke API Key
**Requires:** Developer account JWT
**Purpose:** Deactivate an API key (cannot be undone, but you can regenerate)

```bash
curl -X DELETE "${BASE_URL}/api/v1/developer-settings/api-keys/{api_key_id}/revoke/" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}"
```

**Response:**
```json
{
  "action": "data_updated",
  "status": "success",
  "message": "API key revoked successfully."
}
```

**Note:**
- Revoked keys become inactive and cannot be used
- Revoked keys remain visible in the list (with `is_active: false`)
- You can regenerate a revoked key to create a new one

---

### 11. Regenerate API Key
**Requires:** Developer account JWT + Enterprise plan
**Purpose:** Revoke the old API key and create a new one (useful for key rotation)

```bash
curl -X POST "${BASE_URL}/api/v1/developer-settings/api-keys/{api_key_id}/regenerate/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}" \
  -d '{
    "key_name": "Production API Key (Regenerated)",  // Optional: New name for the key
    "expires_in_days": 365  // Optional: Expiration in days
  }'
```

**Response:**
```json
{
  "action": "data_created",
  "status": "success",
  "message": "API key regenerated successfully. The old key has been revoked. Please save the new API key and secret securely. They will not be shown again.",
  "data": {
    "id": "new-uuid-here",
    "key_name": "Production API Key (Regenerated)",
    "api_key": "new-api-key-here",
    "api_secret": "new-api-secret-here",
    "created_at": "2026-02-03T10:35:00Z",
    "expires_at": "2027-02-03T10:35:00Z",
    "old_key_id": "old-uuid-here",
    "warning": "The old API key has been revoked. Please save the new API key and secret securely. They will not be shown again."
  }
}
```

**Important:**
- ⚠️ **Save the new API key and secret immediately** - they are shown only once
- The old API key is automatically revoked
- Enterprise plan is required (checked automatically)
- `key_name` is optional - if not provided, uses the old key's name
- `expires_in_days` is optional - if not provided, key never expires

---

## 📝 API Key Management Notes

1. **Enterprise Plan Required**: API key generation requires an active enterprise plan subscription. The system automatically checks this before allowing key creation.

2. **Security**: API keys and secrets are shown only once when created. Make sure to save them securely. They cannot be retrieved later.

3. **Key Expiration**: API keys can have an optional expiration date. If not set, keys never expire (until manually revoked).

4. **Revocation**: Revoked keys cannot be used but remain visible in the list. You can regenerate them to create new keys.

5. **Regeneration**: Regenerating a key revokes the old one and creates a new one. Useful for key rotation or if a key is compromised.

6. **Last Used**: The system tracks when each API key was last used (for monitoring purposes).

7. **Organization Binding**: API keys are bound to the developer account's organization. All keys for a developer account share the same organization context.

---

## 📊 API Usage Tracking (Requires Developer Account)

**Important Notes:**
- API usage is automatically tracked for all requests made via API keys
- Usage tracking includes feature usage (e-signatures, BankID, etc.) and costs
- All usage endpoints require developer account JWT authentication
- Usage data is aggregated for billing and analytics purposes
- **Automatic Tracking**: Simply use your API key in the `Authorization: Bearer` header - tracking happens automatically

**All usage endpoints require:**
- Developer account JWT authentication (`DEVELOPER_JWT`)
- Active developer account

**Making Tracked API Calls:**
To make API calls that are automatically tracked, use your API key (not JWT token):

```bash
# Example: Send document API call (automatically tracked)
curl -X POST "${BASE_URL}/en/api/v1/user-documents/send-mail/?doc_reference_id=xxx&organisation_doc_reference_id=yyy" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      {"signer_type": "otp", ...},
      {"signer_type": "sweden_bank_id", ...}
    ]
  }'

# Example: List documents API call (automatically tracked)
curl -X GET "${BASE_URL}/en/api/v1/user-documents/details/?document_organisation_reference_id=xxx" \
  -H "Authorization: Bearer ${API_KEY}"

# Example: Create document API call (automatically tracked)
curl -X POST "${BASE_URL}/en/api/v1/user-documents/details/" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Note:** Replace `${API_KEY}` with your actual API key (from step 9 above). All calls made with API keys are automatically tracked with feature usage and costs.

**📖 For detailed examples of using API keys with actual Skrivly API endpoints (like sending documents), see:** [`SEND_DOCUMENT_API_EXAMPLE.md`](./SEND_DOCUMENT_API_EXAMPLE.md)

---

### 12. Get API Usage Overview
**Requires:** Developer account JWT
**Purpose:** Get summary metrics of API usage (total requests, costs, etc.)

```bash
# Get overview for last 30 days (default)
curl -X GET "${BASE_URL}/api/v1/developer-settings/usage/overview/" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}"

# Get overview for custom date range
curl -X GET "${BASE_URL}/api/v1/developer-settings/usage/overview/?start_date=2026-01-01&end_date=2026-01-31" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}"
```

**Response:**
```json
{
  "action": "data_retrieved",
  "status": "success",
  "message": "API usage overview retrieved successfully.",
  "data": {
    "api_requests": 12450,
    "monthly_cost": 6225.00,
    "active_keys": 2,
    "failed_requests": 14,
    "total_esign_count": 850,
    "total_bankid_count": 230,
    "total_cost": 6225.00,
    "date_range": {
      "start_date": "2026-01-01T00:00:00Z",
      "end_date": "2026-01-31T23:59:59Z"
    },
    "by_api": {
      "send_document": {
        "requests": 120,
        "cost": 14.40,
        "esign_count": 2,
        "bankid_count": 4
      },
      "list_documents": {
        "requests": 1000,
        "cost": 10.00,
        "esign_count": 0,
        "bankid_count": 0
      },
      "create_document": {
        "requests": 50,
        "cost": 2.50,
        "esign_count": 0,
        "bankid_count": 0
      }
    }
  }
}
```

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format (default: 30 days ago)
- `end_date` (optional): End date in YYYY-MM-DD format (default: today)

---

### 13. Get API Usage Log
**Requires:** Developer account JWT
**Purpose:** Get detailed API usage log with pagination and filtering

```bash
# Get first page (default: 50 items per page)
curl -X GET "${BASE_URL}/api/v1/developer-settings/usage/log/" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}"

# Get specific page with filters
curl -X GET "${BASE_URL}/api/v1/developer-settings/usage/log/?start_date=2026-01-01&end_date=2026-01-31&api_name=send_document&status=success&page=1&page_size=50" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}"
```

**Response:**
```json
{
  "action": "data_retrieved",
  "status": "success",
  "message": "API usage log retrieved successfully.",
  "data": {
    "logs": [
      {
        "id": "uuid-here",
        "api_name": "Send Document",
        "client_id": "client_8f2a19",
        "endpoint": "/en/api/v1/user-documents/send-mail/",
        "requests": 1,
        "price_per_req": 0.12,
        "total_cost": 4.72,
        "date": "2026-01-28",
        "time": "14:32:00",
        "status": "success",
        "esign_count": 2,
        "bankid_count": 4,
        "total_signatures": 6,
        "document_reference_id": "doc-ref-123"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 50,
      "total_count": 120,
      "total_pages": 3
    }
  }
}
```

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format
- `api_name` (optional): Filter by API name (`send_document`, `list_documents`, `create_document`)
- `status` (optional): Filter by status (`success`, `failed`)
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Items per page (default: 50)

---

### 14. Export API Usage Log as CSV
**Requires:** Developer account JWT
**Purpose:** Export API usage log as CSV file with all matching records (no pagination)

```bash
# Export all logs (default: all records)
curl -X GET "${BASE_URL}/api/v1/developer-settings/usage/log/export/" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}" \
  --output api_usage_log.csv

# Export with filters
curl -X GET "${BASE_URL}/api/v1/developer-settings/usage/log/export/?start_date=2026-01-01&end_date=2026-01-31&api_name=send_document&status=success" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}" \
  --output api_usage_log_filtered.csv
```

**Response:**
- Returns a CSV file download with filename: `api_usage_log_YYYYMMDD_HHMMSS.csv`
- Content-Type: `text/csv; charset=utf-8`
- Includes UTF-8 BOM for Excel compatibility

**CSV Columns:**
- API Name
- Client ID
- Endpoint
- Requests
- Price per Request
- Total Cost
- Date
- Time
- Status
- E-Signatures
- BankID Signatures
- Total Signatures
- API Key Name
- Document Reference ID

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format
- `api_name` (optional): Filter by API name (`send_document`, `list_documents`, `create_document`)
- `status` (optional): Filter by status (`success`, `failed`)
- `api_key_id` (optional): Filter by specific API key ID
- `api_key_active` (optional): Filter by API key status (`true`/`false`)

**Note:**
- Exports **all matching records** (no pagination limit)
- Uses the same filters as the regular log endpoint
- CSV file includes UTF-8 BOM for proper Excel display
- File is automatically downloaded with timestamp in filename

---

### 15. Get Daily API Usage Statistics
**Requires:** Developer account JWT
**Purpose:** Get daily aggregated statistics for charts/graphs

```bash
# Get daily stats for last 31 days (default)
curl -X GET "${BASE_URL}/api/v1/developer-settings/usage/daily-stats/" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}"

# Get daily stats for custom date range
curl -X GET "${BASE_URL}/api/v1/developer-settings/usage/daily-stats/?start_date=2026-01-01&end_date=2026-01-31" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}"
```

**Response:**
```json
{
  "action": "data_retrieved",
  "status": "success",
  "message": "Daily API usage statistics retrieved successfully.",
  "data": {
    "daily_requests": [
      {
        "date": "2026-01-28",
        "requests": 120,
        "failed": 0
      },
      {
        "date": "2026-01-29",
        "requests": 95,
        "failed": 1
      }
    ],
    "daily_costs": [
      {
        "date": "2026-01-28",
        "cost": 14.40
      },
      {
        "date": "2026-01-29",
        "cost": 28.50
      }
    ],
    "summary": {
      "total_requests": 12450,
      "total_failed": 14,
      "total_cost": 6225.00
    },
    "date_range": {
      "start_date": "2026-01-01T00:00:00Z",
      "end_date": "2026-01-31T23:59:59Z"
    }
  }
}
```

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format (default: 31 days ago)
- `end_date` (optional): End date in YYYY-MM-DD format (default: today)

---

## 📝 API Usage Tracking Notes

1. **Automatic Tracking**: All API calls made via API keys are automatically tracked. No manual logging required.

2. **Feature Tracking**: The system tracks feature usage (e-signatures, BankID signatures, etc.) per API call. This allows for granular billing based on features used.

3. **Flexible Features**: The system supports tracking any features, not just esign/bankid. Features are stored in a flexible JSON format.

4. **Cost Calculation**: Costs are calculated based on:
   - Base price per API request
   - Price per feature unit (e.g., per e-signature, per BankID signature)
   - Total cost = base_price + (feature_count × feature_price)

5. **Pricing Configuration**: Pricing is configurable via Django admin (`/admin/developer_settings/apipricing/`). No code changes needed to update prices.

6. **Usage Logs**: Each API call creates a usage log entry with:
   - API endpoint called
   - Features used (counts)
   - Calculated costs
   - Request status (success/failed)
   - Timestamp and metadata

7. **Aggregation**: Usage data can be aggregated by:
   - Date range
   - API endpoint
   - Status (success/failed)
   - Developer account

8. **Billing**: Usage data is aggregated monthly for billing purposes. The `monthly_cost` field in the overview shows the current month's total cost.

9. **Failed Requests**: Failed requests are also tracked (with status "failed") but may have zero feature counts depending on when the failure occurred.

10. **Client ID**: Each usage log includes a `client_id` derived from the API key (format: `client_<first_8_chars>`). This helps identify which API key was used.

---

## 📈 Dashboard API (Requires Developer Account)

**Important Notes:**
- Dashboard API provides comprehensive analytics and metrics for your developer account
- Returns overview metrics, daily usage charts, and cost analysis
- Supports period filters (7, 14, or 31 days) for chart data
- All dashboard endpoints require developer account JWT authentication

**All dashboard endpoints require:**
- Developer account JWT authentication (`DEVELOPER_JWT`)
- Active developer account

---

### 16. Get Dashboard Data
**Requires:** Developer account JWT
**Purpose:** Get comprehensive dashboard data including overview metrics, daily usage charts, and cost analysis

```bash
# Get dashboard data (default: last 31 days)
curl -X GET "${BASE_URL}/api/v1/developer-settings/dashboard/" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}"

# Get dashboard data for last 7 days
curl -X GET "${BASE_URL}/api/v1/developer-settings/dashboard/?period=7" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}"

# Get dashboard data for last 14 days
curl -X GET "${BASE_URL}/api/v1/developer-settings/dashboard/?period=14" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}"

# Get dashboard data for last 31 days (explicit)
curl -X GET "${BASE_URL}/api/v1/developer-settings/dashboard/?period=31" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}"
```

**Response:**
```json
{
  "action": "data_retrieved",
  "status": "success",
  "message": "Dashboard data retrieved successfully.",
  "data": {
    "overview": {
      "api_requests": {
        "value": 12450,
        "period": "This month",
        "trend_percentage": 15.5,
        "trend": "increase"
      },
      "monthly_cost": {
        "value": 6225.00,
        "billing_date": "Feb 1",
        "month": "Jan 2026"
      },
      "active_keys": {
        "value": 2,
        "note": "1 production keys"
      },
      "failed_requests": {
        "value": 14,
        "period": "Last 30 days",
        "percentage": 0.11
      }
    },
    "daily_api_usage": {
      "title": "Daily API Usage",
      "subtitle": "Request volume over the last 31 days",
      "period": "Last 31 days",
      "period_days": 31,
      "summary": {
        "requests": 12450,
        "failed": 14
      },
      "chart_data": [
        {
          "date": "2026-01-01",
          "requests": 450,
          "failed": 0,
          "successful": 450
        },
        {
          "date": "2026-01-02",
          "requests": 380,
          "failed": 1,
          "successful": 379
        }
      ]
    },
    "daily_cost": {
      "title": "Daily Cost",
      "subtitle": "Estimated cost over the last 31 days",
      "period": "Last 31 days",
      "period_days": 31,
      "summary": {
        "cost": 6225.00
      },
      "chart_data": [
        {
          "date": "2026-01-01",
          "cost": 225.50
        },
        {
          "date": "2026-01-02",
          "cost": 190.25
        }
      ]
    },
    "developer_account": {
      "id": "uuid-here",
      "name": "My Developer Account",
      "organization_name": "My Organization"
    }
  }
}
```

**Query Parameters:**
- `period` (optional): Period filter for chart data. Valid values: `7`, `14`, or `31` (default: `31`)

**Response Fields:**
- `overview`: High-level metrics including:
  - `api_requests`: Current month's API requests with trend percentage
  - `monthly_cost`: Current month's cost and billing date
  - `active_keys`: Number of active API keys
  - `failed_requests`: Failed requests count and percentage (last 30 days)
- `daily_api_usage`: Daily API usage chart data with:
  - `chart_data`: Array of daily usage data (requests, failed, successful)
  - `summary`: Total requests and failed requests for the period
- `daily_cost`: Daily cost chart data with:
  - `chart_data`: Array of daily cost data
  - `summary`: Total cost for the period
- `developer_account`: Developer account information

**Note:**
- Chart data includes all dates in the selected period, even if there were no requests (shows 0)
- Trend percentage compares current month with previous month
- Failed requests percentage is calculated over the last 30 days
- Period filter only affects chart data, not overview metrics (which use current month)

---

## 💳 Billing & Invoices (Requires Developer Account)

**Important Notes:**
- Monthly invoices are automatically generated at the end of each month
- Invoices are created for the previous month's API usage
- Invoices are automatically charged via Stripe if a payment method is on file
- All billing endpoints require developer account JWT authentication
- Users can view invoices and current month usage before invoice generation

**All billing endpoints require:**
- Developer account JWT authentication (`DEVELOPER_JWT`)
- Active developer account

**How Automatic Billing Works:**
1. **Monthly Invoice Generation**: On the 1st of each month at midnight, the system automatically:
   - Aggregates all API usage from the previous month
   - Calculates total costs based on API pricing
   - Creates a `MonthlyInvoice` record for each active developer account
   - Creates a Stripe invoice and attempts to charge the default payment method

2. **Payment Processing**: 
   - If the Stripe customer has a default payment method → Invoice is automatically charged
   - Payment status is updated via Stripe webhooks (`invoice.payment_succeeded` or `invoice.payment_failed`)
   - Invoice status can be: `pending`, `paid`, `failed`, or `cancelled`

3. **Payment Method Requirement**:
   - Developer accounts must have a Stripe customer ID (from organization owner)
   - Stripe customer must have a default payment method set
   - Payment methods are set when users complete checkout or add cards

---

### 17. List Monthly Invoices
**Requires:** Developer account JWT
**Purpose:** Get list of all monthly invoices with pagination and filtering

```bash
# Get all invoices (default: first page, 10 items per page)
curl -X GET "${BASE_URL}/api/v1/developer-settings/billing/invoices/" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}"

# Get invoices with filters and pagination
curl -X GET "${BASE_URL}/api/v1/developer-settings/billing/invoices/?status=pending&page=1&page_size=20" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}"
```

**Response:**
```json
{
  "action": "data_retrieved",
  "status": "success",
  "message": "Invoices retrieved successfully.",
  "data": {
    "invoices": [
      {
        "id": "uuid-here",
        "month": "January 2026",
        "invoice_month": 1,
        "invoice_year": 2026,
        "billing_period_start": "2026-01-01T00:00:00Z",
        "billing_period_end": "2026-01-31T23:59:59Z",
        "requests": 12450,
        "total_cost": 6225.00,
        "status": "pending",
        "status_label": "Pending",
        "due_date": "2026-02-06T00:00:00Z",
        "paid_at": null,
        "invoice_pdf_url": "https://pay.stripe.com/invoice/...",
        "invoice_url": "https://pay.stripe.com/invoice/...",
        "feature_usage": {
          "esign": 850,
          "bankid": 230
        },
        "esign_count": 850,
        "bankid_count": 230
      },
      {
        "id": "uuid-here-2",
        "month": "December 2025",
        "invoice_month": 12,
        "invoice_year": 2025,
        "billing_period_start": "2025-12-01T00:00:00Z",
        "billing_period_end": "2025-12-31T23:59:59Z",
        "requests": 11890,
        "total_cost": 5945.00,
        "status": "paid",
        "status_label": "Paid",
        "due_date": "2026-01-05T00:00:00Z",
        "paid_at": "2026-01-02T10:30:00Z",
        "invoice_pdf_url": "https://pay.stripe.com/invoice/...",
        "invoice_url": "https://pay.stripe.com/invoice/...",
        "feature_usage": {
          "esign": 800,
          "bankid": 200
        },
        "esign_count": 800,
        "bankid_count": 200
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 10,
      "total_count": 2,
      "total_pages": 1
    }
  }
}
```

**Query Parameters:**
- `status` (optional): Filter by invoice status (`pending`, `paid`, `failed`, `cancelled`)
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Items per page (default: 10)

**Invoice Status Values:**
- `pending`: Invoice created but payment not yet processed
- `paid`: Invoice successfully paid
- `failed`: Payment attempt failed
- `cancelled`: Invoice was cancelled

---

### 18. Get Current Month Billing Summary
**Requires:** Developer account JWT
**Purpose:** Get current month usage and cost before invoice is generated

```bash
curl -X GET "${BASE_URL}/api/v1/developer-settings/billing/current-month/" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}"
```

**Response:**
```json
{
  "action": "data_retrieved",
  "status": "success",
  "message": "Current month billing summary retrieved successfully.",
  "data": {
    "current_month": {
      "month": "Jan 2026",
      "month_number": 1,
      "year": 2026,
      "total_cost": 6225.00,
      "total_requests": 12450,
      "feature_usage": {
        "esign": 850,
        "bankid": 230
      }
    },
    "next_billing_date": "Feb 1, 2026",
    "payment_method": {
      "type": "card",
      "brand": "Visa",
      "last4": "4242",
      "exp_month": 12,
      "exp_year": 2027,
      "expires": "12/27"
    },
    "developer_account": {
      "id": "uuid-here",
      "name": "My Developer Account",
      "has_stripe_customer": true
    }
  }
}
```

**Response Fields:**
- `current_month`: Current month's usage summary (before invoice generation)
- `next_billing_date`: Date when the next invoice will be generated (1st of next month)
- `payment_method`: Default payment method information (if available)
- `developer_account`: Developer account details

**Note:** 
- This endpoint shows usage for the current month (before invoice is generated)
- Once the month ends and invoice is generated, use the invoices list endpoint to view the invoice
- `payment_method` will be `null` if no default payment method is set on the Stripe customer

---

## 📝 Billing & Invoices Notes

1. **Automatic Invoice Generation**: Invoices are automatically created on the 1st of each month at midnight (UTC) via Celery Beat scheduled task.

2. **Billing Period**: Each invoice covers the previous month's usage (e.g., February 1st invoice covers January usage).

3. **Invoice Creation**: 
   - Only created for active developer accounts
   - Only created if there was usage in the billing period
   - Skips if invoice already exists for that month/year

4. **Stripe Integration**: 
   - Invoices are automatically created in Stripe if the developer account has a `stripe_customer_id`
   - Stripe attempts to charge the customer's default payment method automatically
   - Payment status is updated via Stripe webhooks

5. **Payment Method Requirement**: 
   - Developer accounts must have a Stripe customer ID (from organization owner)
   - Stripe customer must have a default payment method for automatic charging
   - Payment methods are set when users complete checkout or add cards via card management API

6. **Invoice Status**: 
   - `pending`: Invoice created, payment processing
   - `paid`: Payment successful
   - `failed`: Payment failed (Stripe will retry based on retry policy)
   - `cancelled`: Invoice cancelled

7. **Invoice Access**: 
   - Users can view invoices via the API
   - Invoice PDFs and hosted invoice URLs are available for download/viewing
   - Invoices are accessible to all users in the developer account's organization

8. **Current Month Usage**: 
   - Shows real-time usage for the current month (before invoice generation)
   - Useful for monitoring usage before the billing period ends
   - Includes next billing date and payment method information

9. **Feature Usage Tracking**: 
   - Each invoice includes a breakdown of feature usage (e-signatures, BankID, etc.)
   - Feature usage is aggregated from all API usage logs for the billing period

10. **Cost Calculation**: 
    - Invoice costs are calculated based on API pricing configuration
    - Includes base API request costs + feature usage costs (e-signatures, BankID, etc.)
    - Pricing is configurable via Django admin (`/admin/developer_settings/apipricing/`)

11. **Payment Failure Handling**: 
    - If payment fails, invoice status is set to `failed`
    - Stripe automatically retries failed payments based on retry policy
    - You can manually retry payment or update payment method

12. **Invoice PDFs**: 
    - Each invoice has a PDF download URL (`invoice_pdf_url`)
    - PDFs are generated by Stripe and include all invoice details
    - Hosted invoice URLs (`invoice_url`) allow customers to view and pay invoices online

---

## 👤 Profile Management

### 19. Get Profile Information
**Requires:** Developer account JWT  
**Purpose:** Retrieve developer account profile information

```bash
curl -X GET "${BASE_URL}/en/api/v1/developer-settings/profile/" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "action": "data_retrieved",
  "status": "success",
  "data": {
    "account_id": "3994b626-0375-4d98-a5e4-74613b46d1d3",
    "first_name": "John",
    "last_name": "Doe",
    "email": "user@example.com",
    "phone_number": "+46704820780",
    "country": "Sweden",
    "address1": "Gustaf Dahlénsgatan 30",
    "address2": "",
    "zip_code": "41724",
    "state": "Gothenburg",
    "two_fa_enabled": true,
    "profile_picture": "https://presigned-url-to-profile-picture.jpg"
  }
}
```

**Notes:**
- `account_id`: Developer account UUID (read-only)
- `profile_picture`: Presigned URL valid for 1 hour (null if no picture)
- All fields are optional and may be empty strings

---

### 20. Update Profile Information
**Requires:** Developer account JWT  
**Purpose:** Update developer account profile information

```bash
curl -X PATCH "${BASE_URL}/en/api/v1/developer-settings/profile/" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}" \
  -H "Content-Type: multipart/form-data" \
  -F "first_name=John" \
  -F "last_name=Doe" \
  -F "email=newemail@example.com" \
  -F "phone_number=+46704820780" \
  -F "country=Sweden" \
  -F "address1=Gustaf Dahlénsgatan 30" \
  -F "address2=" \
  -F "zip_code=41724" \
  -F "state=Gothenburg" \
  -F "enable_2fa=true" \
  -F "profile_picture=@/path/to/image.jpg"
```

**Request Body (JSON alternative):**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "newemail@example.com",
  "phone_number": "+46704820780",
  "country": "Sweden",
  "address1": "Gustaf Dahlénsgatan 30",
  "address2": "",
  "zip_code": "41724",
  "state": "Gothenburg",
  "enable_2fa": true
}
```

**Response:**
```json
{
  "action": "data_updated",
  "status": "success",
  "message": "Profile updated successfully.",
  "data": {
    "account_id": "3994b626-0375-4d98-a5e4-74613b46d1d3",
    "first_name": "John",
    "last_name": "Doe",
    "email": "newemail@example.com",
    "phone_number": "+46704820780",
    "country": "Sweden",
    "address1": "Gustaf Dahlénsgatan 30",
    "address2": "",
    "zip_code": "41724",
    "state": "Gothenburg",
    "two_fa_enabled": true,
    "profile_picture": "https://presigned-url-to-profile-picture.jpg"
  }
}
```

**Notes:**
- All fields are optional - only include fields you want to update
- `email` and `phone_number` can only be updated once every 30 days (enforced by ContactUpdateService)
- `profile_picture`: Upload image file (JPEG, PNG, etc.) or set to empty string to remove
- `enable_2fa`: Boolean to enable/disable two-factor authentication
- `account_id` is read-only and cannot be updated

---

### 21. Get Organization Details
**Requires:** Developer account JWT  
**Purpose:** Retrieve organization details used for invoices

```bash
curl -X GET "${BASE_URL}/en/api/v1/developer-settings/profile/organization/" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "action": "data_retrieved",
  "status": "success",
  "data": {
    "organization_name": "Rexett AB",
    "organization_number": "5594531856",
    "organization_vat_id": "SE559453185601",
    "organization_domain": "www.rexett.com"
  }
}
```

**Notes:**
- Organization details are read-only via this endpoint
- To update organization details, use the organization management endpoints
- These details are used for invoice generation

---

### 22. Delete Developer Account
**Requires:** Developer account JWT  
**Purpose:** Disable/delete developer account (soft delete)

```bash
curl -X POST "${BASE_URL}/en/api/v1/developer-settings/profile/delete-account/" \
  -H "Authorization: Bearer ${DEVELOPER_JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "confirm": true
  }'
```

**Response:**
```json
{
  "action": "data_deleted",
  "status": "success",
  "message": "Developer account has been disabled successfully."
}
```

**Notes:**
- This performs a **soft delete** - the account is disabled, not permanently deleted
- All API keys associated with the account are automatically revoked
- Account status is set to `disabled`
- API usage logs are preserved for historical records
- Requires `confirm: true` in request body to prevent accidental deletion

---

## 📄 Send Documents Flow APIs (All Accessible via Developer API Keys)

**Important Notes:**
- All APIs in the send documents flow are now accessible via Developer API Keys
- Use `Authorization: Bearer ${API_KEY}` header (not JWT token)
- All API calls are automatically tracked for billing purposes
- Replace `${API_KEY}` with your actual API key from step 9 above

**All endpoints support:**
- ✅ Developer API Key authentication
- ✅ Enterprise API Token authentication  
- ✅ JWT Token authentication

---

### 23. Send Document API
**Endpoint:** `POST /api/v1/user-documents/send-mail/`

**Purpose:** Send a document to signers via email with e-signature or BankID signature support.

```bash
curl -X POST "${BASE_URL}/api/v1/user-documents/send-mail/?organisation_doc_reference_id=org-doc-123&doc_reference_id=doc-456" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Please sign this document",
    "data": [
      {
        "email": "signer1@example.com",
        "signature_type": "esign"
      },
      {
        "email": "signer2@example.com",
        "signature_type": "bankid"
      }
    ]
  }'
```

**Query Parameters:**
- `organisation_doc_reference_id` (required): Organization document reference ID
- `doc_reference_id` (optional): Document reference ID
- `language` (optional): Document language
- `download_pdf` (optional): Enable PDF download
- `expiry_date` (optional): Document expiry date (YYYY-MM-DD)
- `agreement_start_date` (optional): Agreement start date
- `agreement_end_date` (optional): Agreement end date

---

### 24. List Documents API
**Endpoint:** `GET /api/v1/user-documents/details/`

**Purpose:** Retrieve a paginated list of documents for your organization.

```bash
curl -X GET "${BASE_URL}/api/v1/user-documents/details/?document_organisation_reference_id=org-doc-123&page=1&page_size=20" \
  -H "Authorization: Bearer ${API_KEY}"
```

**Query Parameters:**
- `document_organisation_reference_id` (required): Organization reference ID
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Items per page (default: 10)
- `search` (optional): Search term for filtering documents
- `ordering` (optional): Ordering field (e.g., `-created_at`)

---

### 25. Create Document API
**Endpoint:** `POST /api/v1/user-documents/details/`

**Purpose:** Create a new document in the system.

```bash
curl -X POST "${BASE_URL}/api/v1/user-documents/details/" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: multipart/form-data" \
  -F "title=My Document" \
  -F "document_organisation_reference_id=org-doc-123" \
  -F "file=@/path/to/document.pdf"
```

**Form Data:**
- `title` (required): Document title
- `document_organisation_reference_id` (required): Organization reference ID
- `file` (required): Document file (PDF, DOCX, etc.)

---

### 26. Retrieve/Update/Delete Document API
**Endpoint:** `GET/PUT/DELETE /api/v1/user-documents/user-retrive-details/` or `/api/v1/user-documents/user-retrive-details/<reference_id>/`

**Purpose:** Retrieve, update, or delete a specific document.

```bash
# Retrieve document
curl -X GET "${BASE_URL}/api/v1/user-documents/user-retrive-details/?organisation_doc_reference_id=org-doc-123&reference_id=doc-456" \
  -H "Authorization: Bearer ${API_KEY}"

# Update document
curl -X PUT "${BASE_URL}/api/v1/user-documents/user-retrive-details/doc-456/?organisation_doc_reference_id=org-doc-123" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Document Title"
  }'

# Delete document
curl -X DELETE "${BASE_URL}/api/v1/user-documents/user-retrive-details/doc-456/?organisation_doc_reference_id=org-doc-123" \
  -H "Authorization: Bearer ${API_KEY}"
```

**Query Parameters:**
- `organisation_doc_reference_id` (required): Organization document reference ID
- `reference_id` (optional): Document reference ID (can be in URL path)

---

### 27. Update Latest Document File API
**Endpoint:** `PATCH /api/v1/user-documents/document-update-latest/`

**Purpose:** Update the latest document file for a document.

```bash
curl -X PATCH "${BASE_URL}/api/v1/user-documents/document-update-latest/?organisation_doc_reference_id=org-doc-123&document_reference_id=doc-456" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/updated-document.pdf"
```

**Query Parameters:**
- `organisation_doc_reference_id` (required): Organization document reference ID
- `document_reference_id` (required): Document reference ID

---

### 28. Manage Signers API
**Endpoint:** `GET/POST/PATCH /api/v1/user-documents/details/signers/` or `/api/v1/user-documents/details/signers/<reference_signer_id>/`

**Purpose:** Get, create, or update signers for a document.

```bash
# List signers for a document
curl -X GET "${BASE_URL}/api/v1/user-documents/details/signers/?organisation_doc_reference_id=org-doc-123&doc_reference_id=doc-456" \
  -H "Authorization: Bearer ${API_KEY}"

# Get specific signer
curl -X GET "${BASE_URL}/api/v1/user-documents/details/signers/signer-789/?organisation_doc_reference_id=org-doc-123&doc_reference_id=doc-456" \
  -H "Authorization: Bearer ${API_KEY}"

# Add signers to document
curl -X POST "${BASE_URL}/api/v1/user-documents/details/signers/?organisation_doc_reference_id=org-doc-123&doc_reference_id=doc-456" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "signers": [
      {
        "email": "signer1@example.com",
        "signature_type": "esign"
      }
    ]
  }'

# Update signer (PATCH allows unauthenticated access for email links)
curl -X PATCH "${BASE_URL}/api/v1/user-documents/details/signers/signer-789/" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "signed"
  }'
```

**Query Parameters:**
- `organisation_doc_reference_id` (required): Organization document reference ID
- `doc_reference_id` (required): Document reference ID
- `reference_signer_id` (optional): Signer reference ID (in URL path)

**Note:** PATCH method allows unauthenticated access (for signer updates via email links).

---

### 29. Update Signer Details API
**Endpoint:** `PUT /api/v1/user-documents/details/signers/<reference_signer_id>/update/`

**Purpose:** Update signer details (email, phone number) for a specific signer.

```bash
curl -X PUT "${BASE_URL}/api/v1/user-documents/details/signers/signer-789/update/?organisation_doc_reference_id=org-doc-123&doc_reference_id=doc-456" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "updated@example.com",
    "phone_number": "+1234567890"
  }'
```

**Query Parameters:**
- `organisation_doc_reference_id` (required): Organization document reference ID
- `doc_reference_id` (required): Document reference ID

---

### 30. Signer Update Management API
**Endpoint:** `POST /api/v1/user-documents/signer-edit/`

**Purpose:** Delete all signers for a document and add new signers.

```bash
curl -X POST "${BASE_URL}/api/v1/user-documents/signer-edit/?organisation_doc_reference_id=org-doc-123&doc_reference_id=doc-456" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "signers": [
      {
        "email": "new-signer1@example.com",
        "signature_type": "esign"
      },
      {
        "email": "new-signer2@example.com",
        "signature_type": "bankid"
      }
    ]
  }'
```

**Query Parameters:**
- `organisation_doc_reference_id` (required): Organization document reference ID
- `doc_reference_id` (required): Document reference ID

---

### 31. Document Signer Update API
**Endpoint:** `PATCH /api/v1/user-documents/sign/<reference_id>/documents/`

**Purpose:** Update signer status (e.g., mark as signed).

```bash
curl -X PATCH "${BASE_URL}/api/v1/user-documents/sign/doc-456/documents/" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "signed",
    "signer_reference_id": "signer-789"
  }'
```

---

### 32. Document Retrieve API
**Endpoint:** `POST /api/v1/user-documents/retrieve/<reference_id>/documents/`

**Purpose:** Retrieve document details and metadata.

```bash
curl -X POST "${BASE_URL}/api/v1/user-documents/retrieve/doc-456/documents/" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json"
```

---

### 33. Document Preview API
**Endpoint:** `GET /api/v1/user-documents/preview/<reference_id>/documents/`

**Purpose:** Get document preview with all details.

```bash
curl -X GET "${BASE_URL}/api/v1/user-documents/preview/doc-456/documents/" \
  -H "Authorization: Bearer ${API_KEY}"
```

---

### 34. Document View Details API
**Endpoint:** `GET /api/v1/user-documents/document-view-details/`

**Purpose:** Get detailed view of a document.

```bash
curl -X GET "${BASE_URL}/api/v1/user-documents/document-view-details/?doc_reference_id=doc-456&organisation_doc_reference_id=org-doc-123" \
  -H "Authorization: Bearer ${API_KEY}"
```

**Query Parameters:**
- `doc_reference_id` (optional): Document reference ID
- `organisation_doc_reference_id` (optional): Organization document reference ID

---

### 35. Activity Log API
**Endpoint:** `GET/POST /api/v1/user-documents/document-activity-history/`

**Purpose:** Get or create activity logs for documents.

```bash
# Get activity logs
curl -X GET "${BASE_URL}/api/v1/user-documents/document-activity-history/?organisation_doc_reference_id=org-doc-123" \
  -H "Authorization: Bearer ${API_KEY}"

# Create activity log
curl -X POST "${BASE_URL}/api/v1/user-documents/document-activity-history/" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "document_refrence_id": "doc-456",
    "event_type": "Viewed",
    "message": "Document viewed by user"
  }'
```

**Query Parameters:**
- `organisation_doc_reference_id` (optional): Organization document reference ID

---

### 36. Document Reminder API
**Endpoint:** `POST /api/v1/user-documents/document-reminder/`

**Purpose:** Send reminder emails to document signers.

```bash
curl -X POST "${BASE_URL}/api/v1/user-documents/document-reminder/?organization_doc_reference_id=org-doc-123" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Please remember to sign the document"
  }'
```

**Query Parameters:**
- `organization_doc_reference_id` (required): Organization document reference ID

---

### 37. Resend Signed Document API
**Endpoint:** `POST /api/v1/user-documents/documents/resend-signed/`

**Purpose:** Resend the signed document to users via email.

```bash
curl -X POST "${BASE_URL}/api/v1/user-documents/documents/resend-signed/" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "doc_reference_id": "doc-456",
    "organisation_doc_reference_id": "org-doc-123"
  }'
```

---

## 📝 Send Documents Flow APIs Notes

1. **Authentication**: All APIs support Developer API Key authentication via `Authorization: Bearer ${API_KEY}` header.

2. **Automatic Tracking**: All API calls made with API keys are automatically tracked for billing purposes.

3. **Feature Usage**: The system automatically extracts feature usage (e-signatures, BankID signatures) from requests and calculates costs.

4. **Error Handling**: All APIs return standard error responses with appropriate HTTP status codes.

5. **Pagination**: List endpoints support pagination via `page` and `page_size` query parameters.

6. **File Uploads**: Document creation and file updates use `multipart/form-data` content type.

7. **Reference IDs**: Most endpoints use reference IDs (strings) rather than UUIDs for easier integration.

---

## 📚 Additional Resources

### Send Document API Example

For detailed examples of how to use API keys with actual Skrivly API endpoints (like sending documents for signature), see the complete guide:

**[`SEND_DOCUMENT_API_EXAMPLE.md`](./SEND_DOCUMENT_API_EXAMPLE.md)**

This guide includes:
- Step-by-step instructions for sending documents via API
- Authentication examples (JWT and API key)
- Complete request/response examples
- Parameter documentation
- Error handling examples

### Complete API Reference

For a complete list of all APIs accessible via Developer API Keys, see:

**[`API_ACCESSIBLE_ENDPOINTS.md`](./API_ACCESSIBLE_ENDPOINTS.md)**

This document includes:
- All 15+ APIs in the send documents flow
- Detailed endpoint specifications
- Authentication requirements
- Usage tracking information
- Cost calculation details
