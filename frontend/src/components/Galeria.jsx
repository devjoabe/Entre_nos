import "./Galeria.css";

export default function Galeria() {
    // Lista de placeholders com alturas diferentes para simular o efeito Masonry
    const fotos = [
        { id: 1, color: "#4a1c2c", icon: "♥", height: "300px" },
        { id: 2, color: "#3a242a", icon: "✳", height: "400px" },
        { id: 3, color: "#2d244a", icon: "⬡", height: "350px" },
        { id: 4, color: "#2a243a", icon: "✦", height: "450px" },
        { id: 5, color: "#1c2c1c", icon: "✿", height: "300px" },
        { id: 6, color: "#3a2a1c", icon: "✧", height: "380px" },
        { id: 7, color: "#1c243a", icon: "◇", height: "320px" },
        { id: 8, color: "#2a3a2a", icon: "◆", height: "420px" },
        { id: 9, color: "#1c3a2a", icon: "♡", height: "360px" },
    ];

    return (
        <div className="galeria-page">
            <header className="galeria-header">
                <h2>Nossa galeria</h2>
                <p>Momentos que ficaram para sempre</p>
            </header>

            <div className="galeria-masonry">
                {fotos.map((foto) => (
                    <div 
                        key={foto.id} 
                        className="galeria-item"
                        style={{ height: foto.height, backgroundColor: foto.color }}
                    >
                        <div className="galeria-overlay">
                            <span className="galeria-icon">{foto.icon}</span>
                            <button className="galeria-delete-btn">🗑</button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="galeria-footer">
                <button className="btn-add-foto">
                    <span>📷</span> Adicionar foto
                </button>
            </div>
        </div>
    );
}
