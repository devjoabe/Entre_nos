import { useState, useEffect } from "react";
import { criarEvento, atualizarEvento } from "../services/api";
import "./criarCarta.css"; // Reuse form styles

export default function CriarEvento({ onEventoCriado, eventoParaEditar, onCancelarEdicao }) {
    const [texto, setTexto] = useState("");
    const [dataEvento, setDataEvento] = useState("");
    const [loading, setLoading] = useState(false);

    // se tiver um evento passado por prop, a gente preenche os campos com os dados dele pra editar
    useEffect(() => {
        if (eventoParaEditar) {
            setTexto(eventoParaEditar.texto);
            // a data vem do banco num formato doido (ISO), a gente corta so a parte YYYY-MM-DD pro calendario entender
            const dataIso = new Date(eventoParaEditar.data_evento);
            const dataFormatada = dataIso.toISOString().split('T')[0];
            setDataEvento(dataFormatada);
        }
    }, [eventoParaEditar]);

    // funcao que roda quando aperta em salvar
    const handleSubmit = async (e) => {
        e.preventDefault(); // nao deixa a pagina recarregar
        if (!texto || !dataEvento) {
            return; // barra se tiver campo vazio
        }

        setLoading(true); // desativa o botao pra nao clicarem duas vezes
        try {
            // se tiver editando, manda o PUT pra atualizar, senao manda POST pra criar
            if (eventoParaEditar) {
                await atualizarEvento(eventoParaEditar.id, {
                    texto,
                    data_evento: new Date(dataEvento).toISOString() // converte de volta pro padrao ISO que o banco gosta
                });
            } else {
                await criarEvento({
                    texto,
                    data_evento: new Date(dataEvento).toISOString()
                });
            }
            // limpa tudo e avisa o componente pai que terminou
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
