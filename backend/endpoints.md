# Backend API Endpoints

## Authentication

### POST /api/register

Register a new user account.

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "string",
  "username": "string"
}
```

**Validation**
- `email`: Valid email format, required
- `password`: Minimum 8 characters, required
- `username`: Minimum 2 characters, required

**Responses**

`201 Created`
```json
{
  "id": "string",
  "email": "string",
  "username": "string"
}
```

`400 Bad Request`
```json
{
  "error": "User with this email already exists"
}
```
OR
```json
{
  "error": "Username already taken"
}
```

### POST /api/login

Authenticate a user and receive access tokens.

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "string"
}
```

OR

```json
{
  "username": "string",
  "password": "string"
}
```

**Validation**
- Either `email` or `username` must be provided
- `password`: Required

**Responses**

`200 OK`
```json
{
  "id": "string",
  "username": "string",
  "avatarUrl": "string | null",
  "accessToken": "string"
}
```

Sets HTTP-only cookies:
- `accessToken`: Expires in 15 minutes
- `refreshToken`: Expires in 14 days

`401 Unauthorized`
```json
{
  "error": "Invalid email or password"
}
```

## Two-Factor Authentication (2FA)

These endpoints implement TOTP-based 2FA for user accounts. All tokens are time-based and codes rotate every 30 seconds.

### POST /api/2fa/generate

Generate a new TOTP secret and QR code for setup.

**Authentication**: Required

**Responses**

`200 OK`
```json
{
  "secret": "string",          // Base32 secret (keep temporarily on frontend)
  "otpauthUrl": "string",     // otpauth:// URI for QR generation (optional)
  "qrCodeDataUrl": "string"   // data:image/png;base64,... (can be used directly in <img>)
}
```

`404 Not Found`
```json
{
  "error": "User not found"
}
```

`401 Unauthorized`
```json
{
  "error": "Unauthorized"
}
```

`500 Internal Server Error`
```json
{
  "error": "Internal server error"
}
```

### POST /api/2fa/enable

Enable 2FA for the authenticated user by proving the frontend verified the secret.

**Authentication**: Required

**Request Body**
```json
{
  "SixDigitCode": "string"     // current 6-digit TOTP code from authenticator app
}
```

**Responses**

`200 OK`
```json
{
  "enabled": true
}
```

`400 Bad Request`
```json
{
  "error": "No 2FA secret found. Please call /generate first."
}
```

`401 Unauthorized`
```json
{
  "error": "Invalid 2FA token"
}
```

`500 Internal Server Error`
```json
{
  "error": "Internal server error"
}
```

**Notes**
- The secret is automatically retrieved from the database (stored during `/api/2fa/generate`)
- The frontend should have called `/api/2fa/generate` first to store the secret


### POST /api/2fa/verify

Verify a two-factor code during login and complete authentication by issuing access/refresh cookies.

**Authentication**: Not required — this uses a temporary `twoFactorToken` issued by `/api/login` when an account has 2FA enabled.

**Request Body**
```json
{
  "twoFactorToken": "string", // temporary JWT returned by /api/login when 2FA is required
  "SixDigitCode": "string"            // current 6-digit TOTP code from authenticator app
}
```

**Responses**

`200 OK`
Sets HTTP-only cookies (`accessToken`, `refreshToken`) and returns:
```json
{
  "ok": true
}
```

`401 Unauthorized`
```json
{
  "error": "Invalid or expired 2FA session"
}
```

`401 Unauthorized` (also used for other failures)
```json
{
  "error": "Invalid 2FA token"
}
```

`500 Internal Server Error`
```json
{
  "error": "Internal server error"
}
```

Notes:
- `/api/login` will return a short-lived `twoFactorToken` instead of full auth when the account has 2FA enabled. The frontend must call `/api/2fa/verify` with that token and the user-entered code to finish login.
- The endpoint sets httpOnly cookies for browser use and returns `{ ok: true }` in JSON.

### POST /api/2fa/disable

Disable 2FA for the authenticated user (requires entering a current TOTP code).

**Authentication**: Required

**Request Body**
```json
{
  "SixDigitCode": "string"  // current 6-digit TOTP code
}
```

**Responses**

`200 OK`
```json
{
  "disabled": true
}
```

`400 Bad Request`
```json
{
  "error": "2FA is not enabled"
}
```

`401 Unauthorized`
```json
{
  "error": "Invalid 2FA token"
}
```


### POST /api/login/player2

Authenticate a user and receive an access token for player 2 mode. The refresh token is immediately revoked upon creation.

**Authentication**: Required

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "string"
}
```

OR

```json
{
  "username": "string",
  "password": "string"
}
```

**Validation**
- Either `email` or `username` must be provided
- `password`: Required

**Responses**

`200 OK`
```json
{
  "id": "string",
  "username": "string",
  "avatarUrl": "string | null",
  "accessToken": "string"
}
```

Sets HTTP-only cookie:
- `player2_token`: Expires in 1 hour

`200 OK` (when 2FA is enabled)
```json
{
  "twoFactorRequired": true,
  "twoFactorToken": "string"
}
```

`401 Unauthorized`
```json
{
  "error": "Invalid email or password"
}
```

### POST /api/login/tournament

Authenticate a user for tournament mode. The refresh token is immediately revoked upon creation.

**Authentication**: Required

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "string"
}
```

OR

```json
{
  "username": "string",
  "password": "string"
}
```

**Validation**
- Either `email` or `username` must be provided
- `password`: Required

**Responses**

`200 OK`
```json
{
  "id": "string",
  "username": "string",
  "avatarUrl": "string | null"
}
```

No tokens are returned (they are not needed for tournament mode).

`200 OK` (when 2FA is enabled)
```json
{
  "twoFactorRequired": true,
  "twoFactorToken": "string"
}
```

`401 Unauthorized`
```json
{
  "error": "Invalid email or password"
}
```

## Google OAuth Authentication

### GET /api/google/init

Initiate Google OAuth authentication flow.

**Query Parameters**
- `type`: "main" | "player2" | "tournament" (required)
  - `main`: Standard user authentication
  - `player2`: Player 2 mode authentication
  - `tournament`: Tournament mode authentication

**Responses**

`302 Found`
Redirects to Google's authorization endpoint with authorization URL containing:
- OAuth consent screen (if user hasn't authorized before)
- State parameter for CSRF protection (stored in httpOnly cookie)

**Notes**
- Sets an `oauth_state` cookie that expires in 10 minutes for CSRF protection
- The returned authorization URL redirects user to Google's login/consent page

### GET /api/google/callback

Google OAuth callback for main user authentication.

**Query Parameters** (provided by Google)
- `code`: Authorization code from Google (required)
- `state`: State parameter for CSRF verification (required)
- `error`: Error code if user denied access (optional)

**Responses**

`200 OK`
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "avatarUrl": "string | null",
  "accessToken": "string",
  "refreshToken": "string"
}
```

Sets HTTP-only cookies:
- `accessToken`: Expires in 15 minutes
- `refreshToken`: Expires in 14 days

`400 Bad Request`
```json
{
  "error": "State mismatch"
}
```
OR
```json
{
  "error": "No code provided"
}
```

`401 Unauthorized`
```json
{
  "error": "User denied access"
}
```

**Notes**
- If user doesn't exist, a new account is automatically created with data from Google
- CSRF protection verified by comparing state parameter with stored cookie

### GET /api/google/callback/player2

Google OAuth callback for player 2 authentication.

**Query Parameters** (provided by Google)
- `code`: Authorization code from Google (required)
- `state`: State parameter for CSRF verification (required)
- `error`: Error code if user denied access (optional)

**Responses**

`200 OK`
```json
{
  "id": "string",
  "username": "string",
  "avatarUrl": "string | null",
  "accessToken": "string"
}
```

Sets HTTP-only cookie:
- `player2_token`: Expires in 15 minutes

`400 Bad Request`
```json
{
  "error": "State mismatch"
}
```
OR
```json
{
  "error": "No code provided"
}
```

`401 Unauthorized`
```json
{
  "error": "User denied access"
}
```

**Notes**
- If user doesn't exist, a new account is automatically created with data from Google
- Only returns access token (refresh token is not used)

### GET /api/google/callback/tournament

Google OAuth callback for tournament mode authentication.

**Query Parameters** (provided by Google)
- `code`: Authorization code from Google (required)
- `state`: State parameter for CSRF verification (required)
- `error`: Error code if user denied access (optional)

**Responses**

`200 OK`
```json
{
  "id": "string",
  "username": "string",
  "avatarUrl": "string | null"
}
```

No tokens are set for tournament mode.

`400 Bad Request`
```json
{
  "error": "State mismatch"
}
```
OR
```json
{
  "error": "No code provided"
}
```

`401 Unauthorized`
```json
{
  "error": "User denied access"
}
```

**Notes**
- If user doesn't exist, a new account is automatically created with data from Google
- No authentication tokens are provided for tournament mode

### POST /api/logout

Invalidate the current session and clear authentication cookies.

**Authentication**: Not required

**Responses**

`200 OK`
```json
{
  "ok": true
}
```

**Notes**
- Clears `accessToken`, `refreshToken`, and `player2_token` cookies
- Revokes the refresh token from the database

## User Profile

### GET /api/profile

Get the authenticated user's detailed profile.

**Authentication**: Required

**Responses**

`200 OK`
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

`401 Unauthorized`
```json
{
  "error": "Unauthorized"
}
```

`404 Not Found`
```json
{
  "error": "User not found"
}
```

`500 Internal Server Error`
```json
{
  "error": "Internal server error"
}
```

## User Management

### GET /api/users/me

Get the authenticated user's information.

**Authentication**: Required

**Responses**

`200 OK`
```json
{
  "id": "string",
  "email": "string",
  "username": "string",
  "avatarUrl": "string | null"
}
```

`401 Unauthorized`
```json
{
  "error": "Unauthorized"
}
```

`404 Not Found`
```json
{
  "error": "User not found"
}
```

`500 Internal Server Error`
```json
{
  "error": "Internal server error"
}
```

### PATCH /api/users/me

Update the authenticated user's profile.

**Authentication**: Required

**Request Body**

At least one field required:
```json
{
  "username": "string",
  "avatarUrl": "string"
}
```

**Validation**
- `username`: Minimum 2 characters
- `avatarUrl`: Valid URI format

**Responses**

`200 OK`
```json
{
  "id": "string",
  "email": "string",
  "username": "string",
  "avatarUrl": "string | null",
  "friends": [
    {
      "id": "string",
      "username": "string",
      "avatarUrl": "string | null"
    }
  ]
}
```

`401 Unauthorized`
```json
{
  "error": "Unauthorized"
}
```

`404 Not Found`
```json
{
  "error": "User not found"
}
```

`500 Internal Server Error`
```json
{
  "error": "Internal server error"
}
```

### GET /api/users/:id

Get a user's public profile by ID.

**Authentication**: Required

**URL Parameters**
- `id`: User ID (string)

**Responses**

`200 OK`
```json
{
  "id": "string",
  "username": "string",
  "avatarUrl": "string | null"
}
```

`401 Unauthorized`
```json
{
  "error": "Unauthorized"
}
```

`404 Not Found`
```json
{
  "error": "User not found"
}
```

`500 Internal Server Error`
```json
{
  "error": "Internal server error"
}
```

### DELETE /api/users/me/friends/:id

Delete a friend by ID

**Authentication**: Required

**URL Parameters**
- `id`: Friends user ID (string)

**Responses**

`200 OK`
```json
{
  "id": "string",
  "username": "string",
  "avatarUrl": "string | null"
}
```
- The user returned is the information about the deleted friend

`404 Not Found`
```json
{
  "error": "string"
}
```

`500 Internal server error`
```json
{
  "error": "string"
}
```

### POST /api/friend-request/:id

Send a friend request to another user by ID

**Authentication**: Required

**URL Parameters**
- `id`: User ID to whom the friend request will be sent to

**Responses**

`201 Created`
```json
{
  "id": "string",
  "receiver": {
    "id": "string",
    "username": "string",
    "avatarUrl": "string | null"
  }
}
```

`400 Bad Request`
```json
{
  "error": "string"
}
```

`404 Not Found`
```json
{
  "error": "string"
}
```

`500 Internal server error`
```json
{
  "error": "string"
}
```

### GET /api/friend-request/me

Get all friend requests sent and received

**Authentication**: Required

**Responses**

`200 OK`
```json
{
  "sentFriendRequests": [
    {
      "id": "string",
      "receiver": {
        "id": "string",
        "username": "string",
        "avatarUrl": "string | null"
      }
    },
    { ... },
  ],
  "receivedFriendRequests": [
    {
      "id": "string",
      "sender": {
        "id": "string",
        "username": "string",
        "avatarUrl": "string | null"
      }
    },
    { ... },
  ]
}
```

`500 Internal server error`
```json
{
  "error": "string"
}
```

### PATCH /api/friend-request/:id

Accept the friend request received by ID

**Authentication**: Required

**URL Parameters**
- `id`: The friend request ID

**Responses**

`200 OK`
```json
{
  "id": "string",
  "username": "string",
  "avatarUrl": "string"
}
```
- The sender of the friend request is returned

`400 Bad Request`
```json
{
  "error": "string"
}
```

`404 Not Found`
```json
{
  "error": "string"
}
```

`500 Internal Server Error`
```json
{
  "error": "string"
}
```

### DELETE /api/friend-request/:id

Decline the friend request received or delete friend request sent by ID

**Authentication**: Required

**URL Parameters**
- `id`: The friend request ID

**Responses**

`200 OK`
```json
{
  "ok": "boolean"
}
```

`404 Not Found`
```json
{
  "error": "string"
}
```

`500 Internal Server Error`
```json
{
  "error": "string"
}
```

## Notes

**Authentication Method**
- HTTP-only cookies (automatically sent with requests)

**Cookie Configuration**
- `httpOnly`: true (prevents JavaScript access)
- `path`: /
- `secure`: true in production (HTTPS only)
- `sameSite`: lax (CSRF protection)

**Token Refresh**
- Access token expires in 15 minutes
- Refresh token expires in 14 days
- If access token is invalid, the refresh token is automatically used to issue a new access token

## Game

### POST /api/games

Create a new game

**Authentication**: Required

**Request Body**

```json
{
  "winner": "number",
}
```
- `winner` can be `1` or `2`
  - `1`: player 1 won the game
  - `2`: player 2 won the game

**Responses**

`200 OK`
```json
{
  "ok": "boolean"
}
```
- This response is sent when player2 has not logged in and a game entry has not been created.

`201 Created`
```json
{
  "id": "string",
  "winner" {
    "id": "string",
    "username": "string",
    "avatarUrl": "string | null"
  },
  "players": [
    {
      "id": "string",
      "username": "string",
      "avatarUrl": "string | null"
    },
    {
      "id": "string",
      "username": "string",
      "avatarUrl": "string | null"
    }
  ],
  "createdAt": "string"
}
```

`400 Bad Request`
```json
{
  "error": "string"
}
```

`404 Not Found`
```json
{
  "error": "string"
}
```

`500 Internal server error`
```json
{
  "error": "string"
}
```

### GET /api/games

Sends an array of all games

**Authentication**: Required

**Responses**

`200 OK`
```json
{
  [
    {
      "id": "string",
      "winner" {
        "id": "string",
        "username": "string",
        "avatarUrl": "string | null"
      },
      "players": [
        {
          "id": "string",
          "username": "string",
          "avatarUrl": "string | null"
        },
        {
          "id": "string",
          "username": "string",
          "avatarUrl": "string | null"
        }
      ],
      "createdAt": "string"
    },
    {...}
  ]
}
```

`500 Internal server error`
```json
{
  "error": "string"
}
```

### GET /api/games/:id

Sends the game information found by `id`

**Authentication**: Required

**URL Parameters**
- `id`: Game ID (string)

**Responses**

`200 OK`
```json
{
  "id": "string",
  "winner" {
    "id": "string",
    "username": "string",
    "avatarUrl": "string | null"
  },
  "players": [
    {
      "id": "string",
      "username": "string",
      "avatarUrl": "string | null"
    },
    {
      "id": "string",
      "username": "string",
      "avatarUrl": "string | null"
    }
  ],
  "createdAt": "string"
}
```

`400 Bad Request`
```json
{
  "error": "string"
}
```

`500 Internal server error`
```json
{
  "error": "string"
}
```

### GET /api/games/me

Sends an array of all games the user has participated in

**Authentication**: Required

**Responses**

`200 OK`
```json
{
  [
    {
      "id": "string",
      "winner" {
        "id": "string",
        "username": "string",
        "avatarUrl": "string | null"
      },
      "players": [
        {
          "id": "string",
          "username": "string",
          "avatarUrl": "string | null"
        },
        {
          "id": "string",
          "username": "string",
          "avatarUrl": "string | null"
        }
      ],
      "createdAt": "string"
    },
    {...}
  ]
}
```

`404 Not found`
```json
{
  "error": "string"
}
```

`500 Internal server error`
```json
{
  "error": "string"
}
```

### GET /api/games/me/won

Sends an array of all games the user has won

**Authentication**: Required

**Responses**

`200 OK`
```json
{
  [
    {
      "id": "string",
      "winner" {
        "id": "string",
        "username": "string",
        "avatarUrl": "string | null"
      },
      "players": [
        {
          "id": "string",
          "username": "string",
          "avatarUrl": "string | null"
        },
        {
          "id": "string",
          "username": "string",
          "avatarUrl": "string | null"
        }
      ],
      "createdAt": "string"
    },
    {...}
  ]
}
```

`404 Not Found`
```json
{
  "error": "string"
}
```

`500 Internal server error`
```json
{
  "error": "string"
}
```

## Tournament

### POST /api/tournament

Create a tournament. Accepts 4 participants only

**Authentication**: Required

**Request Body**

```json
{
  "participants": [ "string" ]
}
```

- `participants` is an array of user id's

**Responses**

`201 Created`
```json
{
  "tournamentId": "string",
}
```

- `tournamentId` is the id of the tournament that can be used to add games to the tournament

`400 Bad Request`
```json
{
  "error": "string"
}
```

`404 Not Found`
```json
{
  "error": "string"
}
```

`500 Internal server error`
```json
{
  "error": "string"
}
```

### POST /api/tournament/game

This endpoint is for tournament game creation. **Use this endpoint**

**Authentication**: Required

**Request Body**
```json
{
  "winner": "number",
  "players": "array",
  "tournamentId": "string"
}
```

- `tournamentId` is the id of the tournament the game is part of
- `winner` can be `1` or `2`
  - `1`: player 1 won the game
  - `2`: player 2 won the game
- `participants` is an array of user id's, **Only 2 is accepted**

**Responses**:

`201 Created`
```json
{
  "id": "string",
  "winner" {
    "id": "string",
    "username": "string",
    "avatarUrl": "string | null"
  },
  "players": [
    {
      "id": "string",
      "username": "string",
      "avatarUrl": "string | null"
    },
    {
      "id": "string",
      "username": "string",
      "avatarUrl": "string | null"
    }
  ],
  "createdAt": "string"
}
```

`400 Bad Request`
```json
{
  "error": "string"
}
```

`404 Not Found`
```json
{
  "error": "string"
}
```

`500 Internal server error`
```json
{
  "error": "string"
}
```

### GET /api/tournament/:id

This endpoint is for fetching tournament data by the tournament id

**Authentication**: Required

**Responses**

`200 OK`
```json
{
  "id": "string",
  "winner": {
    "id": "string",
    "username": "string",
    "avatarUrl": "string"
  },
  "participants": [
    {
      "id": "string",
      "username": "string",
      "avatarUrl": "string"
    },
    { ... },
  ],
  "games": [
    {
      "id": "string",
      "winner": {
        "id": "string",
        "username": "string",
        "avatarUrl": "string"
      },
      "players": [
        {
          "id": "string",
          "username": "string",
          "avatarUrl": "string"
        },
        { ... },
      ],
      "createdAt": "string"
    },
    { ... },
  ],
  "startDate": "string",
  "endDate": "string"
}
```

`500 Internal server error`
```json
{
  "error": "string"
}
```

### PATCH /api/tournament/:id

This endpoint will timestamp the tournament as finished and requires a winner in the body

**Authentication**: Required

**Request Body**
```json
{
  "winner": "string"
}
```

- `winner` is the user id of the participant who won the tournament

**Responses**

`200 OK`
```json
{
  "id": "string",
  "winner": {
    "id": "string",
    "username": "string",
    "avatarUrl": "string"
  },
  "participants": [
    {
      "id": "string",
      "username": "string",
      "avatarUrl": "string"
    },
    { ... },
  ],
  "games": [
    {
      "id": "string",
      "winner": {
        "id": "string",
        "username": "string",
        "avatarUrl": "string"
      },
      "players": [
        {
          "id": "string",
          "username": "string",
          "avatarUrl": "string"
        },
        { ... },
      ],
      "createdAt": "string"
    },
    { ... },
  ],
  "startDate": "string",
  "endDate": "string"
}
```

`404 Not Found`
```json
{
  "error": "string"
}
```

`500 Internal server error`
```json
{
  "error": "string"
}
```