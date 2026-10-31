# Spotify-style Full Stack Music App

## Requirements
- Node.js 18+
- MongoDB running locally OR a MongoDB Atlas connection string
- VS Code

## 1) Backend setup
Open a terminal in `backend`:

```bash
npm install
```

Edit `backend/.env` and set `MONGO_URI`. Example for local MongoDB:
```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/spotify_fullstack
JWT_SECRET=change_this_to_a_long_random_secret
CLIENT_URL=http://localhost:5173
```

Start backend:
```bash
npm run dev
```
Backend runs at `http://localhost:3000`.

## 2) Frontend setup
Open a second terminal in `frontend`:

```bash
npm install
npm run dev
```
Open the URL Vite prints (usually `http://localhost:5173`).

## 3) Main API routes
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET `/api/music/`
- GET `/api/music/albums`
- GET `/api/music/albums/:albumId`
- POST `/api/music/upload` (JWT required; multipart fields: `title`, `artist`, optional `albumId`, file field `audio`)
- POST `/api/music/album` (JWT required; JSON `{ "title": "...", "artist": "...", "coverUrl": "..." }`)

## Notes
- This is a Spotify-inspired learning project, not the official Spotify service.
- Only upload audio you own or have permission to use.
- Music data and user accounts require MongoDB. If MongoDB is not connected, backend auth and database routes will report a connection error.
- The player can play audio uploaded through this app. The UI also includes demo entries; those demo entries do not contain copyrighted audio files.
