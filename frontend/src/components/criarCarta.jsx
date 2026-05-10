import { useState, useEffect } from "react";
import { criarCarta, atualizarCarta } from "../services/api";
import "./criarCarta.css";

export default function CriarCarta({ onCartaCriada, cartaParaEditar, onCancelarEdicao }) {
    const [titulo, setTitulo] = useState("");
    const [conteudo, setConteudo] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (cartaParaEditar) {
            setTitulo(cartaParaEditar.titulo);
            setConteudo(cartaParaEditar.conteudo);
        }
    }, [cartaParaEditar]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!titulo || !conteudo) {
            return;
        }

        setLoading(true);
        try {
            if (cartaParaEditar) {
                await atualizarCarta(cartaParaEditar.id, { titulo, conteudo });
            } else {
                await criarCarta({ titulo, conteudo });
            }
            setTitulo("");
            setConteudo("");
            if (onCartaCriada) onCartaCriada();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="criar-carta-container">
            <h2>{cartaParaEditar ? "Editar Carta" : "Escrever Nova Carta"}</h2>
            <form onSubmit={handleSubmit} className="criar-carta-form">
                <div className="form-group">
                    <label>Título Especial</label>
                    <input
                        type="text"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        placeholder="Ex: Para o amor da minha vida"
                    />
                </div>

                <div className="form-group">
                    <label>Sua Mensagem</label>
                    <textarea
                        value={conteudo}
                        onChange={(e) => setConteudo(e.target.value)}
                        placeholder="Escreva tudo o que sente..."
                        rows="5"
                    />
                </div>

                <div className="form-actions" style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                    <button type="submit" disabled={loading} className="btn-enviar">
                        {loading ? "Salvando..." : (cartaParaEditar ? "Atualizar Carta" : "Guardar Carta")}
                    </button>
                    {cartaParaEditar && (
                        <button type="button" className="btn-link" onClick={onCancelarEdicao}>
                            Cancelar Edição
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}