import "./Galeria.css";

export default function Galeria() {

    const fotos = [
        "/placeholder1.jpg",
        "/placeholder2.jpg",
        "/placeholder3.jpg",
        "/placeholder4.jpg",
        "/placeholder5.jpg",
        "/placeholder6.jpg"
    ];

    return (
        <div className="galeria-page">
            <div className="galeria-header">
                <h2>Momentos</h2>
            </div>

            <div className="galeria-grid">
                {fotos.map((src, index) => (
                    <div key={index} className="galeria-item">
                        <div className="foto-placeholder">
                            <span>Foto {index + 1}</span>
                        </div>
                        {/* 
                          Quando você tiver as fotos reais, você pode trocar a <div className="foto-placeholder"> acima por uma tag de imagem assim:
                          <img src={src} alt={`Momento ${index + 1}`} />
                        */}
                    </div>
                ))}
            </div>
        </div>
    );
}
