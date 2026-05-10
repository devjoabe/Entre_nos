import { useEffect, useState } from "react";
import { buscarCartas, deletarCarta } from "../services/api";
import CriarCarta from "./criarCarta";
import "./CartasGrid.css";

export default function CartasGrid() {
    const [cartas, setCartas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarCriar, setMostrarCriar] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [cartaExpandida, setCartaExpandida] = useState(null);
    const [cartaParaEditar, setCartaParaEditar] = useState(null);

    const carregarCartas = async () => {
        setLoading(true);
        try {
            const data = await buscarCartas();
            // Optional: Sort by creation date descending
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

    const handleCartaCriada = () => {
        setMostrarCriar(false);
        setCartaParaEditar(null);
        setRefreshTrigger(prev => prev + 1);
    };

    const handleCartaClick = (id) => {
        if (cartaExpandida === id) {
            setCartaExpandida(null);
        } else {
            setCartaExpandida(id);
        }
    };

    const handleEditar = (e, carta) => {
        e.stopPropagation();
        setCartaParaEditar(carta);
        setMostrarCriar(true);
    };

    const handleDeletar = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Tem certeza que deseja apagar essa carta?")) {
            try {
                await deletarCarta(id);
                setCartaExpandida(null);
                setRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error("Erro ao deletar carta", error);
            }
        }
    };

    return (
        <div className="cartas-page">
            <div className="page-actions">
                <button 
                    className="btn-primary"
                    onClick={() => {
                        setCartaParaEditar(null);
                        setMostrarCriar(!mostrarCriar);
                    }}
                >
                    {mostrarCriar ? "Voltar para Cartas" : "✉ Escrever uma Carta"}
                </button>
            </div>

            {mostrarCriar ? (
                <CriarCarta 
                    onCartaCriada={handleCartaCriada} 
                    cartaParaEditar={cartaParaEditar}
                    onCancelarEdicao={() => {
                        setCartaParaEditar(null);
                        setMostrarCriar(false);
                    }}
                />
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
                        <div className="cartas-grid">
                            {cartas.map((carta) => {
                                const isExpanded = cartaExpandida === carta.id;
                                
                                return (
                                    <div 
                                        key={carta.id} 
                                        className={`carta-envelope ${isExpanded ? 'aberta' : ''}`}
                                        onClick={() => handleCartaClick(carta.id)}
                                    >
                                        <div className="envelope-cover">
                                            <h3>{carta.titulo}</h3>
                                            <span className="envelope-icon">✉</span>
                                            <p className="click-hint">Clique para abrir</p>
                                        </div>
                                        
                                        {isExpanded && (
                                            <div className="carta-paper" onClick={(e) => e.stopPropagation()}>
                                                <h3>{carta.titulo}</h3>
                                                <p>{carta.conteudo}</p>
                                                
                                                <div className="item-actions">
                                                    <button className="btn-action edit" onClick={(e) => handleEditar(e, carta)}>
                                                        ✎ Editar
                                                    </button>
                                                    <button className="btn-action delete" onClick={(e) => handleDeletar(e, carta.id)}>
                                                        ✕ Excluir
                                                    </button>
                                                </div>
                                            </div>
                                        )}
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
