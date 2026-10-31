
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Search,
  Home,
  Library,
  Plus,
  Heart,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Music2,
  LogIn,
  UserPlus,
  LogOut,
  Upload,
  X,
  Disc3,
  ListMusic,
  Radio,
} from "lucide-react";

import api from "./api";

// Demo music
const demoTracks = [
  {
    _id: "demo-1",
    title: "Midnight Drive",
    artist: "Neon Coast",
    coverUrl:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=500&q=80",
    audioUrl: "",
  },
  {
    _id: "demo-2",
    title: "Golden Hour",
    artist: "June Valley",
    coverUrl:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=500&q=80",
    audioUrl: "",
  },
  {
    _id: "demo-3",
    title: "Ocean Bloom",
    artist: "The Blue Notes",
    coverUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=500&q=80",
    audioUrl: "",
  },
  {
    _id: "demo-4",
    title: "City Lights",
    artist: "Parallel",
    coverUrl:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=500&q=80",
    audioUrl: "",
  },
  {
    _id: "demo-5",
    title: "Soft Focus",
    artist: "Mira Sol",
    coverUrl:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=500&q=80",
    audioUrl: "",
  },
  {
    _id: "demo-6",
    title: "Afterglow",
    artist: "Low Season",
    coverUrl:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=500&q=80",
    audioUrl: "",
  },
];

// Backend URL
const apiBase = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const fallbackCover = demoTracks[5].coverUrl;

// Get saved user
function readStoredUser() {
  try {
    const stored = localStorage.getItem("soundwaveUser");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// Normalize backend music
function normalizeTrack(track) {
  const audioUrl = track.audioUrl || "";

  return {
    ...track,
    coverUrl: track.coverUrl || fallbackCover,
    audioUrl:
      audioUrl && !/^https?:\/\//i.test(audioUrl)
        ? `${apiBase}/${audioUrl.replace(/^\/+/, "")}`
        : audioUrl,
  };
}

function App() {
  const [tracks, setTracks] = useState(demoTracks);
  const [albums, setAlbums] = useState([]);

  const [current, setCurrent] = useState(demoTracks[0]);
  const [playing, setPlaying] = useState(false);

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Home");

  const [token, setToken] = useState(
    () => localStorage.getItem("soundwaveToken") || ""
  );

  const [user, setUser] = useState(readStoredUser);

  const [authMode, setAuthMode] = useState("");

  const [authForm, setAuthForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [showUpload, setShowUpload] = useState(false);

  const [uploadForm, setUploadForm] = useState({
    title: "",
    artist: "",
    coverUrl: "",
  });

  const [audioFile, setAudioFile] = useState(null);
  const [liked, setLiked] = useState([]);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load tracks and albums
  async function loadMusic() {
    try {
      const [musicResponse, albumResponse] =
        await Promise.all([
          api.get("/api/music/"),
          api.get("/api/music/albums"),
        ]);

      const serverTracks =
        musicResponse.data.tracks || [];

      const serverAlbums =
        albumResponse.data.albums || [];

      if (serverTracks.length > 0) {
        const normalizedTracks =
          serverTracks.map(normalizeTrack);

        setTracks(normalizedTracks);

        setCurrent((previous) => {
          const updatedTrack = normalizedTracks.find(
            (track) => track._id === previous?._id
          );

          return updatedTrack || normalizedTracks[0];
        });
      } else {
        setTracks(demoTracks);

        setCurrent((previous) =>
          previous?._id?.startsWith("demo-")
            ? previous
            : demoTracks[0]
        );
      }

      setAlbums(serverAlbums);
    } catch (error) {
      console.error("Music loading error:", error);

      setMessage(
        "Backend connect nahi hua. Server start karke refresh karo."
      );
    }
  }

  useEffect(() => {
    loadMusic();
  }, []);

  // Set audio source
  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    if (!current?.audioUrl || current._id?.startsWith("demo-")) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();

      setPlaying(false);
      setCurrentTime(0);
      setDuration(0);

      return;
    }

    audio.src = current.audioUrl;
    audio.load();

    setCurrentTime(0);
    setDuration(0);
  }, [current]);

  // Play and pause
  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    if (playing) {
      audio.play().catch((error) => {
        console.error("Audio playback error:", error);

        setPlaying(false);

        setMessage(
          "Audio play nahi hua. Audio URL aur file check karo."
        );
      });
    } else {
      audio.pause();
    }
  }, [playing, current]);

  // Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Search
  const filtered = useMemo(() => {
    const searchText = query.trim().toLowerCase();

    return tracks.filter((track) =>
      `${track.title || ""} ${track.artist || ""}`
        .toLowerCase()
        .includes(searchText)
    );
  }, [tracks, query]);

  // Play selected track
  function playTrack(track) {
    if (!track) return;

    setCurrent(track);

    if (
      track._id?.startsWith("demo-") ||
      !track.audioUrl
    ) {
      setPlaying(false);

      setMessage(
        "Ye demo track hai. Apni audio file upload karke play karo."
      );

      return;
    }

    setMessage("");
    setPlaying(true);
  }

  // Play / Pause
  function togglePlay() {
    if (
      !current?.audioUrl ||
      current._id?.startsWith("demo-")
    ) {
      setMessage(
        "Pehle ek uploaded audio track select karo."
      );

      return;
    }

    setPlaying((previous) => !previous);
    setMessage("");
  }

  // Next / Previous
  function nextTrack(direction) {
    if (tracks.length === 0) return;

    const index = tracks.findIndex(
      (track) => track._id === current?._id
    );

    const nextIndex =
      index === -1
        ? 0
        : (index + direction + tracks.length) %
          tracks.length;

    playTrack(tracks[nextIndex]);
  }

  // Login and Register
  async function submitAuth(event) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      const endpoint =
        authMode === "register"
          ? "/api/auth/register"
          : "/api/auth/login";

      const { data } = await api.post(
        endpoint,
        authForm
      );

      if (!data.token || !data.user) {
        throw new Error(
          "Backend response mein token ya user missing hai."
        );
      }

      localStorage.setItem(
        "soundwaveToken",
        data.token
      );

      localStorage.setItem(
        "soundwaveUser",
        JSON.stringify(data.user)
      );

      setToken(data.token);
      setUser(data.user);
      setAuthMode("");

      setAuthForm({
        username: "",
        email: "",
        password: "",
      });

      setMessage(
        data.message || "Login successful!"
      );
    } catch (error) {
      console.error(
        "Authentication error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Login/register failed. Backend check karo."
      );
    } finally {
      setLoading(false);
    }
  }

  // Logout
  async function logout() {
    try {
      if (token) {
        await api.post(
          "/api/auth/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.warn(
        "Server logout unavailable:",
        error.message
      );
    }

    localStorage.removeItem("soundwaveToken");
    localStorage.removeItem("soundwaveUser");

    setToken("");
    setUser(null);
    setShowUpload(false);
    setAuthMode("");
    setMessage("You are logged out.");
  }

  // =====================================
  // UPDATED MUSIC UPLOAD FUNCTION
  // =====================================

  async function submitUpload(event) {
    event.preventDefault();

    if (loading) return;

    const title = uploadForm.title.trim();
    const artist = uploadForm.artist.trim();

    // Login validation
    if (!token) {
      setShowUpload(false);
      setAuthMode("login");

      setMessage(
        "Music upload karne ke liye pehle login karo."
      );

      return;
    }

    // Title and artist validation
    if (!title || !artist) {
      setMessage(
        "Song title aur artist name dono enter karo."
      );

      return;
    }

    // Audio file validation
    if (!audioFile) {
      setMessage(
        "Choose File par click karke audio file select karo."
      );

      return;
    }

    const allowedAudio =
      audioFile.type.startsWith("audio/") ||
      /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(
        audioFile.name
      );

    if (!allowedAudio) {
      setMessage(
        "Please valid audio file select karo (MP3, WAV, M4A etc.)."
      );

      return;
    }

    // Create FormData
    const formData = new FormData();

    formData.append("title", title);
    formData.append("artist", artist);
    formData.append(
      "coverUrl",
      uploadForm.coverUrl.trim()
    );

    // Must match backend upload.single("audio")
    formData.append("audio", audioFile);

    setLoading(true);
    setMessage("");

    try {
      const response = await api.post(
        "/api/music/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Close upload modal
      setShowUpload(false);

      // Reset form
      setUploadForm({
        title: "",
        artist: "",
        coverUrl: "",
      });

      setAudioFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setMessage(
        response.data?.message ||
          "Track upload ho gaya!"
      );

      // Refresh music list
      await loadMusic();
    } catch (error) {
      console.error(
        "Upload error:",
        error.response?.data ||
          error.message ||
          error
      );

      const status = error.response?.status;

      let errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message;

      if (status === 401 || status === 403) {
        errorMessage =
          "Login session expire ho gaya. Logout karke dobara login karo.";
      } else if (status === 404) {
        errorMessage =
          "Upload API route nahi mila. Backend mein POST /api/music/upload route check karo.";
      } else if (!error.response) {
        errorMessage =
          "Backend se connection nahi hua. Backend server aur API URL check karo.";
      }

      setMessage(
        errorMessage ||
          "Track upload nahi hua. Backend console check karo."
      );
    } finally {
      setLoading(false);
    }
  }

  // Like / Unlike
  function toggleLike(trackId) {
    setLiked((previous) =>
      previous.includes(trackId)
        ? previous.filter((id) => id !== trackId)
        : [...previous, trackId]
    );
  }

  // Format audio time
  function formatTime(seconds) {
    if (
      !Number.isFinite(seconds) ||
      seconds < 0
    ) {
      return "0:00";
    }

    const minutes = Math.floor(seconds / 60);

    const remainingSeconds = Math.floor(
      seconds % 60
    );

    return `${minutes}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }

  // Seek audio
  function seekAudio(event) {
    const value = Number(event.target.value);
    const audio = audioRef.current;

    if (
      audio &&
      Number.isFinite(audio.duration)
    ) {
      audio.currentTime = value;
      setCurrentTime(value);
    }
  }

  // Open upload modal
  function openUpload() {
    if (!token) {
      setAuthMode("login");

      setMessage(
        "Upload karne ke liye pehle login karo."
      );

      return;
    }

    setShowUpload(true);
  }

  return (
    <div className="app-shell">
      {/* SIDEBAR */}

      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Music2 size={23} />
          </span>

          <span>soundwave</span>
        </div>

        <nav className="main-nav">
          <button
            className={
              activeTab === "Home"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              setActiveTab("Home");
              setQuery("");
            }}
          >
            <Home size={20} />
            Home
          </button>

          <button
            className={
              activeTab === "Search"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setActiveTab("Search")}
          >
            <Search size={20} />
            Search
          </button>

          <button
            className={
              activeTab === "Your Library"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActiveTab("Your Library")
            }
          >
            <Library size={20} />
            Your Library
          </button>
        </nav>

        <div className="library-head">
          <span>YOUR LIBRARY</span>

          <button
            title="Upload music"
            onClick={openUpload}
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="library-card">
          <div className="library-icon">
            <ListMusic size={21} />
          </div>

          <div>
            <strong>
              Create your collection
            </strong>

            <p>
              Upload tracks you have permission to use.
            </p>
          </div>

          <button
            className="small-pill"
            onClick={openUpload}
          >
            Get started
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="mini-note">
            <Radio size={16} />
            <span>
              Discover your next favorite
            </span>
          </div>

          {user ? (
            <div className="user-box">
              <div className="avatar">
                {(user.username || "U")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>

              <div className="user-meta">
                <strong>{user.username}</strong>
                <span>{user.email}</span>
              </div>

              <button
                className="icon-btn"
                title="Logout"
                onClick={logout}
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <button
                onClick={() =>
                  setAuthMode("login")
                }
              >
                <LogIn size={16} />
                Log in
              </button>

              <button
                onClick={() =>
                  setAuthMode("register")
                }
              >
                <UserPlus size={16} />
                Sign up
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN AREA */}

      <main className="main-area">
        <header className="topbar">
          <div className="history-buttons">
            <button
              aria-label="Back"
              onClick={() =>
                setActiveTab("Home")
              }
            >
              ‹
            </button>

            <button
              aria-label="Forward"
              onClick={() =>
                setActiveTab("Search")
              }
            >
              ›
            </button>
          </div>

          <div className="search-wrap">
            <Search size={18} />

            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveTab("Search");
              }}
              placeholder="What do you want to listen to?"
            />
          </div>

          <div className="top-actions">
            {user ? (
              <span className="welcome">
                Hi, {user.username}
              </span>
            ) : (
              <>
                <button
                  className="text-button"
                  onClick={() =>
                    setAuthMode("register")
                  }
                >
                  Sign up
                </button>

                <button
                  className="login-pill"
                  onClick={() =>
                    setAuthMode("login")
                  }
                >
                  Log in
                </button>
              </>
            )}
          </div>
        </header>

        <div className="content-scroll">
          {/* MESSAGE */}

          {message && (
            <div
              className="notice"
              role="status"
            >
              <span>{message}</span>

              <button
                aria-label="Dismiss message"
                onClick={() => setMessage("")}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* HERO */}

          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="live-dot" />
                YOUR SOUND, YOUR SPACE
              </div>

              <h1>
                Music that
                <br />
                <em>moves you.</em>
              </h1>

              <p>
                Find your rhythm. Make every moment sound better.
              </p>

              <div className="hero-actions">
                <button
                  className="primary-btn"
                  onClick={() =>
                    document
                      .getElementById("tracks")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      })
                  }
                >
                  <Play
                    size={17}
                    fill="currentColor"
                  />
                  Explore music
                </button>

                <button
                  className="outline-btn"
                  onClick={openUpload}
                >
                  <Upload size={17} />
                  Upload a track
                </button>
              </div>
            </div>

            <div className="hero-art">
              <div className="art-glow" />

              <div className="vinyl">
                <div className="vinyl-label">
                  <Music2 size={35} />
                </div>
              </div>

              <div className="floating-tag tag-one">
                <span>♫</span>
                your daily mix
              </div>

              <div className="floating-tag tag-two">
                <Heart
                  size={15}
                  fill="currentColor"
                />
                made for you
              </div>
            </div>
          </section>

          {/* TRACKS */}

          <section
            className="section-block"
            id="tracks"
          >
            <div className="section-title">
              <div>
                <span className="section-kicker">
                  A LITTLE SOMETHING FOR EVERY MOOD
                </span>

                <h2>
                  {query
                    ? "Search results"
                    : activeTab === "Your Library"
                      ? "Your library"
                      : "Made for your ears"}
                </h2>
              </div>

              <span className="track-count">
                {filtered.length} tracks
              </span>
            </div>

            {filtered.length > 0 ? (
              <div className="track-grid">
                {filtered.map((track, index) => (
                  <article
                    className="track-card"
                    key={track._id}
                    onDoubleClick={() =>
                      playTrack(track)
                    }
                  >
                    <div className="cover-wrap">
                      <img
                        src={
                          track.coverUrl ||
                          fallbackCover
                        }
                        alt={`${track.title} cover`}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src =
                            fallbackCover;
                        }}
                      />

                      <button
                        className="cover-play"
                        onClick={() =>
                          playTrack(track)
                        }
                        aria-label={`Play ${track.title}`}
                      >
                        <Play
                          size={20}
                          fill="currentColor"
                        />
                      </button>

                      <button
                        className="like-btn"
                        onClick={() =>
                          toggleLike(track._id)
                        }
                        aria-label={
                          liked.includes(track._id)
                            ? "Unlike track"
                            : "Like track"
                        }
                      >
                        <Heart
                          size={17}
                          fill={
                            liked.includes(track._id)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                    </div>

                    <div className="track-info">
                      <strong>{track.title}</strong>
                      <span>{track.artist}</span>
                    </div>

                    <div className="track-index">
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Search size={30} />
                <h3>No tracks found</h3>
                <p>
                  Try another song or artist name.
                </p>
              </div>
            )}
          </section>

          {/* ALBUMS */}

          <section className="section-block album-section">
            <div className="section-title">
              <div>
                <span className="section-kicker">
                  ALBUM SHELF
                </span>

                <h2>Albums to get lost in</h2>
              </div>

              <Disc3 size={24} />
            </div>

            {albums.length > 0 ? (
              <div className="album-grid">
                {albums.map((album) => (
                  <div
                    className="album-card"
                    key={album._id}
                  >
                    <img
                      src={
                        album.coverUrl ||
                        fallbackCover
                      }
                      alt={album.title}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src =
                          fallbackCover;
                      }}
                    />

                    <strong>{album.title}</strong>
                    <span>{album.artist}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-copy">
                Albums you create will appear here.
              </p>
            )}
          </section>

          <footer className="footer-note">
            Built for music lovers · A learning project, not
            affiliated with Spotify.
          </footer>
        </div>
      </main>

      {/* MUSIC PLAYER */}

      <footer className="player-bar">
        <div className="now-playing">
          <img
            src={
              current?.coverUrl ||
              fallbackCover
            }
            alt="Current track cover"
          />

          <div>
            <strong>
              {current?.title || "Choose a track"}
            </strong>

            <span>
              {current?.artist || "Soundwave"}
            </span>
          </div>

          <button
            className="player-heart"
            aria-label="Like current track"
            onClick={() =>
              current && toggleLike(current._id)
            }
          >
            <Heart
              size={16}
              fill={
                current &&
                liked.includes(current._id)
                  ? "currentColor"
                  : "none"
              }
            />
          </button>
        </div>

        <div className="player-center">
          <div className="player-controls">
            <button
              aria-label="Previous track"
              onClick={() => nextTrack(-1)}
            >
              <SkipBack
                size={19}
                fill="currentColor"
              />
            </button>

            <button
              className="play-main"
              aria-label={
                playing ? "Pause" : "Play"
              }
              onClick={togglePlay}
            >
              {playing ? (
                <Pause
                  size={20}
                  fill="currentColor"
                />
              ) : (
                <Play
                  size={20}
                  fill="currentColor"
                />
              )}
            </button>

            <button
              aria-label="Next track"
              onClick={() => nextTrack(1)}
            >
              <SkipForward
                size={19}
                fill="currentColor"
              />
            </button>
          </div>

          <div className="progress-row">
            <span>
              {formatTime(currentTime)}
            </span>

            <input
              className="progress-track"
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={Math.min(
                currentTime,
                duration || 0
              )}
              onChange={seekAudio}
              aria-label="Seek audio"
              disabled={!duration}
            />

            <span>
              {duration
                ? formatTime(duration)
                : "0:00"}
            </span>
          </div>
        </div>

        <div className="volume-control">
          <Volume2 size={18} />

          <input
            className="volume-track"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(event) =>
              setVolume(
                Number(event.target.value)
              )
            }
            aria-label="Volume"
          />
        </div>

        <audio
          ref={audioRef}
          onLoadedMetadata={(event) =>
            setDuration(
              event.currentTarget.duration || 0
            )
          }
          onDurationChange={(event) =>
            setDuration(
              event.currentTarget.duration || 0
            )
          }
          onTimeUpdate={(event) =>
            setCurrentTime(
              event.currentTarget.currentTime || 0
            )
          }
          onEnded={() => nextTrack(1)}
          onError={() => {
            setPlaying(false);

            setMessage(
              "Audio load nahi hui. Backend audio URL aur file check karo."
            );
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      </footer>

      {/* LOGIN / SIGNUP MODAL */}

      {authMode && (
        <div
          className="modal-backdrop"
          onClick={() => setAuthMode("")}
        >
          <div
            className="modal-card"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="modal-close"
              onClick={() => setAuthMode("")}
              aria-label="Close authentication"
            >
              <X size={20} />
            </button>

            <div className="modal-brand">
              <Music2 size={24} />
              soundwave
            </div>

            <h2>
              {authMode === "register"
                ? "Join the rhythm."
                : "Welcome back."}
            </h2>

            <p>
              {authMode === "register"
                ? "Create your account and start building your library."
                : "Log in to your music space."}
            </p>

            <form onSubmit={submitAuth}>
              {authMode === "register" && (
                <label>
                  Username

                  <input
                    required
                    minLength={2}
                    value={authForm.username}
                    onChange={(event) =>
                      setAuthForm({
                        ...authForm,
                        username: event.target.value,
                      })
                    }
                    placeholder="Your name"
                  />
                </label>
              )}

              <label>
                Email

                <input
                  required
                  type="email"
                  value={authForm.email}
                  onChange={(event) =>
                    setAuthForm({
                      ...authForm,
                      email: event.target.value,
                    })
                  }
                  placeholder="you@example.com"
                />
              </label>

              <label>
                Password

                <input
                  required
                  minLength={6}
                  type="password"
                  value={authForm.password}
                  onChange={(event) =>
                    setAuthForm({
                      ...authForm,
                      password: event.target.value,
                    })
                  }
                  placeholder="At least 6 characters"
                />
              </label>

              <button
                className="primary-btn modal-submit"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : authMode === "register"
                    ? "Create account"
                    : "Log in"}
              </button>
            </form>

            <div className="switch-auth">
              {authMode === "register"
                ? "Already have an account?"
                : "New to Soundwave?"}{" "}

              <button
                onClick={() =>
                  setAuthMode(
                    authMode === "register"
                      ? "login"
                      : "register"
                  )
                }
              >
                {authMode === "register"
                  ? "Log in"
                  : "Sign up"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MUSIC UPLOAD MODAL */}

      {showUpload && (
        <div
          className="modal-backdrop"
          onClick={() => {
            if (!loading) {
              setShowUpload(false);
            }
          }}
        >
          <div
            className="modal-card"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="modal-close"
              onClick={() => {
                if (!loading) {
                  setShowUpload(false);
                }
              }}
              aria-label="Close upload"
              disabled={loading}
            >
              <X size={20} />
            </button>

            <div className="modal-brand">
              <Upload size={22} />
              music upload
            </div>

            <h2>Add your track.</h2>

            <p>
              Upload only audio you own or have permission to share.
            </p>

            <form onSubmit={submitUpload}>
              <label>
                Track title

                <input
                  required
                  value={uploadForm.title}
                  onChange={(event) =>
                    setUploadForm({
                      ...uploadForm,
                      title: event.target.value,
                    })
                  }
                  placeholder="Song title"
                />
              </label>

              <label>
                Artist

                <input
                  required
                  value={uploadForm.artist}
                  onChange={(event) =>
                    setUploadForm({
                      ...uploadForm,
                      artist: event.target.value,
                    })
                  }
                  placeholder="Artist name"
                />
              </label>

              <label>
                Cover image URL (optional)

                <input
                  type="url"
                  value={uploadForm.coverUrl}
                  onChange={(event) =>
                    setUploadForm({
                      ...uploadForm,
                      coverUrl: event.target.value,
                    })
                  }
                  placeholder="https://..."
                />
              </label>

              <label>
                Audio file

                <input
                  ref={fileInputRef}
                  required
                  type="file"
                  accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
                  onChange={(event) => {
                    const selectedFile =
                      event.target.files?.[0] || null;

                    setAudioFile(selectedFile);

                    setMessage(
                      selectedFile
                        ? `Selected: ${selectedFile.name}`
                        : ""
                    );
                  }}
                />
              </label>

              <button
                className="primary-btn modal-submit"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Uploading..."
                  : "Upload track"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
