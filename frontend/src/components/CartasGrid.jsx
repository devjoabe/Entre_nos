import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { buscarCartas, deletarCarta } from "../services/api";
import CriarCarta from "./criarCarta";
import "./CartasGrid.css";

export default function CartasGrid({ createTrigger, onCreateModeChange, isActive }) {
    const [cartas, setCartas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarCriar, setMostrarCriar] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [cartaAberta, setCartaAberta] = useState(null);
    const [cartaParaEditar, setCartaParaEditar] = useState(null);

    // salva o ultimo clique que o usuario deu pra abrir a tela de criar
    // assim a gente ignora se vier um clique fantasma de outra aba do navegador

    const carregarCartas = async () => {
        setLoading(true);
        try {
            // puxa as cartas do banco e ordena da mais nova pra mais velha
            const data = await buscarCartas();
            const sortedData = data.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao));
            setCartas(sortedData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarCartas();
    }, [refreshTrigger]);

    // se o usuario mudar de aba (ex: for pra timeline), a gente fecha a tela de criar carta
    // e atualiza o verificador pra ele nao reabrir a tela sem querer quando voltar
    useEffect(() => {
        if (!isActive) {
            setMostrarCriar(false);
            setCartaParaEditar(null);
            lastTriggerRef.current = createTrigger;
        }
    }, [isActive, createTrigger]);

    // so abre o formulario de criar carta se o clique for recente e se a pessoa tiver de fato na aba de Cartas
    useEffect(() => {
        if (createTrigger > lastTriggerRef.current && isActive) {
            lastTriggerRef.current = createTrigger;
            setCartaParaEditar(null);
            setMostrarCriar(true);
        }
    }, [createTrigger, isActive]);

    useEffect(() => {
        if (onCreateModeChange) onCreateModeChange(mostrarCriar);
    }, [mostrarCriar]);

    // roda quando o usuario termina de criar ou editar uma carta
    const handleCartaCriada = () => {
        setMostrarCriar(false);
        setCartaParaEditar(null);
        setRefreshTrigger(prev => prev + 1); // muda esse estado bobo so pro useEffect rodar e buscar as cartas de novo
    };

    const handleLerCarta = (carta) => setCartaAberta(carta);

    const handleEditar = (carta) => {
        setCartaAberta(null);
        setCartaParaEditar(carta);
        setMostrarCriar(true);
    };

    // apaga a carta dps de pedir confirmacao
    const handleDeletar = async (id) => {
        if (window.confirm("Tem certeza que deseja apagar essa carta?")) {
            try {
                await deletarCarta(id);
                setCartaAberta(null);
                setRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error("Erro ao deletar carta", error);
            }
        }
    };

    // formata a data da carta pra ficar com o mes por extenso (ex: 12 de mai de 2026)
    const formatarData = (dataStr) => {
        if (!dataStr) return "";
        const data = new Date(dataStr);
        return data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="cartas-page">
            {mostrarCriar ? (
                <>
                    <button
                        className="btn-voltar-lista"
                        onClick={() => {
                            setMostrarCriar(false);
                            setCartaParaEditar(null);
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        Voltar para Cartas
                    </button>
                    <CriarCarta
                        onCartaCriada={handleCartaCriada}
                        cartaParaEditar={cartaParaEditar}
                        onCancelarEdicao={() => {
                            setCartaParaEditar(null);
                            setMostrarCriar(false);
                        }}
                    />
                </>
            ) : (
                <>
                    {loading ? (
                        <div className="cartas-loading">Buscando cartas...</div>
                    ) : cartas.length === 0 ? (
                        <div className="cartas-empty empty-state-container">
                            <svg className="empty-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 7V17C4 18.1046 4.89543 19 6 19H18C19.1046 19 20 18.1046 20 17V7" />
                                <path d="M4 7L12 13L20 7" />
                                <path d="M4 7C4 5.89543 4.89543 5 6 5H18C19.1046 5 20 5.89543 20 7" />
                            </svg>
                            <p className="empty-title">Nenhuma carta ainda.</p>
                            <button className="btn-link" onClick={() => setMostrarCriar(true)}>
                                Escreva a sua primeira declaração
                            </button>
                        </div>
                    ) : (
                        <div className="cartas-list">
                            {cartas.map((carta) => (
                                <div
                                    key={carta.id}
                                    className="carta-card"
                                    onClick={() => handleLerCarta(carta)}
                                >
                                    <div className="carta-accent" />
                                    <div className="carta-card-header">
                                        <h3 className="carta-card-titulo">{carta.titulo}</h3>
                                        <span className="carta-card-data">{formatarData(carta.data_criacao)}</span>
                                    </div>
                                    <p className="carta-card-excerpt">{carta.conteudo}</p>
                                    <div className="carta-card-footer">
                                        <button className="btn-ler-carta" onClick={(e) => { e.stopPropagation(); handleLerCarta(carta); }}>
                                            ler carta
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                                <polyline points="12 5 19 12 12 19" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {cartaAberta && createPortal(
                <div className="carta-leitura-overlay" onClick={() => setCartaAberta(null)}>
                    <div className="carta-leitura-box" onClick={(e) => e.stopPropagation()}>
                        <h2 className="carta-leitura-titulo">{cartaAberta.titulo}</h2>
                        <p className="carta-leitura-corpo">{cartaAberta.conteudo}</p>
                        <div className="item-actions" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <button className="btn-action edit" onClick={() => handleEditar(cartaAberta)}>
                                ✎ Editar
                            </button>
                            <button className="btn-action delete" onClick={() => handleDeletar(cartaAberta.id)}>
                                ✕ Excluir
                            </button>
                        </div>
                        <button className="btn-close" onClick={() => setCartaAberta(null)}>
                            Fechar
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
