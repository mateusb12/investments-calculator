// src/components/FiiHistoricalChecker.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function FiiHistoricalChecker() {
    const [ticker, setTicker] = useState('BPFF11');
    const [monthsBack, setMonthsBack] = useState(12);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const API_KEY = import.meta.env.VITE_HGBRASIL_API_KEY;
    const endpoint = 'https://api.hgbrasil.com/v2/finance/historical';

    const fetchHistorical = async () => {
        setLoading(true);
        setError(null);
        setData(null);
        try {
            // calcula days_ago aproximado: mesesBack * ~30 dias
            const daysAgo = monthsBack * 30;
            const resp = await axios.get(endpoint, {
                params: {
                    key: API_KEY,
                    symbol: ticker,
                    days_ago: daysAgo,
                    sample_by: '1d'
                }
            });
            // supondo que resp.data.results seja array de { date, close } ou similar
            const results = resp.data.results || [];
            setData(results);
        } catch (err) {
            console.error('Erro ao buscar histórico:', err);
            setError('Erro ao buscar histórico para ' + ticker);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // opcional: disparar fetch ao montar ou quando ticker/monthsBack mudam
        fetchHistorical();
    }, [ticker, monthsBack]);

    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Verificador de Histórico de FII</h2>

            <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ticker do FII (ex: BPFF11)</label>
                        <input
                            type="text"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de meses no passado para buscar
                        </label>
                        <input
                            type="number"
                            value={monthsBack}
                            onChange={(e) => setMonthsBack(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="1"
                            step="1"
                        />
                    </div>

                    <button
                        onClick={fetchHistorical}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                    >
                        Buscar histórico
                    </button>
                </div>

                {loading && <p className="mt-6 text-gray-500">Carregando histórico…</p>}

                {error && <p className="mt-6 text-red-500">{error}</p>}

                {data && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Resultado para {ticker}</h3>
                        <p className="text-gray-700">Pontos de dados obtidos: {data.length}</p>
                        <ul className="list-disc list-inside text-gray-700">
                            {data.slice(0, 5).map((pt, idx) => (
                                <li key={idx}>
                                    {pt.date} — fechamento: {pt.close}
                                </li>
                            ))}
                        </ul>
                        {data.length > 5 && <p className="text-sm text-gray-500">… exibindo os 5 primeiros.</p>}
                    </div>
                )}
            </div>
        </div>
    );
}

export default FiiHistoricalChecker;
