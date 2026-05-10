import { useState, useEffect } from "react";
import { criarEvento, atualizarEvento } from "../services/api";
import "./criarCarta.css"; // Reuse form styles

export default function CriarEvento({ onEventoCriado, eventoParaEditar, onCancelarEdicao }) {
    const [texto, setTexto] = useState("");
    const [dataEvento, setDataEvento] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (eventoParaEditar) {
            setTexto(eventoParaEditar.texto);
            // Formatar data de ISO para YYYY-MM-DD para o input type="date"
            const dataIso = new Date(eventoParaEditar.data_evento);
            const dataFormatada = dataIso.toISOString().split('T')[0];
            setDataEvento(dataFormatada);
        }
    }, [eventoParaEditar]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!texto || !dataEvento) {
            return;
        }

        setLoading(true);
        try {
            if (eventoParaEditar) {
                await atualizarEvento(eventoParaEditar.id, {
                    texto,
                    data_evento: new Date(dataEvento).toISOString()
                });
            } else {
                await criarEvento({
                    texto,
                    data_evento: new Date(dataEvento).toISOString()
                });
            }
            setTexto("");
            setDataEvento("");
            if (onEventoCriado) onEventoCriado();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="criar-carta-container">
            <h2>{eventoParaEditar ? "Editar Memória" : "Marcar Data Importante"}</h2>
            <form onSubmit={handleSubmit} className="criar-carta-form">
                <div className="form-group">
                    <label>Data do Acontecimento</label>
                    <input 
                        type="date" 
                        value={dataEvento} 
                        onChange={(e) => setDataEvento(e.target.value)} 
                    />
                </div>
                
                <div className="form-group">
                    <label>O que aconteceu?</label>
                    <textarea 
                        value={texto} 
                        onChange={(e) => setTexto(e.target.value)} 
                        placeholder="Escreva sobre este momento especial..."
                        rows="4"
                    />
                </div>

                <div className="form-actions" style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                    <button type="submit" disabled={loading} className="btn-enviar">
                        {loading ? "Salvando..." : (eventoParaEditar ? "Atualizar Memória" : "Salvar Memória")}
                    </button>
                    {eventoParaEditar && (
                        <button type="button" className="btn-link" onClick={onCancelarEdicao}>
                            Cancelar Edição
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
