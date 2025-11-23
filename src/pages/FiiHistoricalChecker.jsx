import React, { useState, useEffect, useRef } from 'react';
import { fetchFiiDividends, fetchUniqueTickers, fetchFiiChartData } from '../services/b3service.js';
import Pagination from '../components/Pagination.jsx';
import HistoryChart from '../components/HistoryChart.jsx';

function FiiHistoricalChecker() {
  const [ticker, setTicker] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [tableData, setTableData] = useState([]);
  const [total, setTotal] = useState(0);

  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState(12);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchedTicker, setSearchedTicker] = useState('');
  const [tickerList, setTickerList] = useState([]);
  const [tickersLoading, setTickersLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const inputRef = useRef(null);
  const comboboxRef = useRef(null);

  const loadTableData = async (pageToLoad, tickerToSearch = null) => {
    setLoading(true);
    setError(null);
    const tickerToFetch = tickerToSearch || searchedTicker;

    if (!tickerToFetch) {
      setLoading(false);
      return;
    }

    try {
      const { data, count } = await fetchFiiDividends(tickerToFetch, pageToLoad, pageSize);
      setTableData(data);
      setTotal(count);

      if (tickerToSearch) {
        setSearchedTicker(tickerToSearch);
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao buscar dividendos.');
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async (tickerToFetch) => {
    if (!tickerToFetch) return;

    try {
      const data = await fetchFiiChartData(tickerToFetch, timeRange);
      setChartData(data);
    } catch (err) {
      console.error('Erro ao carregar gráfico', err);
    }
  };

  useEffect(() => {
    async function loadTickers() {
      setTickersLoading(true);
      try {
        const tickers = await fetchUniqueTickers();
        setTickerList(tickers);
        const defaultTicker = tickers.includes('BPFF11') ? 'BPFF11' : tickers[0] || '';
        if (defaultTicker) {
          setTicker(defaultTicker);

          loadTableData(1, defaultTicker);
          setSearchedTicker(defaultTicker);
        }
      } catch (err) {
        setError('Erro ao carregar tickers.');
      } finally {
        setTickersLoading(false);
      }
    }
    loadTickers();
  }, []);

  useEffect(() => {
    if (searchedTicker && page > 1) {
      loadTableData(page);
    }
  }, [page]);

  useEffect(() => {
    if (searchedTicker) {
      loadChartData(searchedTicker);
    }
  }, [timeRange, searchedTicker]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (ticker) {
      setPage(1);
      setSearchedTicker(ticker);
      loadTableData(1, ticker);
      setIsDropdownOpen(false);
    }
  };

  const handlePageChange = (newPage) => setPage(newPage);
  const filteredTickers = tickerList.filter((t) => t.toLowerCase().includes(ticker.toLowerCase()));
  const handleBlur = (e) => {
    if (comboboxRef.current && !comboboxRef.current.contains(e.relatedTarget)) {
      setIsDropdownOpen(false);
    }
  };

  const getRangeLabel = (val) => {
    if (val >= 60) return '5 Anos';
    if (val >= 24) return `${val / 12} Anos`;
    if (val === 12) return '1 Ano';
    return `${val} Meses`;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Histórico de Dividendos de FIIs</h2>

      {}
      <div className="border border-gray-500 bg-white rounded-lg shadow-md p-6 max-w-2xl mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ticker do FII</label>
            <div className="relative" ref={comboboxRef} onBlur={handleBlur}>
              <input
                ref={inputRef}
                type="text"
                value={ticker}
                onChange={(e) => {
                  setTicker(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Digite ou selecione um ticker"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white pr-10"
              />
              {}
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  inputRef.current.focus();
                }}
                className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-full text-gray-500"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredTickers.map((t) => (
                    <div
                      key={t}
                      className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setTicker(t);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Buscando...' : 'Buscar Dividendos'}
          </button>
        </form>
      </div>

      <div className="mt-8 max-w-6xl space-y-6">
        {error && <p className="mt-6 text-red-500">{error}</p>}

        {!error && searchedTicker && (
          <div className="border border-gray-300 bg-white rounded-lg shadow-lg p-6">
            {}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  Evolução ({getRangeLabel(timeRange)})
                </h3>

                {}
                <div className="w-full md:w-1/3 mt-4 md:mt-0">
                  <label
                    htmlFor="timeRange"
                    className="block text-sm font-medium text-gray-600 mb-1"
                  >
                    Janela de Tempo:{' '}
                    <span className="text-blue-600 font-bold">{getRangeLabel(timeRange)}</span>
                  </label>
                  <input
                    id="timeRange"
                    type="range"
                    min="6"
                    max="60"
                    step="6"
                    value={timeRange}
                    onChange={(e) => setTimeRange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>6m</span>
                    <span>1a</span>
                    <span>3a</span>
                    <span>5a</span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded p-4 bg-gray-50">
                {}
                {chartData.length > 0 ? (
                  <HistoryChart data={chartData} />
                ) : (
                  <p className="text-center text-gray-500 py-10">Carregando gráfico...</p>
                )}
              </div>
            </div>

            {}
            {tableData.length > 0 ? (
              <>
                <p className="text-gray-700 text-sm mb-4">
                  Exibindo página {page} de {totalPages} ({total} registros totais)
                </p>

                <div
                  className={`overflow-x-auto transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}
                >
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-2 py-1 text-left">Data</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Abertura</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Fechamento</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Yield</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Dividendo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row) => (
                        <tr key={`${row.ticker}-${row.trade_date}`} className="hover:bg-gray-50">
                          <td className="border px-2 py-1">{row.trade_date}</td>
                          <td className="border px-2 py-1">R$ {parseFloat(row.open).toFixed(2)}</td>
                          <td className="border px-2 py-1">
                            R$ {parseFloat(row.price_close).toFixed(2)}
                          </td>
                          <td className="border px-2 py-1 text-blue-600">
                            {(parseFloat(row.dividend_yield_month) * 100).toFixed(2)}%
                          </td>
                          <td className="border px-2 py-1 text-green-700 font-medium">
                            R$ {parseFloat(row.dividend_value).toFixed(4)}
                          </td>
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
              <p className="text-gray-600">Nenhum dado encontrado na tabela.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FiiHistoricalChecker;
