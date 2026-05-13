import { useEffect, useState } from "react";
import { buscarCarta } from "../services/api";

export default function VisualizarCarta() {
    const [carta, setCarta] = useState(null);

    useEffect(() => {
        buscarCarta(0).then(setCarta);
    }, []);

    if (!carta) return <p>Carregando...</p>;

    return <div>{carta.texto || carta.msg}</div>;
}