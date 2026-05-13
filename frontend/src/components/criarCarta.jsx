import { useState, useEffect } from "react";
import { criarCarta, atualizarCarta } from "../services/api";
import "./criarCarta.css";

export default function CriarCarta({ onCartaCriada, cartaParaEditar, onCancelarEdicao }) {
    const [titulo, setTitulo] = useState("");
    const [conteudo, setConteudo] = useState("");
    const [loading, setLoading] = useState(false);

    // se a gente passou uma carta especifica pra editar, preenche os campos com os dados dela
    useEffect(() => {
        if (cartaParaEditar) {
            setTitulo(cartaParaEditar.titulo);
            setConteudo(cartaParaEditar.conteudo);
        }
    }, [cartaParaEditar]);

    // funcao que roda quando a pessoa clica em salvar
    const handleSubmit = async (e) => {
        e.preventDefault(); // segura a pagina pra nao recarregar do nada
        if (!titulo || !conteudo) {
            return; // nao deixa salvar se tiver coisa em branco
        }

        setLoading(true); // avisa que ta carregando pra desabilitar o botao
        try {
            // se tiver id, quer dizer que ta editando uma existente, senao cria uma nova do zero
            if (cartaParaEditar) {
                await atualizarCarta(cartaParaEditar.id, { titulo, conteudo });
            } else {
                await criarCarta({ titulo, conteudo });
            }
            // limpa os campos dps que deu certo
            setTitulo("");
            setConteudo("");
            
            // avisa o componente de fora que terminou
            if (onCartaCriada) onCartaCriada();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false); // tira o estado de carregando msm se der erro
        }
    };

    return (
        <div className="criar-carta-container">
            <h2>{cartaParaEditar ? "Editar Carta" : "Escrever Nova Carta"}</h2>
            <form onSubmit={handleSubmit} className="criar-carta-form">
                <div className="form-group">
                    <label>Título Especial</label>
                    <input
                        type="text"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        placeholder="Ex: Para o amor da minha vida"
                    />
                </div>

                <div className="form-group">
                    <label>Sua Mensagem</label>
                    <textarea
                        value={conteudo}
                        onChange={(e) => setConteudo(e.target.value)}
                        placeholder="Escreva tudo o que sente..."
                        rows="5"
                    />
                </div>

                <div className="form-actions" style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                    <button type="submit" disabled={loading} className="btn-enviar">
                        {loading ? "Salvando..." : (cartaParaEditar ? "Atualizar Carta" : "Guardar Carta")}
                    </button>
                    {cartaParaEditar && (
                        <button type="button" className="btn-link" onClick={onCancelarEdicao}>
                            Cancelar Edição
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}