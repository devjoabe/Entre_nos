import { useState, useEffect, useRef } from "react";
import { buscarFotos, uploadFoto, deletarFoto } from "../services/api";
import "./Galeria.css";

export default function Galeria() {
    const [fotos, setFotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);
    const API_URL = `http://${window.location.hostname}:8000`;

    useEffect(() => {
        carregarFotos();
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

    const handleAddClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            await uploadFoto(file);
            await carregarFotos(); // Recarrega a lista
        } catch (error) {
            alert("Erro ao subir foto. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Tem certeza que deseja apagar essa lembrança?")) return;

        try {
            await deletarFoto(id);
            setFotos(fotos.filter(f => f.id !== id));
        } catch (error) {
            alert("Erro ao deletar foto.");
        }
    };

    return (
        <div className="galeria-page">
            <header className="galeria-header">
                <h2>Nossa galeria</h2>
                <p>Momentos que ficaram para sempre</p>
            </header>

            {loading && fotos.length === 0 ? (
                <div className="loading-container">Carregando memórias...</div>
            ) : (
                <div className="galeria-masonry">
                    {fotos.map((foto) => (
                        <div key={foto.id} className="galeria-item">
                            <img 
                                src={`${API_URL}${foto.url}`} 
                                alt="Momento especial" 
                                loading="lazy"
                            />
                            <div className="galeria-overlay">
                                <button 
                                    className="galeria-delete-btn"
                                    onClick={() => handleDelete(foto.id)}
                                    title="Remover lembrança"
                                >
                                    🗑
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && fotos.length === 0 && (
                <div className="empty-galeria">
                    <p>Ainda não temos fotos aqui. Que tal adicionar a primeira?</p>
                </div>
            )}

            <div className="galeria-footer">
                <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: "none" }} 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
                <button 
                    className="btn-add-foto" 
                    onClick={handleAddClick}
                    disabled={loading}
                >
                    <span>📷</span> {loading ? "Enviando..." : "Adicionar foto"}
                </button>
            </div>
        </div>
    );
}
