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

### POST /api/login/player2

Authenticate a user and receive access tokens. refresh token will get revoked immidiately upon creation.

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

`401 Unauthorized`
```json
{
  "error": "Invalid email or password"
}
```

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
  "tournamentId": "string",
}
```
- `tournamentId` is optional, required only when a game is part of a tournament
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
  "ceatedAt": "string"
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
      "ceatedAt": "string"
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
  "ceatedAt": "string"
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
      "ceatedAt": "string"
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
      "ceatedAt": "string"
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
