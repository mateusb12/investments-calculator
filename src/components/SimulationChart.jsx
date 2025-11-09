// src/components/SimulationChart.jsx
import React, { useState, useEffect } from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';

// --- HOOK PARA DETECTAR MEDIA QUERY (TAMANHO DA TELA) ---
// Este hook nos permite saber se estamos em um dispositivo móvel
const useMediaQuery = (query) => {
    // Verifica o estado inicial no lado do cliente
    const [matches, setMatches] = useState(
        // typeof window !== 'undefined' garante que o código só rode no navegador
        () => typeof window !== 'undefined' ? window.matchMedia(query).matches : false
    );

    useEffect(() => {
        // Novamente, só executa no navegador
        if (typeof window === 'undefined') {
            return;
        }

        const media = window.matchMedia(query);
        // Atualiza o estado se a correspondência da media query mudar
        if (media.matches !== matches) {
            setMatches(media.matches);
        }

        // Adiciona um listener para mudanças (ex: girar o celular, redimensionar janela)
        const listener = () => {
            setMatches(media.matches);
        };

        // Usa o método moderno addEventListener (compatível com todos os navegadores atuais)
        media.addEventListener('change', listener);

        // Limpa o listener quando o componente for desmontado
        return () => media.removeEventListener('change', listener);
    }, [matches, query]); // Dependências do efeito

    return matches;
};

// --- FORMATADORES DE MOEDA ---

// Helper para formatar moeda (FORMATO COMPLETO)
const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);

// Helper para formatar moeda (FORMATO ABREVIADO PARA MOBILE)
// Ex: 10000 -> "R$ 10k", 7500 -> "R$ 7,5k", 1200000 -> "R$ 1,2M"
const formatCurrencyMobile = (value) => {
    // Usa \u00A0 (non-breaking space) para evitar quebra de linha
    if (value === 0) return 'R$\u00A00';

    // Formata para Milhões (M)
    if (Math.abs(value) >= 1000000) {
        const formattedValue = (value / 1000000).toLocaleString('pt-BR', {
            maximumFractionDigits: 1,
        });
        // Usa \u00A0 (non-breaking space)
        return `R$\u00A0${formattedValue}M`;
    }

    // Formata para Mil (k)
    if (Math.abs(value) >= 1000) {
        const formattedValue = (value / 1000).toLocaleString('pt-BR', {
            maximumFractionDigits: 1,
        });
        // Usa \u00A0 (non-breaking space)
        return `R$\u00A0${formattedValue}k`;
    }

    // Mantém o valor normal se for menor que 1000
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0, // Remove centavos para valores < 1k
    }).format(value);
};

// Helper para formatar valores no tooltip (sempre completo)
const tooltipFormatter = (value, name) => {
    const formattedValue = formatCurrency(value);
    return [formattedValue, name];
};

function SimulationChart({ data }) {
    // --- LÓGICA DE RESPONSIVIDADE ---
    // Define o ponto de corte para mobile (md: 768px no Tailwind)
    const isMobile = useMediaQuery('(max-width: 768px)');

    // Decide qual formatador usar baseado no tamanho da tela
    const yAxisFormatter = (value) =>
        isMobile ? formatCurrencyMobile(value) : formatCurrency(value);

    return (
        <div className="" style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    // Ajusta a margem esquerda no mobile para dar mais espaço
                    // No desktop, mantém uma margem maior para o texto completo
                    margin={{
                        top: 10,
                        right: 10,
                        // Margem dinâmica: 20px no mobile (aumentado de 10), 40px no desktop
                        left: isMobile ? 20 : 40,
                        bottom: 20,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

                    <XAxis dataKey="month" />

                    {/* Eixo Y Esquerdo (Patrimônio) */}
                    <YAxis
                        yAxisId="left"
                        // --- ALTERAÇÃO PRINCIPAL ---
                        // Usa o formatador dinâmico
                        tickFormatter={yAxisFormatter}
                        // Remove a largura fixa e deixa o Recharts calcular
                        // width={isMobile ? 50 : undefined} // <-- REMOVIDO
                    />

                    {/* Eixo Y Direito (Preço da Cota) */}
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        // --- ALTERAÇÃO PRINCIPAL ---
                        // Usa o formatador dinâmico
                        tickFormatter={yAxisFormatter}
                        // Remove a largura fixa e deixa o Recharts calcular
                        // width={isMobile ? 50 : undefined} // <-- REMOVIDO
                    />

                    <Tooltip formatter={tooltipFormatter} />
                    <Legend />

                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="noReinvestEnd"
                        name="Montante (Sem Reinvestir)"
                        stroke="#7e22ce"
                        strokeWidth={2}
                        strokeOpacity={0.75}
                        dot={false} // Remove os pontos para uma linha mais limpa
                    />

                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="reinvestEnd"
                        name="Montante (Reinvestindo)"
                        stroke="#16a34a"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                        dot={false} // Remove os pontos para uma linha mais limpa
                    />

                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="currentPrice"
                        name="Preço da Cota"
                        stroke="#2563eb"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false} // Remove os pontos para uma linha mais limpa
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default SimulationChart;