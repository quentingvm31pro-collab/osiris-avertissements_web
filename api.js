const API_URL = "https://osiris-api.onrender.com";

// ======================
// AUTH
// ======================

export async function login(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${API_URL}/officers/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erreur login");
  }

  const data = await response.json();

  // Stockage du token pour les requêtes protégées
  localStorage.setItem("token", data.access_token);

  // Optionnel mais utile pour afficher l'officier connecté
  if (data.officer) {
    localStorage.setItem("officer", JSON.stringify(data.officer));
  }

  return data;
}

// 🆕 REGISTER
export async function registerOfficer(pseudo, email, password) {
  const response = await fetch(`${API_URL}/officers/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pseudo,
      email,
      password
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erreur inscription");
  }

  return await response.json();
}

// ======================
// UTILS
// ======================

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

// ======================
// PLAYERS
// ======================

export async function getPlayers() {
  const response = await fetch(`${API_URL}/players`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) throw new Error("Erreur récupération joueurs");

  return await response.json();
}

export async function createPlayer(name) {
  const response = await fetch(`${API_URL}/players?name=${encodeURIComponent(name)}`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) throw new Error("Erreur création joueur");

  return await response.json();
}

// ======================
// WARNINGS
// ======================

export async function getPlayerWarnings(playerId) {
  const response = await fetch(`${API_URL}/players/${playerId}/warnings`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) throw new Error("Erreur récupération warnings");

  return await response.json();
}

export async function createWarning(playerId, reason, date) {
  const response = await fetch(
    `${API_URL}/warnings?player_id=${playerId}&reason=${encodeURIComponent(reason)}&date=${encodeURIComponent(date)}`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) throw new Error("Erreur création warning");

  return await response.json();
}

export async function updateWarning(warningId, reason, date) {
  const response = await fetch(
    `${API_URL}/warnings/${warningId}?reason=${encodeURIComponent(reason)}&date=${encodeURIComponent(date)}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) throw new Error("Erreur modification warning");

  return await response.json();
}

export async function deleteWarning(warningId) {
  const response = await fetch(`${API_URL}/warnings/${warningId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) throw new Error("Erreur suppression warning");

  return await response.json();
}