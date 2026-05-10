const API_URL = "http://localhost:8000";

export async function criarCarta(data) {
    const res = await fetch(`${API_URL}/cartas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function buscarCarta(id) {
    const res = await fetch(`${API_URL}/cartas/${id}`);
    return res.json();
}

export async function buscarCartas() {
    const res = await fetch(`${API_URL}/cartas`);
    return res.json();
}

export async function criarEvento(data) {
    const res = await fetch(`${API_URL}/eventos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function buscarEventos() {
    const res = await fetch(`${API_URL}/eventos`);
    return res.json();
}

export async function atualizarCarta(id, data) {
    const res = await fetch(`${API_URL}/cartas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function deletarCarta(id) {
    const res = await fetch(`${API_URL}/cartas/${id}`, {
        method: "DELETE"
    });
    return res.json();
}

export async function atualizarEvento(id, data) {
    const res = await fetch(`${API_URL}/eventos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function deletarEvento(id) {
    const res = await fetch(`${API_URL}/eventos/${id}`, {
        method: "DELETE"
    });
    return res.json();
}