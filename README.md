# Tattoo Salon Web App

This is a code bundle for Tattoo Salon Web App. The original project is available at https://www.figma.com/design/QiX9pg0CBAMW3oaGijbJZC/Tattoo-Salon-Web-App.

## Running the code

### 1) Server

1. Copy `server/.env.example` to `server/.env` and fill in values.
2. Install dependencies:
   - `cd server`
   - `npm i`
3. Run migrations and seed:
   - `npm run migrate`
   - The migrate script will create `DB_NAME` if it does not exist (uses `DB_ADMIN_DB`)
4. Start the API:
   - `npm run dev`

### 2) Client

1. Install dependencies:
   - `cd client`
   - `npm i`
2. Start the UI:
   - `npm run dev`

API runs on `http://localhost:3001` and the client on Vite default port.

## Seed accounts

- `user@example.com / user123`
- `master@example.com / master123`
- `admin@example.com / admin123`

Passwords are automatically hashed on first login if seeded in plain text.
