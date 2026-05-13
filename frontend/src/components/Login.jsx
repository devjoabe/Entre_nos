import { useState } from "react";
import { login } from "../services/api";
import "./Login.css";

export default function Login({ onLogin }) {
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);
    const [dicaVisivel, setDicaVisivel] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!senha) return;

        setLoading(true);
        setErro("");
        try {
            const token = await login(senha);
            if (token) {
                onLogin(token);
            }
        } catch {
            setErro("A chave não abriu este lugar...");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="login-input-wrapper">
                        <input
                            type="password"
                            value={senha}
                            onChange={(e) => {
                                setSenha(e.target.value);
                                setErro("");
                            }}
                            placeholder="A chave secreta..."
                            className={`login-input ${erro ? "login-input--erro" : ""}`}
                            autoComplete="off"
                            autoFocus
                        />
                    </div>

                    {erro && (
                        <p className="login-erro">{erro}</p>
                    )}

                    <button
                        type="submit"
                        className="login-btn"
                        disabled={loading || !senha}
                    >
                        {loading ? "Abrindo..." : "Entrar"}
                    </button>

                    <button
                        type="button"
                        className="login-dica-btn"
                        onClick={() => setDicaVisivel(!dicaVisivel)}
                    >
                        {dicaVisivel ? "Esconder dica" : "Dica"}
                    </button>

                    {dicaVisivel && (
                        <p className="login-dica-texto">
                            O autor do livro que você estava lendo quando nós nos conhecemos.
                            <br />
                            <span className="login-dica-detalhe">Sem espaços e tudo minusculo.</span>
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
