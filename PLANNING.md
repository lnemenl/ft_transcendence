# ft_transcendence Backend Development Plan

## Chosen Modules

**Target: 7 Major Modules for 100% completion**

### Web
- **[x] Major: Use a Framework as Backend** (Fastify with Node.js)
- **[x] Minor: Use a Database** (SQLite with Prisma) = 0.5 major equivalent

### Cybersecurity
- **[x] Major: Implement Two-Factor Authentication (2FA) and JWT**

### User Management
- **[ ] Major: Standard User Management, Authentication, Users Across Tournaments** (Partial)
- **[ ] Major: Implementing Remote Authentication** (Google Sign-In)


## 1. Completed Features

### Infrastructure
-   **[x] Project Setup**: Fastify server with Docker
-   **[x] Database**: SQLite with Prisma ORM
-   **[x] Authentication**: JWT with access + refresh tokens (httpOnly cookies)
-   **[x] Security**: bcrypt password hashing, protected routes

### Authentication & Users
-   **[x] User Registration**: Email, username, password
-   **[x] User Login**: JWT-based with refresh tokens
-   **[x] User Profile**: View (`GET /api/profile`), update (`PATCH /api/users/me`)
-   **[x] Public Profiles**: View other users (`GET /api/users/:id`)
-   **[x] Player 2 Login**: For local multiplayer (`POST /api/login/player2`)

### Two-Factor Authentication (2FA)
-   **[x] Generate TOTP Secret**: `POST /api/2fa/generate` (with QR code)
-   **[x] Enable 2FA**: `POST /api/2fa/enable` (verify token)
-   **[x] Login with 2FA**: Two-step authentication flow
-   **[x] Verify 2FA Code**: `POST /api/2fa/verify` (complete login)
-   **[x] Disable 2FA**: `POST /api/2fa/disable` (with code confirmation)

### Game System
-   **[x] Game Model**: Players, winner, tournament support
-   **[x] Create Game**: `POST /api/games` (local multiplayer)
-   **[x] View Games**: `GET /api/games` (all), `GET /api/games/:id` (single)
-   **[x] User Games**: `GET /api/games/me`, `GET /api/games/me/won`
-   **[x] Tournament Models**: Tournament, TournamentParticipant

---

## 2. In Progress / Remaining Work

### Standard User Management (Complete for Major Module)

**Missing Features:**
- **[ ] Friends System**
  - Add `Friend` model to Prisma schema
  - `POST /api/users/:id/friend` - Add friend
  - `GET /api/users/me/friends` - List friends  
  - `DELETE /api/users/:id/friend` - Remove friend
  
- **[ ] User Statistics**
  - Extend `GET /api/profile` or create `GET /api/users/:id/stats`
  - Calculate wins/losses from Game model
  - Display on user profile
  
- **[ ] Match History**
  - `GET /api/users/:id/matches` - List user's game history
  - Include dates, opponents, results

---

### Remote Authentication (Google Sign-In)

**Required for Major Module:**
- **[ ] Google OAuth Setup**
  - Register with Google Cloud Console
  - Obtain Client ID and Secret
  
- **[ ] Backend Implementation**
  - Install `google-auth-library` or `@fastify/oauth2`
  - `POST /api/auth/google` endpoint
  - Verify Google ID token
  - Create or login user based on Google email
  - Issue JWT tokens
  
- **[ ] Environment Configuration**
  - Store Google credentials in `.env`
  - Update documentation


## 3. API Endpoints Summary

### Authentication
- `POST /api/register`
- `POST /api/login`
- `POST /api/login/player2`
- `POST /api/logout`
- `POST /api/auth/google` (TODO)

### Two-Factor Authentication
- `POST /api/2fa/generate`
- `POST /api/2fa/enable`
- `POST /api/2fa/verify`
- `POST /api/2fa/disable`

### Users & Profile
- `GET /api/profile`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `GET /api/users/:id`
- `GET /api/users/:id/stats` (TODO)
- `GET /api/users/:id/matches` (TODO)
- `POST /api/users/:id/friend` (TODO)
- `GET /api/users/me/friends` (TODO)
- `DELETE /api/users/:id/friend` (TODO)

### Games
- `POST /api/games`
- `GET /api/games`
- `GET /api/games/:id`
- `GET /api/games/me`
- `GET /api/games/me/won`

---

## 6. Next Steps

**Immediate Priority:**
1. Complete friends system implementation
2. Add user statistics endpoints
3. Implement match history
4. Set up Google OAuth integration

**Target:** Backend completion (5/7 major modules)
