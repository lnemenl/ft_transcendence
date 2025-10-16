# ft_transcendence Backend Development Plan

This document outlines the tasks, responsibilities, and workflow for the backend team. Our architecture is a monolithic Node.js/Fastify application.

## 1. Current Status: Foundation Complete

We have successfully built the initial project foundation.

-   **[x] Project Setup**: Monorepo structure is in place.
-   **[x] Containerization**: A working `docker-compose.yml` is configured.
-   **[x] Web Framework**: A basic **Fastify** server is running.
-   **[x] Tooling**: **ESLint** and **Prettier** are enforcing code quality.
-   **[x] Database ORM**: **Prisma** is connected to an **SQLite** database.
-   **[x] Initial Data Model**: The `User` model is defined.
-   **[x] Core Feature**: User registration with **bcrypt** password hashing is implemented.

## 2. The Plan: Task Breakdown

The remaining work is broken down into issues. Each issue should be created on GitHub and added to our project board.

---

### Tasks for Dev 1 (User & Authentication Lead)

Focus is on identity, security, and social features.

**Issue #1: `feat: Implement User Login with JWT`**
* **User Story**: As a registered user, I want to log in with my email and password so that I can access my account.
* **Acceptance Criteria**:
    * [x] Create a `POST /api/login` endpoint.
    * [x] The endpoint validates the user's email and password against the database.
    * [x] It compares the provided password with the stored hash using `bcrypt.compareSync`.
    * [x] On successful login, it generates a signed JSON Web Token (JWT) using `jsonwebtoken`.
    * [x] The JWT payload must contain the user's ID (`sub: user.id`).
    * [x] The JWT is returned to the user in the response body.
    * [x] Secrets for signing the JWT are stored in and loaded from the `.env` file.

**Issue #2: `chore: Implement Protected Route Middleware`**
* **User Story**: As a developer, I want a reusable way to protect certain API endpoints so that only authenticated users can access them.
* **Acceptance Criteria**:
    * [x] Create a middleware or a `preHandler` hook in Fastify.
    * [x] The hook checks for a valid JWT in the `Authorization: Bearer <token>` header of incoming requests. (Replaced with Fasity plugins and cookies for better security)
    * [x] If the token is valid, the user's information (especially the ID) is attached to the request object for later use.
    * [x] If the token is missing or invalid, the hook sends a `401 Unauthorized` error and stops the request.

**Issue #3: `feat: Implement User Profile Management`**
* **User Story**: As a logged-in user, I want to view and update my profile information, and view the public profiles of other users.
* **Acceptance Criteria**:
    * [ ] Create a `GET /api/users/me` endpoint that uses the protected route middleware to fetch and return the currently logged-in user's data (excluding the password).
    * [ ] Create a `PATCH /api/users/me` endpoint to update the logged-in user's details (e.g., display name, avatar URL).
    * [ ] Create a `GET /api/users/:id` endpoint to fetch a public view of any user's profile.
    * [ ] All these endpoints must be protected by the JWT middleware.

**Issue #4: `feat: Implement Two-Factor Authentication (2FA)`**
* **User Story**: As a security-conscious user, I want to enable 2FA on my account to protect it from unauthorized access.
* **Acceptance Criteria**:
    * [ ] Update the `User` model in `schema.prisma` to include `twoFactorSecret` (String, optional) and `isTwoFactorEnabled` (Boolean, default: false).
    * [ ] Create a `POST /api/2fa/generate` endpoint that generates a new TOTP secret and a QR code data URL for the logged-in user. It should return the QR code URL to the frontend.
    * [ ] Create a `POST /api/2fa/enable` endpoint that verifies a TOTP token provided by the user and, if valid, saves the secret to their user record and sets `isTwoFactorEnabled` to `true`.
    * [ ] Modify the `POST /api/login` logic: if a user has 2FA enabled, the initial login response should indicate that a 2FA step is required. A separate `POST /api/2fa/verify` endpoint will be needed to complete the login.

**Issue #5: `feat: Implement Remote Authentication (Google)`**
* **User Story**: As a new user, I want to sign up or log in using my Google account for convenience.
* **Acceptance Criteria**:
    * [ ] Create a `POST /api/auth/google` endpoint.
    * [ ] The endpoint receives an authentication token from the frontend (which handled the Google Sign-In popup).
    * [ ] The backend verifies the Google token to get the user's email and profile information.
    * [ ] If a user with that email already exists, log them in and issue a JWT.
    * [ ] If no user with that email exists, create a new user account and then issue a JWT.
    * [ ] Ensure Google Client ID/Secret are stored securely in the `.env` file.

---

### Tasks for Dev 2 (Game, Data & Comms Lead)

Focus is on gameplay mechanics, real-time events, and statistics.

**Issue #6: `feat: Create Game Data Models and API`**
* **User Story**: As a developer, I need the database structure and basic APIs to store and retrieve information about games and tournaments.
* **Acceptance Criteria**:
    * [ ] Create a `Game` model in `schema.prisma` (e.g., storing players, scores, winner).
    * [ ] Create a `Tournament` model and a `TournamentParticipant` model.
    * [ ] Implement basic, protected CRUD endpoints for games and tournaments (e.g., `POST /api/games`, `GET /api/games/:id`).

**Issue #7: `feat: Implement User & Game Stats API`**
* **User Story**: As a user, I want to see my game statistics, such as my win/loss record, on my profile dashboard.
* **Acceptance Criteria**:
    * [ ] Create a `GET /api/stats/user/:id` endpoint.
    * [ ] The service for this endpoint should perform database queries to aggregate data from the `Game` table.
    * [ ] It should calculate and return statistics like total games played, wins, losses, and win rate for the specified user.

**Issue #8: `feat: Implement Game Customization API`**
* **User Story**: As a player creating a game, I want to save customization options so I can play with different rules or themes.
* **Acceptance Criteria**:
    * [ ] Add a `settings` column (of type `Json`) to the `Game` model in `schema.prisma`.
    * [ ] Update the `POST /api/games` endpoint to accept an optional `settings` object in the request body.
    * [ ] The backend should validate and store these settings when a game is created. The settings could include things like `{ "powerUps": true, "mapTheme": "space" }`.

**Issue #9: `feat: Implement AI Opponent API Support`**
* **User Story**: As a player, I want to be able to play a game against an AI opponent.
* **Acceptance Criteria**:
    * [ ] Modify the "create game" logic (`POST /api/games`) to handle a special identifier for an AI opponent (e.g., player2Id could be a string like `"ai_easy"` instead of a user ID).
    * [ ] Ensure the backend can correctly record game results where one of the participants is an AI.
    * [ ] (Optional) Create a `GET /api/game/:id/state` endpoint for an AI to fetch the current game state.

**Issue #10: `feat: Implement Multi-Language Support API`**
* **User Story**: As a user, I want to be able to view the website in different languages.
* **Acceptance Criteria**:
    * [ ] Create a `locales` directory in the backend with JSON files for different languages (e.g., `en.json`, `fr.json`).
    * [ ] Each file should contain key-value pairs for translated strings (e.g., `"welcomeMessage": "Welcome"`).
    * [ ] Create a `GET /api/i18n/:lang` endpoint (e.g., `/api/i18n/en`).
    * [ ] The endpoint reads the corresponding JSON file and returns its content, allowing the frontend to fetch language packs.