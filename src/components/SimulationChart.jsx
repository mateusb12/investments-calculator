
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



const useMediaQuery = (query) => {
    
    const [matches, setMatches] = useState(
        
        () => typeof window !== 'undefined' ? window.matchMedia(query).matches : false
    );

    useEffect(() => {
        
        if (typeof window === 'undefined') {
            return;
        }

        const media = window.matchMedia(query);
        
        if (media.matches !== matches) {
            setMatches(media.matches);
        }

        
        const listener = () => {
            setMatches(media.matches);
        };

        // Usa o método moderno addEventListener (compatível com todos os navegadores atuais)
        media.addEventListener('change', listener);

        
        return () => media.removeEventListener('change', listener);
    }, [matches, query]); 

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
    
    if (value === 0) return 'R$\u00A00';

    
    if (Math.abs(value) >= 1000000) {
        const formattedValue = (value / 1000000).toLocaleString('pt-BR', {
            maximumFractionDigits: 1,
        });
        
        return `R$\u00A0${formattedValue}M`;
    }

    
    if (Math.abs(value) >= 1000) {
        const formattedValue = (value / 1000).toLocaleString('pt-BR', {
            maximumFractionDigits: 1,
        });
        
        return `R$\u00A0${formattedValue}k`;
    }

    
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0, 
    }).format(value);
};

// Helper para formatar valores no tooltip (sempre completo)
const tooltipFormatter = (value, name) => {
    const formattedValue = formatCurrency(value);
    return [formattedValue, name];
};

function SimulationChart({ data }) {
    
    
    const isMobile = useMediaQuery('(max-width: 768px)');

    
    const yAxisFormatter = (value) =>
        isMobile ? formatCurrencyMobile(value) : formatCurrency(value);

    return (
        <div className="" style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    
                    
                    margin={{
                        top: 10,
                        right: 10,
                        
                        left: isMobile ? 20 : 40,
                        bottom: 20,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

                    <XAxis dataKey="month" />

                    <YAxis
                        yAxisId="left"
                        
                        
                        tickFormatter={yAxisFormatter}
                        
                        
                    />

                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        
                        
                        tickFormatter={yAxisFormatter}
                        
                        
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
                        dot={false} 
                    />

                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="reinvestEnd"
                        name="Montante (Reinvestindo)"
                        stroke="#16a34a"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                        dot={false} 
                    />

                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="currentPrice"
                        name="Preço da Cota"
                        stroke="#2563eb"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false} 
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default SimulationChart;