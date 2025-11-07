// src/components/FiiHistoricalChecker.jsx
import React, { useState, useEffect } from 'react';
import { fetchB3Prices } from "../services/b3service.js";

function FiiHistoricalChecker() {
    const [ticker, setTicker] = useState('BPFF11');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Armazena o ticker que está sendo buscado para
    // poder exibir na mensagem de "nenhum dado encontrado"
    const [searchedTicker, setSearchedTicker] = useState(ticker);

    const loadPage = async () => {
        setLoading(true);
        setError(null);
        setSearchedTicker(ticker); // Salva o ticker que estamos buscando
        try {
            const { data, count } = await fetchB3Prices(ticker, page, pageSize);
            setData(data);
            setTotal(count);
        } catch (err) {
            console.error(err);
            setError('Erro ao buscar dados no Supabase.');
        } finally {
            setLoading(false);
        }
    };

    // Recarrega quando a página ou o ticker (na submissão) mudam
    useEffect(() => {
        loadPage();
    }, [page, searchedTicker]); // MUDADO: Reage a 'searchedTicker'

    const handleSearch = (e) => {
        e.preventDefault(); // Impede o reload da página se estiver num form
        setPage(1); // Reseta a página
        loadPage(); // Força o carregamento (agora que o 'searchedTicker' será atualizado)
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">
                Histórico de FII (Supabase)
            </h2>

            {/* --- CARD DE INPUTS --- */}
            {/* Aplicado o mesmo estilo do card de inputs da calculadora */}
            <div className="border border-gray-500 bg-white rounded-lg shadow-md p-6 max-w-2xl">
                {/* Envolvemos em um <form> para permitir a busca com "Enter"
                    e usamos um botão para disparar a busca.
                */}
                <form onSubmit={handleSearch} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ticker do FII (ex: BPFF11)
                        </label>
                        <input
                            type="text"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    {/* Botão de busca para ficar similar à ação do "Comparar Cenários" */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                        {loading ? "Buscando..." : "Buscar Histórico"}
                    </button>
                </form>
            </div>

            {/* --- ÁREA DE RESULTADOS --- */}
            {/* Esta div agora fica FORA do card de inputs */}
            <div className="mt-8 max-w-2xl space-y-6">
                {loading && <p className="text-gray-500">Carregando...</p>}
                {error && <p className="mt-6 text-red-500">{error}</p>}

                {/* Card de Resultados (só aparece se NÃO estiver carregando e NÃO tiver erro) */}
                {!loading && !error && (
                    <div className="border border-gray-300 bg-white rounded-lg shadow-lg p-6">
                        {data.length > 0 ? (
                            <>
                                <p className="text-gray-700 text-sm mb-4">
                                    Exibindo página {page} de {totalPages} ({total} registros para <strong>{searchedTicker}</strong>)
                                </p>

                                {/* Tabela */}
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-gray-300 text-sm">
                                        <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border border-gray-300 px-2 py-1 text-left">Data</th>
                                            <th className="border border-gray-300 px-2 py-1 text-left">Abertura</th>
                                            <th className="border border-gray-300 px-2 py-1 text-left">Fechamento</th>
                                            <th className="border border-gray-300 px-2 py-1 text-left">Volume</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {data.map((row) => (
                                            <tr key={`${row.ticker}-${row.trade_date}`} className="hover:bg-gray-50">
                                                <td className="border px-2 py-1">{row.trade_date}</td>
                                                <td className="border px-2 py-1">{row.open}</td>
                                                <td className="border px-2 py-1">{row.close}</td>
                                                <td className="border px-2 py-1">{row.volume}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>


                                {/* Paginação */}
                                <div className="mt-4 flex justify-between">
                                    <button
                                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                        disabled={page <= 1}
                                        className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
                                    >
                                        ← Anterior
                                    </button>
                                    <button
                                        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                        disabled={page >= totalPages}
                                        className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
                                    >
                                        Próxima →
                                    </button>
                                </div>
                            </>
                        ) : (
                            // Mensagem para quando a busca não retorna nada
                            <p className="text-gray-600">
                                Nenhum dado encontrado para o ticker "{searchedTicker}".
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default FiiHistoricalChecker;