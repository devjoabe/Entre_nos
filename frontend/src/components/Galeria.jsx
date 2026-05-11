import { useState, useEffect, useRef } from "react";
import { buscarFotos, uploadFoto, deletarFoto } from "../services/api";
import "./Galeria.css";

// Paleta de cores para molduras
const FRAME_COLORS = [
    '#4a1a30', // vinho rosado
    '#2a1a3a', // roxo escuro
    '#1a2a3a', // azul meia-noite
    '#3a1a28', // bordô
    '#1a2a1a', // verde musgo escuro
    '#3a2a10', // âmbar queimado
    '#1a3a2a', // verde esmeralda escuro
];

export default function Galeria({ createTrigger, onCreateModeChange }) {
    const [fotos, setFotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fotoAberta, setFotoAberta] = useState(null);
    const fileInputRef = useRef(null);
    const API_URL = `http://${window.location.hostname}:8000`;

    useEffect(() => {
        carregarFotos();
    }, []);

    // Listen for FAB trigger from App — open file picker
    useEffect(() => {
        if (createTrigger > 0 && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [createTrigger]);

    // Galeria never enters "create mode" (file picker is instant), so always report false
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

    const handleFotoClick = (foto) => {
        setFotoAberta(foto);
    };

    const handleCloseLightbox = () => {
        setFotoAberta(null);
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
                                onClick={() => handleFotoClick(foto)}
                            >
                                <div className="galeria-frame">
                                    <img
                                        src={`${API_URL}${foto.url}`}
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

            {/* Hidden file input */}
            <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            {/* Lightbox / Photo Viewer */}
            {fotoAberta && (
                <div className="lightbox-backdrop" onClick={handleCloseLightbox}>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={handleCloseLightbox}>✕</button>
                        <img
                            src={`${API_URL}${fotoAberta.url}`}
                            alt="Momento especial"
                            className="lightbox-img"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
