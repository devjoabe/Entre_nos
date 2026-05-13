// URL base da nossa API. Se tiver no servidor pega de la, senao pega do localhost
const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

const TOKEN_KEY = "entre_nos_token";

// pega o token salvo pra saber se a gente ta logado
export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

// monta o cabecalho das requisicoes com o token de seguranca pra a api deixar a gente entrar
function authHeaders() {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}), // so manda o token se tiver logado
    };
}

// bate na rota de login e salva o token se a senha der boa
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

// Galeria
export async function buscarFotos() {
    const res = await fetch(`${API_URL}/galeria`, { headers: authHeaders() });
    return res.json();
}

export async function uploadFoto(file) {
    const formData = new FormData();
    formData.append("file", file);

    const token = getToken();
    const res = await fetch(`${API_URL}/galeria/upload`, {
        method: "POST",
        headers: {
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: formData
    });
    return res.json();
}

export async function deletarFoto(id) {
    const res = await fetch(`${API_URL}/galeria/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    return res.json();
}