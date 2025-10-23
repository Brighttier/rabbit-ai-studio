# Admin User Creation Testing Guide

This document provides step-by-step instructions to test the admin user creation functionality that was just fixed.

## What Was Fixed

1. **API Error Codes** - Added proper error codes to all error responses in `/api/admin/users/route.ts`:
   - `FAILED_TO_LIST_USERS`
   - `EMAIL_ALREADY_EXISTS`
   - `FAILED_TO_CREATE_USER`

2. **IAM Permissions** - Granted `roles/firebaseauth.admin` to the Firebase App Hosting service account to allow user creation in production

3. **Deployment** - Changes have been pushed and deployed to production

## Test Steps

### Prerequisites
- You must be logged in as an **admin user** to access the user management page
- Navigate to: https://rabbit.brighttier.com

### Step 1: Access Admin Panel

1. Log in to Rabbit AI Studio
2. Click on the **Admin** button in the top navigation
3. Click on **Users** in the left sidebar

You should see the **User Management** page with:
- A list of existing users
- A **Create New User** button

### Step 2: Create a Test User

1. Click the **Create New User** button
2. Fill in the form:
   ```
   Email:        test.user@example.com
   Password:     TestPassword123!
   Display Name: Test User
   Role:         user  (or admin for testing)
   ```
3. Click **Create User**

### Expected Results

#### ✅ Success Case
If user creation succeeds, you should see:
- A success message: "User created successfully"
- The new user appears in the user list
- User details show:
  - Email: test.user@example.com
  - Display Name: Test User
  - Role: user (or admin)
  - Created timestamp

#### ❌ Error Case: Email Already Exists
If you try to create a user with an existing email:
- Error message: "A user with this email already exists"
- Error code: `EMAIL_ALREADY_EXISTS`
- HTTP status: 400

#### ❌ Error Case: Missing Fields
If you leave required fields empty:
- Error message: "Missing required fields: email, password, displayName, role"
- Error code: `VALIDATION_ERROR`
- HTTP status: 400

#### ❌ Error Case: Invalid Email
If you enter an invalid email format:
- Error message: "Invalid email format"
- Error code: `VALIDATION_ERROR`
- HTTP status: 400

#### ❌ Error Case: Weak Password
If password is less than 6 characters:
- Error message: "Password must be at least 6 characters"
- Error code: `VALIDATION_ERROR`
- HTTP status: 400

### Step 3: Verify User Was Created

1. Check Firebase Authentication:
   - Go to [Firebase Console](https://console.firebase.google.com/project/tanzen-186b4/authentication/users)
   - The new user should appear in the user list
   - Custom claims should be set: `{ "mustChangePassword": true, "role": "user" }`

2. Check Firestore:
   - Go to [Firestore Console](https://console.firebase.google.com/project/tanzen-186b4/firestore/data)
   - Navigate to `users` collection
   - Find the document with the user's UID
   - Verify all fields are present:
     - uid
     - email
     - displayName
     - role
     - createdAt
     - updatedAt

### Step 4: Test User Login (Optional)

1. Log out of the admin account
2. Try logging in with the newly created user:
   ```
   Email:    test.user@example.com
   Password: TestPassword123!
   ```
3. Since `mustChangePassword` is set to true, the user might be prompted to change their password

## API Testing (Advanced)

If you want to test the API directly:

### Test GET /api/admin/users

```bash
curl https://rabbit.brighttier.com/api/admin/users \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "uid": "...",
      "email": "...",
      "displayName": "...",
      "role": "admin|user",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### Test POST /api/admin/users

```bash
curl -X POST https://rabbit.brighttier.com/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -d '{
    "email": "another.user@example.com",
    "password": "SecurePass123!",
    "displayName": "Another User",
    "role": "user"
  }'
```

Expected success response:
```json
{
  "success": true,
  "data": {
    "uid": "...",
    "email": "another.user@example.com",
    "displayName": "Another User",
    "role": "user",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

## Troubleshooting

### Still Getting 500 Error?

1. **Check IAM Permissions**:
   ```bash
   gcloud projects get-iam-policy tanzen-186b4 \
     --flatten="bindings[].members" \
     --filter="bindings.members:firebase-app-hosting-compute@tanzen-186b4.iam.gserviceaccount.com" \
     --format="table(bindings.role)"
   ```

   Should include:
   - `roles/firebaseauth.admin`
   - `roles/compute.instanceAdmin.v1`

2. **Check Recent Deployment**:
   ```bash
   gcloud run revisions list \
     --service=rabbit-ai-studio-main \
     --region=us-central1 \
     --project=tanzen-186b4 \
     --limit=3
   ```

   Make sure the latest revision is deployed and receiving traffic

3. **Check Application Logs**:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision \
     AND resource.labels.service_name=rabbit-ai-studio-main \
     AND severity>=ERROR" \
     --limit=50 \
     --format=json \
     --project=tanzen-186b4
   ```

### Getting 401 Unauthorized?

- Make sure you're logged in as an authenticated user
- Check that your Firebase ID token is valid
- Try logging out and logging back in

### Getting 403 Forbidden?

- Make sure your user has the `admin` role
- Check your user document in Firestore: `/users/{your_uid}`
- The `role` field should be set to `"admin"`

## Verification Checklist

- [ ] Can access Admin → Users page
- [ ] Can see list of existing users
- [ ] Can click "Create New User" button
- [ ] Can fill in user creation form
- [ ] Can successfully create a new user
- [ ] New user appears in Firebase Authentication
- [ ] New user document appears in Firestore
- [ ] Error messages are clear and helpful
- [ ] No 500 errors when creating users

## Summary

The admin user creation feature has been fixed and deployed. The main issues were:
1. Missing error codes in API responses
2. Insufficient IAM permissions for the service account

Both issues have been resolved, and the feature should now work correctly in production.

---

**Last Updated**: 2025-10-23
**Deployed Commit**: c4e8630 (Use Application Default Credentials for Firebase Admin SDK in production)
