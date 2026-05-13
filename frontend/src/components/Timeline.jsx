import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { buscarEventos, deletarEvento } from "../services/api";
import CriarEvento from "./criarEvento";
import "./Timeline.css";

export default function Timeline({ createTrigger, onCreateModeChange }) {
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarCriar, setMostrarCriar] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [eventoSelecionado, setEventoSelecionado] = useState(null);
    const [eventoParaEditar, setEventoParaEditar] = useState(null);

    // FIX: a gente guarda o momento exato que a tela abriu
    // se vier um comando (trigger) antigo que ficou preso em outra aba, a gente ignora
    const mountTriggerRef = useRef(createTrigger);

    const carregarEventos = async () => {
        setLoading(true);
        try {
            // puxa os eventos da api e ordena eles da data mais antiga pra mais nova
            const data = await buscarEventos();
            const sortedData = data.sort((a, b) => new Date(a.data_evento) - new Date(b.data_evento));
            setEventos(sortedData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarEventos();
    }, [refreshTrigger]);

    // FIX: so deixa abrir a tela de criar um evento se o clique no botão '+' aconteceu DEPOIS da tela carregar
    useEffect(() => {
        if (createTrigger > mountTriggerRef.current) {
            setEventoParaEditar(null);
            setMostrarCriar(true);
        }
    }, [createTrigger]);

    useEffect(() => {
        if (onCreateModeChange) onCreateModeChange(mostrarCriar);
    }, [mostrarCriar]);

    // converte a data pra um formato bonitinho (ex: 12 de maio de 2026)
    const formatarData = (dataStr) => {
        const data = new Date(dataStr);
        return data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // fecha o form de criacao e forca a lista a recarregar as memorias novas
    const handleEventoCriado = () => {
        setMostrarCriar(false);
        setEventoParaEditar(null);
        setRefreshTrigger(prev => prev + 1); // muda esse numero so pra forcar o useEffect a rodar de novo
    };

    const handleEditar = (evento) => {
        setEventoSelecionado(null);
        setEventoParaEditar(evento);
        setMostrarCriar(true);
    };

    // apaga um evento depois de confirmar pra nao apagar sem querer
    const handleDeletar = async (id) => {
        if (window.confirm("Tem certeza que deseja apagar essa data?")) {
            try {
                await deletarEvento(id);
                setEventoSelecionado(null);
                setRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error("Erro ao deletar evento", error);
            }
        }
    };

    return (
        <div className="timeline-page">
            {eventoSelecionado && createPortal(
                <div className="modal-overlay" onClick={() => setEventoSelecionado(null)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <span className="modal-date">
                            {formatarData(eventoSelecionado.data_evento)}
                        </span>
                        <div className="modal-body">
                            <p>{eventoSelecionado.texto}</p>
                        </div>
                        <div className="item-actions" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <button className="btn-action edit" onClick={() => handleEditar(eventoSelecionado)}>
                                ✎ Editar
                            </button>
                            <button className="btn-action delete" onClick={() => handleDeletar(eventoSelecionado.id)}>
                                ✕ Excluir
                            </button>
                        </div>
                        <button className="btn-close" onClick={() => setEventoSelecionado(null)}>
                            Fechar
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {mostrarCriar ? (
                <>
                    <button
                        className="btn-voltar-lista"
                        onClick={() => {
                            setMostrarCriar(false);
                            setEventoParaEditar(null);
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        Voltar para Linha do Tempo
                    </button>
                    <CriarEvento
                        onEventoCriado={handleEventoCriado}
                        eventoParaEditar={eventoParaEditar}
                        onCancelarEdicao={() => {
                            setEventoParaEditar(null);
                            setMostrarCriar(false);
                        }}
                    />
                </>
            ) : (
                <>
                    {loading ? (
                        <div className="timeline-loading">Carregando memórias...</div>
                    ) : eventos.length === 0 ? (
                        <div className="timeline-empty empty-state-container">
                            <svg className="empty-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                            <p className="empty-title">Nenhuma data marcada.</p>
                            <button className="btn-link" onClick={() => setMostrarCriar(true)}>
                                Qual foi o dia mais inesquecível?
                            </button>
                        </div>
                    ) : (
                        <div className="timeline-container">
                            {eventos.map((evento, index) => {
                                const sideClass = index % 2 === 0 ? "left" : "right";
                                return (
                                    <div key={evento.id} className={`timeline-item ${sideClass}`}>
                                        <div className="timeline-dot"></div>
                                        <div
                                            className="timeline-content"
                                            onClick={() => setEventoSelecionado(evento)}
                                        >
                                            <span className="timeline-date">
                                                {formatarData(evento.data_evento)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
