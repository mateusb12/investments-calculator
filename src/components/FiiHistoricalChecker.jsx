import React, { useState, useEffect } from 'react';
// 1. Importar o novo serviço (path corrigido)
import { fetchB3Prices, fetchUniqueTickers } from "../services/b3service";
import Pagination from './Pagination';

function FiiHistoricalChecker() {
    // 2. Iniciar states de ticker como vazios
    const [ticker, setTicker] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchedTicker, setSearchedTicker] = useState('');

    // 3. Novos states para a lista de tickers do dropdown
    const [tickerList, setTickerList] = useState([]);
    const [tickersLoading, setTickersLoading] = useState(false);

    // 4. Modificar loadPage para aceitar um ticker opcional (para busca/load inicial)
    const loadPage = async (pageToLoad, tickerToSearch = null) => {
        setLoading(true);
        setError(null);

        // Se um novo ticker for fornecido (tickerToSearch), use-o.
        // Caso contrário (paginação), use o ticker já buscado (searchedTicker).
        const tickerToFetch = tickerToSearch || searchedTicker;

        if (!tickerToFetch) {
            setLoading(false);
            return; // Não fazer nada se não houver ticker
        }

        try {
            const { data, count } = await fetchB3Prices(tickerToFetch, pageToLoad, pageSize);
            setData(data);
            setTotal(count);
            // 5. Se foi uma nova busca, atualize o 'searchedTicker'
            if (tickerToSearch) {
                setSearchedTicker(tickerToSearch);
            }
        } catch (err) {
            console.error(err);
            setError('Erro ao buscar dados no Supabase.');
            setData([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    // 6. NOVO useEffect - Roda UMA VEZ no load inicial para carregar o dropdown
    useEffect(() => {
        async function loadTickers() {
            setTickersLoading(true);
            setError(null);
            try {
                const tickers = await fetchUniqueTickers();
                setTickerList(tickers);

                // Definir um ticker padrão
                const defaultTicker = tickers.includes('BPFF11') ? 'BPFF11' : (tickers[0] || '');

                if (defaultTicker) {
                    setTicker(defaultTicker); // Define o valor do dropdown
                    // Chama o load inicial da página 1 com o ticker padrão
                    loadPage(1, defaultTicker);
                }
            } catch (err) {
                console.error("Falha ao carregar tickers", err);
                setError('Erro ao carregar a lista de tickers. Verifique se a VIEW "unique_tickers_view" foi criada no Supabase.');
            } finally {
                setTickersLoading(false);
            }
        }

        loadTickers();
    }, []); // Array vazio, roda só no mount

    // 7. useEffect para PAGINAÇÃO (reage a 'page')
    // (O useEffect de load inicial foi removido e substituído pelo de cima)
    useEffect(() => {
        // Só carrega se já tiver um ticker buscado E não for a página 1
        // (pois o load da página 1 é feito pelo effect de cima ou pelo handleSearch)
        if (searchedTicker && page > 1) {
            loadPage(page); // Chama sem ticker novo, vai usar 'searchedTicker'
        }
        // Se a página for resetada para 1 (pelo handleSearch), este effect não
        // fará a busca, pois o próprio handleSearch já chama o loadPage.
    }, [page]); // Removido 'searchedTicker' daqui

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1); // Reseta a página
        loadPage(1, ticker); // Inicia a busca com a página 1 e o NOVO ticker do dropdown
    };

    const totalPages = Math.ceil(total / pageSize);

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">
                Histórico de FII (Supabase)
            </h2>

            {/* --- CARD DE INPUTS --- */}
            <div className="border border-gray-500 bg-white rounded-lg shadow-md p-6 max-w-2xl">
                <form onSubmit={handleSearch} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ticker do FII
                        </label>
                        {/* 8. SUBSTITUIR o <input> por este <select> */}
                        <select
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value)}
                            disabled={tickersLoading || loading} // Desabilita enquanto carrega a lista OU os dados
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                            {tickersLoading ? (
                                <option>Carregando tickers...</option>
                            ) : (
                                tickerList.map(t => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={loading || tickersLoading} // Desabilita em qualquer load
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                        {loading ? "Buscando..." : "Buscar Histórico"}
                    </button>
                </form>
            </div>

            {/* --- ÁREA DE RESULTADOS --- */}
            <div className="mt-8 max-w-2xl space-y-6">
                {/* Mostra "Carregando" apenas se for a primeira vez ou se a busca for nova */}
                {loading && data.length === 0 && <p className="text-gray-500">Carregando...</p>}
                {error && <p className="mt-6 text-red-500">{error}</p>}

                {/* Card de Resultados */}
                {!error && (data.length > 0 || !loading) && (
                    <div className="border border-gray-300 bg-white rounded-lg shadow-lg p-6">
                        {data.length > 0 ? (
                            <>
                                <p className="text-gray-700 text-sm mb-4">
                                    Exibindo página {page} de {totalPages} ({total} registros para <strong>{searchedTicker}</strong>)
                                </p>

                                {/* Opacidade na tabela durante o carregamento de novas páginas */}
                                <div className={`overflow-x-auto transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
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


                                <div className="mt-6">
                                    <Pagination
                                        currentPage={page}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                </div>
                            </>
                        ) : (
                            // Mensagem para quando a busca não retorna nada (e não está carregando)
                            !loading && searchedTicker && (
                                <p className="text-gray-600">
                                    Nenhum dado encontrado para o ticker "{searchedTicker}".
                                </p>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default FiiHistoricalChecker;