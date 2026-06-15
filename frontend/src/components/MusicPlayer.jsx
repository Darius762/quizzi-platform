// frontend/src/components/MusicPlayer.jsx
import { useState, useRef, useEffect } from "react";
import { X, SkipForward, Play, Pause, Music, Volume1, Volume2, VolumeX } from "lucide-react";

const STATIONS = [
  {
    id: "lofi",
    label: "Lo-fi",
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.15)",
    border: "rgba(139,92,246,0.35)",
    videoIds: [
      "jfKfPfyJRdk",
      "5qap5aO4i9A",
      "DWcJFNfaw9c",
      "rUxyKA_-grg",
    ],
  },
  {
    id: "nature",
    label: "Natură",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.15)",
    border: "rgba(34,197,94,0.35)",
    videoIds: [
      "eKFTSSKCzWA",
      "xNN7iTA57jM",
      "q76bMs-NwRk",
      "Qm846KdZN_M",
    ],
  },
  {
    id: "white",
    label: "Alb",
    color: "#38BDF8",
    bg: "rgba(56,189,248,0.15)",
    border: "rgba(56,189,248,0.35)",
    videoIds: [
      "nMfPqeZjc2c",
      "1ZYbU82GVz4",
      "AbdFDe1b5CY",
      "qQraeOG-3DQ",
    ],
  },
  {
    id: "classical",
    label: "Clasic",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.15)",
    border: "rgba(245,158,11,0.35)",
    videoIds: [
      "4Tr0otuiQuU",
      "jgpJVI3tDbY",
      "mPZkdNFkNps",
      "H98gDcPEBOM",
    ],
  },
];


function StationIcon({ id, size = 18, color }) {
  if (id === "lofi") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  );
  if (id === "nature") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12"/><path d="M5 12c0-4 3-7 7-7s7 3 7 7"/><path d="M5 17c0-2.8 3.1-5 7-5s7 2.2 7 5"/>
    </svg>
  );
  if (id === "white") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h2M6 6l1.4 1.4M12 2v2M17.6 6l-1.4 1.4M22 12h-2M17.6 18l-1.4-1.4M12 22v-2M6 18l1.4-1.4"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  );
  // classical
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/><path d="M5 14H3a2 2 0 0 0 0 4h2v-4z"/><path d="M17 12h-2a2 2 0 0 0 0 4h2v-4z"/>
    </svg>
  );
}

export default function MusicPlayer() {
  const [expanded, setExpanded]           = useState(false);
  const [playing, setPlaying]             = useState(false);
  const [currentStation, setCurrentStation] = useState(STATIONS[0]);
  const [currentIdxMap, setCurrentIdxMap] = useState({ lofi: 0, nature: 0, white: 0, classical: 0 });
  const [volume, setVolume]               = useState(50);
  const [playerReady, setPlayerReady]     = useState(false);
  const [loadingStation, setLoadingStation] = useState(false);
  const playerRef  = useRef(null);
  const playingRef = useRef(false);

  useEffect(() => {
    if (window.YT && window.YT.Player) { initPlayer(); return; }
    if (!document.getElementById("yt-api-script")) {
      const tag = document.createElement("script");
      tag.id = "yt-api-script"; tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    window.onYouTubeIframeAPIReady = () => initPlayer();
  }, []);

  const initPlayer = () => {
    if (playerRef.current) return;
    const firstId = STATIONS[0].videoIds[0];
    playerRef.current = new window.YT.Player("yt-player-hidden", {
      height: "1", width: "1", videoId: firstId,
      playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: firstId, modestbranding: 1, rel: 0 },
      events: {
        onReady:       e => { e.target.setVolume(50); setPlayerReady(true); },
        onStateChange: e => { if (e.data === window.YT.PlayerState.ENDED) tryNextStream(); },
        onError:       () => tryNextStream(),
      },
    });
  };

  const tryNextStream = () => {
    setCurrentIdxMap(prev => {
      const sid    = currentStation.id;
      const next   = (prev[sid] + 1) % currentStation.videoIds.length;
      const nextId = currentStation.videoIds[next];
      if (playerRef.current) {
        playerRef.current.loadVideoById({ videoId: nextId });
        if (playingRef.current) setTimeout(() => playerRef.current?.playVideo(), 500);
      }
      return { ...prev, [sid]: next };
    });
  };

  const handlePlay = () => {
    if (!playerReady || !playerRef.current) return;
    if (playing) { playerRef.current.pauseVideo(); playingRef.current = false; setPlaying(false); }
    else         { playerRef.current.playVideo();  playingRef.current = true;  setPlaying(true);  }
  };

  const handleStation = station => {
    if (station.id === currentStation.id) return;
    if (!playerReady || !playerRef.current) {
      setCurrentStation(station);
      return;
    }

    playerRef.current.stopVideo();
    playingRef.current = false;
    setPlaying(false);
    setLoadingStation(true);
    setCurrentStation(station);

    const videoId = station.videoIds[currentIdxMap[station.id]];

    playerRef.current.cueVideoById({ videoId });
    setLoadingStation(false);

  };

  const handleVolume = e => {
    const v = parseInt(e.target.value);
    setVolume(v);
    if (playerRef.current && playerReady) playerRef.current.setVolume(v);
  };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;
  const streamIdx  = currentIdxMap[currentStation.id];

  return (
    <>
      <div style={{ position: "fixed", bottom: "-10px", right: "-10px", opacity: 0, pointerEvents: "none", zIndex: -1 }}>
        <div id="yt-player-hidden" />
      </div>

      <style>{`
        @keyframes music-pulse {
          0%,100% { box-shadow: 0 0 0 0 ${currentStation.color}55; }
          50%      { box-shadow: 0 0 0 10px ${currentStation.color}00; }
        }
        @keyframes music-bar {
          0%,100% { transform: scaleY(0.25); }
          50%      { transform: scaleY(1); }
        }
        .mb1 { animation: music-bar 0.7s ease-in-out infinite 0s; }
        .mb2 { animation: music-bar 0.7s ease-in-out infinite 0.12s; }
        .mb3 { animation: music-bar 0.7s ease-in-out infinite 0.24s; }
        .mb4 { animation: music-bar 0.7s ease-in-out infinite 0.36s; }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        .mp-panel { animation: slideUp 0.2s ease-out; }
        .mp-vol {
          -webkit-appearance: none; width: 100%; height: 3px;
          border-radius: 2px; outline: none; cursor: pointer;
        }
        .mp-vol::-webkit-slider-thumb {
          -webkit-appearance: none; width: 13px; height: 13px;
          border-radius: 50%; background: ${currentStation.color};
          cursor: pointer; transition: transform 0.1s;
        }
        .mp-vol::-webkit-slider-thumb:hover { transform: scale(1.25); }
      `}</style>

      <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>

        {/* Panel */}
        {expanded && (
          <div className="mp-panel" style={{
            backgroundColor: "#111927",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "20px", padding: "18px", width: "280px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", backgroundColor: `${currentStation.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Music size={14} color={currentStation.color} />
                </div>
                <div>
                  <p style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: "700", margin: 0 }}>Studiu muzical</p>
                  <p style={{ color: "#475569", fontSize: "10px", margin: "2px 0 0 0" }}>
                    {playing ? `${currentStation.label} · ${streamIdx + 1}/${currentStation.videoIds.length}` : "Apasă play"}
                  </p>
                </div>
              </div>
              {/* Bars vizualizator */}
              <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "20px" }}>
                {[1,2,3,4].map(i => (
                  <div key={i} className={playing ? `mb${i}` : ""}
                    style={{ width: "3px", height: "100%", borderRadius: "2px", transformOrigin: "bottom",
                      backgroundColor: playing ? currentStation.color : "rgba(255,255,255,0.08)",
                      transform: !playing ? "scaleY(0.25)" : undefined,
                      transition: "background-color 0.3s",
                    }} />
                ))}
              </div>
            </div>

            {/* Stații */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px", marginBottom: "16px" }}>
              {STATIONS.map(s => {
                const on = currentStation.id === s.id;
                return (
                  <button key={s.id} onClick={() => handleStation(s)}
                    style={{
                      backgroundColor: on ? s.bg : "rgba(255,255,255,0.04)",
                      border: `1px solid ${on ? s.border : "rgba(255,255,255,0.08)"}`,
                      borderRadius: "12px", padding: "10px 8px",
                      cursor: "pointer", transition: "all 0.2s", textAlign: "center",
                    }}
                    onMouseEnter={e => { if (!on) { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}}
                    onMouseLeave={e => { if (!on) { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "5px" }}>
                      <StationIcon id={s.id} size={20} color={on ? s.color : "#475569"} />
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: "600", color: on ? s.color : "#475569", transition: "color 0.2s" }}>
                      {s.label}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Volum */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <VolumeIcon size={13} color="#64748b" />
                  <span style={{ color: "#64748b", fontSize: "11px" }}>Volum</span>
                </div>
                <span style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "600" }}>{volume}%</span>
              </div>
              <input type="range" min="0" max="100" value={volume} onChange={handleVolume}
                className="mp-vol"
                style={{ background: `linear-gradient(to right, ${currentStation.color} ${volume}%, rgba(255,255,255,0.08) ${volume}%)` }} />
            </div>

            {/* Controale */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handlePlay} disabled={!playerReady || loadingStation}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  backgroundColor: playerReady && !loadingStation ? currentStation.color : "rgba(255,255,255,0.07)",
                  border: "none", borderRadius: "12px", padding: "10px",
                  cursor: playerReady && !loadingStation ? "pointer" : "not-allowed",
                  color: playerReady && !loadingStation ? "#000" : "#475569",
                  fontWeight: "700", fontSize: "13px",
                  transition: "all 0.2s", opacity: playerReady && !loadingStation ? 1 : 0.5,
                }}
                onMouseEnter={e => { if (playerReady && !loadingStation) e.currentTarget.style.filter = "brightness(1.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)"; }}>
                {loadingStation ? (
                  <><Loader size={14} className="animate-spin" />Se încarcă</>
                ) : !playerReady ? (
                  "Se pregătește..."
                ) : playing ? (
                  <><Pause size={15} fill="currentColor" />Pauză</>
                ) : (
                  <><Play size={15} fill="currentColor" />Play</>
                )}
              </button>

              <button onClick={tryNextStream} disabled={!playerReady}
                title="Următorul stream"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px", padding: "10px 13px",
                  cursor: playerReady ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: playerReady ? 1 : 0.4, transition: "all 0.2s",
                }}
                onMouseEnter={e => { if (playerReady) { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>
                <SkipForward size={16} color="#64748b" />
              </button>
            </div>

            <p style={{ color: "#2d3f55", fontSize: "10px", textAlign: "center", marginTop: "10px", marginBottom: 0 }}>
              Stream live · dacă nu merge apasă <SkipForward size={9} style={{ display: "inline", verticalAlign: "middle" }} />
            </p>
          </div>
        )}

        {/* Floating button */}
        <button onClick={() => setExpanded(o => !o)}
          style={{
            width: "52px", height: "52px", borderRadius: "50%",
            backgroundColor: expanded ? currentStation.color : "#111927",
            border: `2px solid ${expanded ? currentStation.color : "rgba(255,255,255,0.12)"}`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.3s",
            boxShadow: playing
              ? `0 0 24px ${currentStation.color}60, 0 4px 20px rgba(0,0,0,0.5)`
              : "0 4px 20px rgba(0,0,0,0.4)",
            animation: playing && !expanded ? "music-pulse 2s ease-in-out infinite" : "none",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
          title="Muzică pentru studiu">
          {expanded ? (
            <X size={18} color="white" strokeWidth={2.5} />
          ) : playing ? (
            <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "18px" }}>
              {[1,2,3,4].map(i => (
                <div key={i} className={`mb${i}`}
                  style={{ width: "3px", height: "100%", backgroundColor: "white", borderRadius: "2px", transformOrigin: "bottom" }} />
              ))}
            </div>
          ) : (
            <Music size={20} color="#64748b" />
          )}
        </button>
      </div>
    </>
  );
}