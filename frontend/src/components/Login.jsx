import { useState } from "react";
import { login } from "../services/api";
import "./Login.css";

export default function Login({ onLogin }) {
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);

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
                <div className="login-icon">🔐</div>
                <h1 className="login-title">Entre Nós</h1>
                <p className="login-subtitle">Um lugar só nosso</p>

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
                </form>
            </div>
        </div>
    );
}
