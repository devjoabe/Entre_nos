import { useState, useEffect, useRef } from "react";
import { buscarFotos, uploadFoto, deletarFoto } from "../services/api";
import "./Galeria.css";

const FRAME_COLORS = [
    '#4a1a30',
    '#2a1a3a',
    '#1a2a3a',
    '#3a1a28',
    '#1a2a1a',
    '#3a2a10',
    '#1a3a2a',
];

export default function Galeria({ createTrigger, onCreateModeChange }) {
    const [fotos, setFotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fotoAberta, setFotoAberta] = useState(null);
    const fileInputRef = useRef(null);

    // FIX: guarda o valor de createTrigger no momento em que o componente montou.
    // Qualquer trigger igual ou anterior a esse valor é ignorado — veio de outra aba.
    const mountTriggerRef = useRef(createTrigger);

    const API_URL = `http://${window.location.hostname}:8000`;

    useEffect(() => {
        carregarFotos();
    }, []);

    // FIX: só abre o file picker se o trigger veio APÓS a montagem do componente
    useEffect(() => {
        if (createTrigger > mountTriggerRef.current && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [createTrigger]);

    useEffect(() => {
        if (onCreateModeChange) onCreateModeChange(false);
    }, []);

    const carregarFotos = async () => {
        try {
            const data = await buscarFotos();
            setFotos(data);
        } catch (error) {
            console.error("Erro ao carregar fotos:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            await uploadFoto(file);
            await carregarFotos();
        } catch (error) {
            alert("Erro ao subir foto. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!confirm("Tem certeza que deseja apagar essa lembrança?")) return;
        try {
            await deletarFoto(id);
            setFotos(fotos.filter(f => f.id !== id));
            if (fotoAberta && fotoAberta.id === id) setFotoAberta(null);
        } catch (error) {
            alert("Erro ao deletar foto.");
        }
    };

    return (
        <div className="galeria-page">
            <header className="galeria-header">
                <h2>Momentos</h2>
                <p>Um pouco de tudo que vivemos juntos</p>
            </header>

            {loading && fotos.length === 0 ? (
                <div className="loading-container">Carregando memórias...</div>
            ) : fotos.length === 0 && !loading ? (
                <div className="empty-galeria">
                    <p>Ainda não temos fotos aqui. Que tal adicionar a primeira?</p>
                </div>
            ) : (
                <div className="galeria-masonry">
                    {fotos.map((foto, index) => {
                        const frameColor = FRAME_COLORS[index % FRAME_COLORS.length];
                        return (
                            <div
                                key={foto.id}
                                className="galeria-item"
                                style={{ '--frame-color': frameColor }}
                                onClick={() => setFotoAberta(foto)}
                            >
                                <div className="galeria-frame">
                                    <img
                                        src={foto.url.startsWith('http') ? foto.url : `${import.meta.env.VITE_API_URL || API_URL}${foto.url}`}
                                        alt="Momento especial"
                                        loading="lazy"
                                    />
                                </div>
                                <div className="galeria-overlay">
                                    <button
                                        className="galeria-delete-btn"
                                        onClick={(e) => handleDelete(e, foto.id)}
                                        title="Remover lembrança"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            {fotoAberta && (
                <div className="lightbox-backdrop" onClick={() => setFotoAberta(null)}>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={() => setFotoAberta(null)}>✕</button>
                        <img
                            src={fotoAberta.url.startsWith('http') ? fotoAberta.url : `${import.meta.env.VITE_API_URL || API_URL}${fotoAberta.url}`}
                            alt="Momento especial"
                            className="lightbox-img"

                        />
                    </div>
                </div>
            )}
        </div>
    );
}
