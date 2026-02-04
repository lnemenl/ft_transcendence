<div align=center>
  <h1>ft_transcendence</h1>
  <img alt="Project badge" src="https://github.com/miladrahmat/42-badges/blob/master/badges/ft_transcendencee.png" /><img width="20%" alt="Grade for the project" src="https://github.com/user-attachments/assets/1918caaa-d33c-426c-8c35-ba62555b9321" />
  <p>A full-stack Pong platform built with <b>TypeScript, React and Babylon.js</b></p>
</div>

## Content

- [Introduction](#introduction)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Authors](#authors)

## Introduction

This project is the last project of the [Hive Helsinki](https://www.hive.fi/) **core curriculum** where we implemented a functional multiplayer Pong game SPA (Single Page Application) where users play against each other locally, compete in tournaments, and manage their profiles.

![ft_transcendence_demo gif](https://github.com/user-attachments/assets/b95a2c8e-3da6-4781-bbc1-a9edfc97d191)

## Key Features

**The game**
- **3D Rendering:** Immersive gameplay powered by the Babylon.js engine.
- **Local multiplayer:** Play the Pong game against other users.
- **Tournament System:** Create and join tournaments with multiple players.
- **Matchmaking:** A pairing system to find the next opponent during tournaments.

**User profile**
- **Customizable avatars:** Choose an avatar from the existing ones or upload your own.
- **Match history:** See the games you've played and your win/loss rate.
- **Friend system:** Add friends and see their online status (online/offline).

**Security & User Management**
- **OAuth 2.0:** Secure login using Google Sign-In.
- **Two-Factor Authentication (2FA):** Optional enhanced security (e.g. via Google Authenticator).

## Tech Stack

This project is containerized using **Docker** and **Docker Compose**.

- **Frontend:** React, Vite
- **Backend:** TypeScript, Node.js, Fastify
- **Database:** SQLite
- **DevOps:** Nginx (Reverse Proxy), Docker, Docker Compose
- **Game:** JavaScript (Babylon.js)
- **Testing:** Jest, GitHub Actions

## Installation

1. Install [Docker](https://docs.docker.com/get-started/)
2. Install [Docker Compose](https://docs.docker.com/compose/)
3. Clone the repository in your directory of choice:
```bash
git clone https://github.com/miladrahmat/ft_transcendence.git
cd ft_transcendence
```
4. Build and start all the containers:
```bash
docker compose up --build
```

*To stop the containers press `Ctrl + C` in your terminal*

## Usage

Navigate to:
```
https://localhost:4430
```
**Note:** Because the site uses a self-signed TLS certificate for local development, your browser will show a security warning. Click on `Advanced` and then `Proceed to localhost (unsafe)` to proceed to the page.

## Authors

- [Colin Pireyre](https://github.com/cpireyre) (Game)
- [Helmi Pirkola](https://github.com/hpirkola) (Frontend)
- [Milad Rahmat Abadi](https://github.com/miladrahmat) (Backend & DevOps)
- [Ruslan Khakimullin](https://github.com/lnemenl) (Backend)
