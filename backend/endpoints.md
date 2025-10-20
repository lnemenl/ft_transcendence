# Backend API Endpoints

This document describes all available backend endpoints for the authentication and user management system.

---

## Endpoints

### Registering a new user  
**`POST /api/register`**

**Request body:**
```json
{
  "email": "string",
  "password": "string",
  "username": "string"
}
```

**Responses:**
**201 Created** — User successfully registered  
  ```json
  {
    "id": "string",
    "email": "string",
    "username": "string"
  }
  ```
**400 Bad Request** — Invalid data or email already exists  
  ```json
  {
    "error": "User with this email already exists"
  }
  ```


### Logging in a user  
**`POST /api/login`**

**Request body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Responses:**
**200 OK** — Login successful, cookie set  
  ```json
  {
    "accessToken": "jwt.token.value"
  }
  ```
**401 Unauthorized** — Invalid credentials  
  ```json
  {
    "error": "Invalid email or password"
  }
  ```


### Logging out a user  
**`POST /api/logout`**

**No request body.**

**Responses:**
**200 OK** — Logout successful, cookie cleared  
  ```json
  {
    "ok": true
  }
  ```


### Getting the current user's profile  
**`GET /api/profile`**

Requires authentication (via cookie or Authorization header).

**Responses:**
**200 OK** — Returns authenticated user profile  
  ```json
  {
    "user": {
      "id": "string",
      "email": "string",
      "username": "string",
      "isTwoFactorEnabled": false,
      "createdAt": "2025-01-01T12:00:00.000Z",
      "updatedAt": "2025-01-01T12:00:00.000Z"
    }
  }
  ```
**401 Unauthorized** — No valid token  
  ```json
  {
    "error": "Unauthorized"
  }
  ```
**404 Not Found** — User not found in database  
  ```json
  {
    "error": "User not found"
  }
  ```


### Getting the currently logged-in user  
**`GET /api/users/me`**

Requires authentication.

**Responses:**
**200 OK** — Returns logged-in user's information  
  ```json
  {
    "id": "string",
    "email": "string",
    "username": "string",
    "avatarUrl": "string | null"
  }
  ```
**401 Unauthorized** — No valid cookie or token  
  ```json
  {
    "error": "Unauthorized"
  }
  ```
**404 Not Found** — User deleted after login  
  ```json
  {
    "error": "User not found"
  }
  ```


### Updating the current user's profile  
**`PATCH /api/users/me`**

Requires authentication.

**Request body:**  
*(At least one field is required)*

```json
{
  "username": "string (minLength: 2)",
  "avatarUrl": "string (valid URL)"
}
```

**Responses:**
**200 OK** — Returns the updated user  
  ```json
  {
    "id": "string",
    "email": "string",
    "username": "UpdatedName",
    "avatarUrl": "https://example.com/avatar.png"
  }
  ```
**401 Unauthorized** — Not logged in  
  ```json
  {
    "error": "Unauthorized"
  }
  ```
**400 Bad Request** — Invalid or empty body  
  ```json
  {
    "error": "Bad Request",
    "message": "username must be at least 2 characters long"
  }
  ```


### Getting another user's public profile  
**`GET /api/users/:id`**

Requires authentication.

**Responses:**
**200 OK** — Returns public info for another user  
  ```json
  {
    "id": "string",
    "username": "string"
  }
  ```
  *(Note: private fields like email are omitted.)*

**401 Unauthorized** — Not authenticated  
  ```json
  {
    "error": "Unauthorized"
  }
  ```
**404 Not Found** — No user with this ID  
  ```json
  {
    "error": "User not found"
  }
  ```
