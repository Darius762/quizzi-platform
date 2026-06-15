// frontend/src/App.jsx
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import { getToken, logoutUser } from "./api/auth";

function SplashScreen({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0f1117] flex flex-col items-center justify-center z-50">
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute w-44 h-44 rounded-full border-4 border-green-500/20 animate-ping" />
        <div className="absolute w-36 h-36 rounded-full border-2 border-green-400/30 animate-pulse" />
        <img src="/logo.webp" alt="Quizzi" className="w-32 h-32 rounded-full object-cover shadow-2xl shadow-green-500/40" />
      </div>
      <h1 className="text-4xl font-black text-white tracking-widest mt-4">QUIZZI</h1>
      <p className="text-green-400/70 text-xs tracking-widest mt-2">YOUR ULTIMATE QUIZ EXPERIENCE</p>
      <div className="mt-10 w-48 h-0.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 rounded-full" style={{ animation: "loadbar 2.3s ease-in-out forwards" }} />
      </div>
      <style>{`@keyframes loadbar { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState("splash");
  const [loggedIn, setLoggedIn] = useState(!!getToken());


  const handleSplashDone = () => {
    setPhase(loggedIn ? "dashboard" : "landing");
  };

  const handleLogin = () => { setLoggedIn(true); setPhase("dashboard"); };
  const handleLogout = () => { setLoggedIn(false); setPhase("landing"); };

  if (phase === "splash") return <SplashScreen onDone={handleSplashDone} />;
  if (phase === "dashboard") return <Dashboard onLogout={handleLogout} />;
  if (phase === "login") return <Login onLogin={handleLogin} onGoRegister={() => setPhase("register")} onGoLanding={() => setPhase("landing")} />;
  if (phase === "register") return <Register onLogin={handleLogin} onGoLogin={() => setPhase("login")} onGoLanding={() => setPhase("landing")} />;
  return <Landing onGoLogin={() => setPhase("login")} onGoRegister={() => setPhase("register")} />;
}