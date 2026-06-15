// frontend/src/api/auth.js
// Comunicare cu backend-ul FastAPI pentru autentificare

const API_URL = "http://127.0.0.1:8000/api";

export async function registerUser({ email, password, name }) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Eroare la înregistrare");
  }
  return res.json();
}

export async function loginUser({ email, password }) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Email sau parolă incorecte");
  }
  const data = await res.json();
  localStorage.setItem("token", data.access_token);
  return data;
}

export function logoutUser() {
  localStorage.removeItem("token");
}

export function getToken() {
  return localStorage.getItem("token");
}