const API_URL = `http://${window.location.hostname}:8000`;

const TOKEN_KEY = "entre_nos_token";

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

function authHeaders() {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };
}

export async function login(password) {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
    });
    if (!res.ok) throw new Error("Senha incorreta");
    const data = await res.json();
    saveToken(data.access_token);
    return data.access_token;
}

export async function criarCarta(data) {
    const res = await fetch(`${API_URL}/cartas`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function buscarCarta(id) {
    const res = await fetch(`${API_URL}/cartas/${id}`, { headers: authHeaders() });
    return res.json();
}

export async function buscarCartas() {
    const res = await fetch(`${API_URL}/cartas`, { headers: authHeaders() });
    return res.json();
}

export async function criarEvento(data) {
    const res = await fetch(`${API_URL}/eventos`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function buscarEventos() {
    const res = await fetch(`${API_URL}/eventos`, { headers: authHeaders() });
    return res.json();
}

export async function atualizarCarta(id, data) {
    const res = await fetch(`${API_URL}/cartas/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function deletarCarta(id) {
    const res = await fetch(`${API_URL}/cartas/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    return res.json();
}

export async function atualizarEvento(id, data) {
    const res = await fetch(`${API_URL}/eventos/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function deletarEvento(id) {
    const res = await fetch(`${API_URL}/eventos/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    return res.json();
}