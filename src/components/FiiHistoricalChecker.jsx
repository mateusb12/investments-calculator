// src/components/FiiSimulator.jsx
import React, { useState, useEffect, useRef } from 'react';
// 1. Importa a nova função de serviço
import {
    fetchFiiDividendForMonth,
    fetchUniqueTickers,
    fetchFiiDateRange
} from "../services/b3service";
import { createClient } from '@supabase/supabase-js'; // Importa o Supabase client

// Helper para formatar moeda (com casas decimais flexíveis)
const formatCurrency = (num, decimals = 2) =>
    new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);

const formatDate = (date) => {
    return new Intl.DateTimeFormat('pt-BR', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
    }).format(date);
}

function addMonths(date, months) {
    const d = new Date(date);
    d.setUTCMonth(d.getUTCMonth() + months);
    // Trata o "dia" para não pular meses (ex: 31 de jan + 1 mês = 28 de fev)
    const day = d.getUTCDate();
    const daysInMonth = new Date(d.getUTCFullYear(), d.getUTCMonth() + 1, 0).getUTCDate();
    if (day > daysInMonth) {
        d.setUTCDate(daysInMonth);
    }
    return d;
}

// --- Pega o Supabase client do b3service (assumindo que ele é exportado) ---
// Se você não exporta o 'supabase' de 'b3service',
// você terá que recriá-lo aqui ou importá-lo de onde ele é criado.
// Vamos assumir que você o recria aqui para o fallback:
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function FiiSimulator() {
    // --- States para o Formulário ---
    const [ticker, setTicker] = useState('');
    const [initialInvestment, setInitialInvestment] = useState('10000');
    const [monthlyDeposit, setMonthlyDeposit] = useState('500');

    // 2. MUDANÇA: Voltamos para 'simulationMonths'
    const [simulationMonths, setSimulationMonths] = useState('24');
    const [simulationPeriodText, setSimulationPeriodText] = useState(''); // Para o resumo

    // ... (States do ComboBox de Ticker não mudam) ...
    const [tickerList, setTickerList] = useState([]);
    const [tickersLoading, setTickersLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const inputRef = useRef(null);
    const comboboxRef = useRef(null);

    // ... (States de Resultado não mudam) ...
    const [simulationData, setSimulationData] = useState([]);
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); // Agora pode ser usado para avisos

    // --- Carregar Tickers (sem mudanças) ---
    useEffect(() => {
        async function loadTickers() {
            setTickersLoading(true);
            setError(null);
            try {
                const tickers = await fetchUniqueTickers();
                setTickerList(tickers);
                const defaultTicker = tickers.includes('BPFF11') ? 'BPFF11' : (tickers[0] || '');
                if (defaultTicker) {
                    setTicker(defaultTicker);
                }
            } catch (err) {
                console.error("Falha ao carregar tickers", err);
                setError('Erro ao carregar a lista de tickers.');
            }
            finally { setTickersLoading(false); }
        }
        loadTickers();
    }, []);

    // --- 3. LÓGICA DA SIMULAÇÃO (REFEITA COM NOVAS COLUNAS) ---
    const handleRunSimulation = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSimulationData([]);
        setSummaryData(null);
        setSimulationPeriodText('');

        try {
            const initialInv = parseFloat(initialInvestment) || 0;
            const monthlyDep = parseFloat(monthlyDeposit) || 0;
            const requestedMonths = parseInt(simulationMonths) || 1;

            // --- (1. & 2. Busca e Cálculo de Datas - Sem mudanças) ---
            const dateRange = await fetchFiiDateRange(ticker);
            if (!dateRange || !dateRange.newest_date || !dateRange.oldest_date) {
                throw new Error(`Não foi possível encontrar o histórico de datas para ${ticker}.`);
            }
            const [endYear, endMonth, endDay] = dateRange.newest_date.split('-').map(Number);
            const simEndDate = new Date(Date.UTC(endYear, endMonth - 1, endDay));
            let simStartDate = addMonths(simEndDate, -(requestedMonths - 1));
            simStartDate.setUTCDate(1);

            // --- (3. Validação de Período - Sem mudanças) ---
            const [oldYear, oldMonth, oldDay] = dateRange.oldest_date.split('-').map(Number);
            const oldestDateObj = new Date(Date.UTC(oldYear, oldMonth - 1, oldDay));
            oldestDateObj.setUTCDate(1);

            let actualMonths = requestedMonths;
            if (simStartDate < oldestDateObj) {
                const oldStartDate = simStartDate;
                simStartDate = oldestDateObj;
                actualMonths = (simEndDate.getUTCFullYear() - simStartDate.getUTCFullYear()) * 12 +
                    (simEndDate.getUTCMonth() - simStartDate.getUTCMonth()) + 1;
                setError(`Aviso: O período solicitado (${requestedMonths} meses, desde ${formatDate(oldStartDate)}) 
                          é maior que o histórico disponível. 
                          Simulando com o máximo de ${actualMonths} meses (desde ${formatDate(simStartDate)}).`);
            }
            setSimulationPeriodText(`(${actualMonths} meses: ${formatDate(simStartDate)} a ${formatDate(simEndDate)})`);

            // ----- 4. Início do Investimento (Mês 0) -----
            let sharesReinvest = 0;
            let sharesNoReinvest = 0;
            let totalDividendsWithdrawn = 0;
            let totalInvested = 0;
            let simulationTable = [];

            // --- NOVAS VARIÁVEIS DE RASTREAMENTO ---
            let lastPrice = 0;
            let prevDividend = 0;
            let prevMontanteReinvest = 0;
            let prevMontanteNoReinvest = 0;
            // ----------------------------------------

            const firstMonthData = await fetchFiiDividendForMonth(ticker, simStartDate.getUTCMonth() + 1, simStartDate.getUTCFullYear());

            if (!firstMonthData) {
                const { data: firstEverData, error: firstEverError } = await supabase
                    .from('b3_fiis_dividends')
                    .select('price_close')
                    .eq('ticker', ticker.toUpperCase())
                    .gte('trade_date', dateRange.oldest_date)
                    .order('trade_date', { ascending: true })
                    .limit(1)
                    .single();
                if (firstEverError || !firstEverData) {
                    throw new Error(`Falha crítica: não foi possível obter nenhum preço inicial para ${ticker}. Erro: ${firstEverError?.message}`);
                }
                lastPrice = parseFloat(firstEverData.price_close);
            } else {
                lastPrice = parseFloat(firstMonthData.price_close);
            }

            totalInvested = initialInv;
            sharesReinvest = initialInv / lastPrice;
            sharesNoReinvest = initialInv / lastPrice;

            // --- PUSH DO MÊS 0 (ATUALIZADO) ---
            simulationTable.push({
                month: formatDate(simStartDate),
                deposit: initialInv,
                currentPrice: lastPrice,
                prevPrice: 0,
                currentDividend: 0,
                prevDividend: 0,
                // Reinvestindo
                reinvestStart: 0,
                reinvestDividends: 0,
                reinvestMontanteAtual: initialInv,
                reinvestGain: 0,
                // Sem Reinvestir
                noReinvestStart: 0,
                noReinvestDividends: 0,
                noReinvestMontanteAtual: initialInv,
                noReinvestGain: 0,
            });

            // --- Define os valores "anteriores" para o próximo loop ---
            prevMontanteReinvest = initialInv;
            prevMontanteNoReinvest = initialInv;
            prevDividend = 0; // lastPrice já está setado
            // ----------------------------------------------------

            // ----- 5. Loop Mensal (A partir do Mês 1) -----
            let currentDate = addMonths(simStartDate, 1);

            while (currentDate <= simEndDate) {
                const currentMonth = currentDate.getUTCMonth() + 1;
                const currentYear = currentDate.getUTCFullYear();

                const monthData = await fetchFiiDividendForMonth(ticker, currentMonth, currentYear);

                // --- Pega dados atuais e anteriores ---
                const currentPrice = monthData ? parseFloat(monthData.price_close) : lastPrice;
                const currentDividend = monthData ? parseFloat(monthData.dividend_value) : 0;

                totalInvested += monthlyDep;

                const startValueReinvest = sharesReinvest * currentPrice;
                const startValueNoReinvest = sharesNoReinvest * currentPrice;

                const dividendsReinvest = sharesReinvest * currentDividend;
                const dividendsNoReinvest = sharesNoReinvest * currentDividend;

                // --- CÁLCULO DO GANHO/PERDA (Ponto 6 da sua solicitação) ---
                // (Valorização das cotas) + (Dividendos recebidos)
                // (Início Mês Atual) - (Montante Mês Anterior) + (Dividendos)
                const reinvestGain = (startValueReinvest - prevMontanteReinvest) + dividendsReinvest;
                const noReinvestGain = (startValueNoReinvest - prevMontanteNoReinvest) + dividendsNoReinvest;
                // --------------------------------------------------------

                const totalToBuyReinvest = monthlyDep + dividendsReinvest;
                const newSharesReinvest = totalToBuyReinvest / currentPrice;
                sharesReinvest += newSharesReinvest;

                const newSharesNoReinvest = monthlyDep / currentPrice;
                sharesNoReinvest += newSharesNoReinvest;
                totalDividendsWithdrawn += dividendsNoReinvest;

                const endValueReinvest = sharesReinvest * currentPrice;
                const endValueNoReinvest = sharesNoReinvest * currentPrice;

                // --- PUSH DO MÊS (ATUALIZADO) ---
                simulationTable.push({
                    month: formatDate(currentDate),
                    deposit: monthlyDep,
                    currentPrice: currentPrice,
                    prevPrice: lastPrice, // Preço do mês anterior
                    currentDividend: currentDividend,
                    prevDividend: prevDividend, // Dividendo do mês anterior
                    // Reinvestindo
                    reinvestStart: startValueReinvest,
                    reinvestDividends: dividendsReinvest,
                    reinvestMontanteAtual: endValueReinvest, // Coluna renomeada
                    reinvestGain: reinvestGain, // Nova coluna
                    // Sem Reinvestir
                    noReinvestStart: startValueNoReinvest,
                    noReinvestDividends: dividendsNoReinvest,
                    noReinvestMontanteAtual: endValueNoReinvest, // Coluna renomeada
                    noReinvestGain: noReinvestGain, // Nova coluna
                });

                // --- Atualiza os valores "anteriores" para o próximo loop ---
                if (monthData) {
                    lastPrice = currentPrice;
                }
                prevDividend = currentDividend;
                prevMontanteReinvest = endValueReinvest;
                prevMontanteNoReinvest = endValueNoReinvest;
                // ------------------------------------------------------

                currentDate = addMonths(currentDate, 1);
            }

            // ----- 6. Salvar Resultados (COM A CORREÇÃO) -----
            setSimulationData(simulationTable);

            const reinvestFinalValue = sharesReinvest * lastPrice;
            const noReinvestFinalValue = sharesNoReinvest * lastPrice;

            setSummaryData({
                totalInvested: totalInvested,
                reinvestFinalValue: reinvestFinalValue,
                // --- CORREÇÃO APLICADA AQUI ---
                reinvestTotalGain: reinvestFinalValue - totalInvested,
                // -----------------------------
                noReinvestFinalValue: noReinvestFinalValue,
                totalDividendsWithdrawn: totalDividendsWithdrawn,
                noReinvestTotalGain: (noReinvestFinalValue + totalDividendsWithdrawn) - totalInvested,
            });

        } catch (err) {
            console.error(err);
            setError(err.message || 'Erro ao rodar a simulação.');
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers do ComboBox (sem mudanças) ---
    const handleBlur = (e) => {
        if (comboboxRef.current && !comboboxRef.current.contains(e.relatedTarget)) {
            setIsDropdownOpen(false);
        }
    };
    const filteredTickers = tickerList.filter(t =>
        t.toLowerCase().includes(ticker.toLowerCase())
    );

    // --- JSX ---
    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">
                Simulador de Investimento em FIIs
            </h2>

            {/* --- FORMULÁRIO DE INPUT --- */}
            <div className="border border-gray-500 bg-white rounded-lg shadow-md p-6 max-w-2xl mb-8">
                <form onSubmit={handleRunSimulation} className="space-y-4">

                    {/* --- Seletor de Ticker (sem mudanças) --- */}
                    <div>
                        <label htmlFor="ticker-input" className="block text-sm font-medium text-gray-700 mb-2">
                            Ticker do FII
                        </label>
                        <div className="relative" ref={comboboxRef} onBlur={handleBlur}>
                            {/* ... (Input, Botão e Dropdown do combobox - sem mudanças) ... */}
                            <input ref={inputRef} type="text" id="ticker-input" value={ticker} onChange={(e) => { setTicker(e.target.value); setIsDropdownOpen(true); }} onFocus={() => setIsDropdownOpen(true)} disabled={tickersLoading || loading} placeholder="Digite ou selecione um ticker" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white pr-10" autoComplete="off" />
                            <button type="button" disabled={tickersLoading || loading} onClick={() => { setIsDropdownOpen((state) => !state); inputRef.current.focus(); }} className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-full text-gray-500 hover:text-gray-700"><svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                            {isDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {tickersLoading ? ( <div className="px-4 py-2 text-gray-500">Carregando tickers...</div>
                                    ) : filteredTickers.length > 0 ? (
                                        filteredTickers.map((t) => ( <div key={t} className="px-4 py-2 hover:bg-blue-100 cursor-pointer" onMouseDown={(e) => { e.preventDefault(); setTicker(t); setIsDropdownOpen(false); inputRef.current.focus(); }}>{t}</div> ))
                                    ) : ( <div className="px-4 py-2 text-gray-500">Nenhum ticker encontrado.</div> )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- 4. MUDANÇA: Inputs Financeiros --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="initial-inv" className="block text-sm font-medium text-gray-700 mb-2">
                                Invest. Inicial (R$)
                            </label>
                            <input
                                type="number"
                                id="initial-inv"
                                value={initialInvestment}
                                onChange={(e) => setInitialInvestment(e.target.value)}
                                disabled={loading}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="10000"
                            />
                        </div>
                        <div>
                            <label htmlFor="monthly-dep" className="block text-sm font-medium text-gray-700 mb-2">
                                Aporte Mensal (R$)
                            </label>
                            <input
                                type="number"
                                id="monthly-dep"
                                value={monthlyDeposit}
                                onChange={(e) => setMonthlyDeposit(e.target.value)}
                                disabled={loading}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="500"
                            />
                        </div>
                        <div>
                            <label htmlFor="sim-months" className="block text-sm font-medium text-gray-700 mb-2">
                                Período (meses)
                            </label>
                            <input
                                type="number"
                                id="sim-months"
                                value={simulationMonths}
                                onChange={(e) => setSimulationMonths(e.target.value)}
                                disabled={loading}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="24"
                            />
                        </div>
                    </div>

                    {/* --- Botão de Simular --- */}
                    <button
                        type="submit"
                        disabled={loading || tickersLoading || !ticker}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                        {loading ? "Simulando..." : "Rodar Simulação"}
                    </button>
                </form>
            </div>

            {/* --- ÁREA DE RESULTADOS --- */}
            <div className="space-y-8">
                {loading && <p className="text-gray-500 text-lg">Carregando simulação...</p>}

                {/* O Bloco de Erro agora também mostra AVISOS */}
                {error && (
                    <p className={`mt-6 p-4 rounded-lg ${error.startsWith('Aviso:') ? 'text-orange-700 bg-orange-100' : 'text-red-700 bg-red-100'}`}>
                        {error}
                    </p>
                )}

                {/* --- RESUMO DA SIMULAÇÃO --- */}
                {summaryData && !loading && (
                    <div className="border border-gray-300 bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-2xl font-bold mb-4 text-gray-800">
                            Resumo da Simulação {ticker}
                            <span className="text-lg font-normal text-gray-600 ml-2">
                                {simulationPeriodText}
                            </span>
                        </h3>
                        {/* ... (O JSX do Resumo - Cards de Geral, Com e Sem Reinvestimento - não muda) ... */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gray-100 p-4 rounded-lg">
                                <h4 className="text-sm font-semibold text-gray-600 uppercase mb-2">Geral</h4>
                                <p className="text-gray-700">Total Investido:</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summaryData.totalInvested)}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <h4 className="text-sm font-semibold text-green-700 uppercase mb-2">Com Reinvestimento</h4>
                                <p className="text-gray-700">Valor Final do Portfólio:</p>
                                <p className="text-2xl font-bold text-green-800">{formatCurrency(summaryData.reinvestFinalValue)}</p>
                                <p className="text-gray-700 mt-2">Ganho Total:</p>
                                <p className={`text-lg font-semibold ${summaryData.reinvestTotalGain >= 0 ? 'text-green-800' : 'text-red-600'}`}>
                                    {formatCurrency(summaryData.reinvestTotalGain)}
                                </p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                <h4 className="text-sm font-semibold text-purple-700 uppercase mb-2">Sem Reinvestimento</h4>
                                <p className="text-gray-700">Valor Final do Portfólio:</p>
                                <p className="text-2xl font-bold text-purple-800">{formatCurrency(summaryData.noReinvestFinalValue)}</p>
                                <p className="text-gray-700 mt-2">Dividendos Sacados:</p>
                                <p className="text-lg font-semibold text-purple-800">{formatCurrency(summaryData.totalDividendsWithdrawn)}</p>
                                <p className="text-gray-700 mt-2">Ganho Total (Portfólio + Sacado):</p>
                                <p className={`text-lg font-semibold ${summaryData.noReinvestTotalGain >= 0 ? 'text-purple-800' : 'text-red-600'}`}>
                                    {formatCurrency(summaryData.noReinvestTotalGain)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}


                {/* --- TABELA MÊS A MÊS --- */}
                {simulationData.length > 0 && !loading && (
                    <div className="border border-gray-300 bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-2xl font-bold mb-4 text-gray-800">
                            Detalhes da Simulação (Mês a Mês)
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300 text-sm whitespace-nowrap">
                                <thead className="bg-gray-100">
                                {/* --- CABEÇALHO NÍVEL 1 --- */}
                                <tr>
                                    <th rowSpan="2" className="border px-3 py-2 text-left">Mês</th>
                                    <th rowSpan="2" className="border px-3 py-2 text-left">Aporte</th>
                                    <th colSpan="4" className="border px-3 py-2 text-center bg-blue-50">Dados do Ativo</th>
                                    <th colSpan="4" className="border px-3 py-2 text-center bg-green-50">Cenário: Reinvestindo</th>
                                    <th colSpan="4" className="border px-3 py-2 text-center bg-purple-50">Cenário: Sem Reinvestir</th>
                                </tr>
                                {/* --- CABEÇALHO NÍVEL 2 --- */}
                                <tr>
                                    {/* Dados do Ativo */}
                                    <th className="border px-3 py-2 text-left bg-blue-50">Preço Atual</th>
                                    <th className="border px-3 py-2 text-left bg-blue-50">Preço Ant.</th>
                                    <th className="border px-3 py-2 text-left bg-blue-50">Div. Atual</th>
                                    <th className="border px-3 py-2 text-left bg-blue-50">Div. Ant.</th>
                                    {/* Reinvestindo */}
                                    <th className="border px-3 py-2 text-left bg-green-50">Início</th>
                                    <th className="border px-3 py-2 text-left bg-green-50">Rend. (Div.)</th>
                                    <th className="border px-3 py-2 text-left bg-green-50">Montante Atual</th>
                                    <th className="border px-3 py-2 text-left bg-green-50">Ganho/Perda (Mês)</th>
                                    {/* Sem Reinvestir */}
                                    <th className="border px-3 py-2 text-left bg-purple-50">Início</th>
                                    <th className="border px-3 py-2 text-left bg-purple-50">Rend. (Sacado)</th>
                                    <th className="border px-3 py-2 text-left bg-purple-50">Montante Atual</th>
                                    <th className="border px-3 py-2 text-left bg-purple-50">Ganho/Perda (Mês)</th>
                                </tr>
                                </thead>
                                <tbody>
                                {simulationData.map((row) => (
                                    <tr key={row.month} className="hover:bg-gray-50">
                                        {/* Mês e Aporte */}
                                        <td className="border px-3 py-2">{row.month}</td>
                                        <td className="border px-3 py-2">{formatCurrency(row.deposit)}</td>

                                        {/* Dados do Ativo */}
                                        <td className="border px-3 py-2 text-gray-700">{formatCurrency(row.currentPrice)}</td>
                                        <td className="border px-3 py-2 text-gray-500">{formatCurrency(row.prevPrice)}</td>
                                        <td className="border px-3 py-2 text-gray-700">{formatCurrency(row.currentDividend, 4)}</td>
                                        <td className="border px-3 py-2 text-gray-500">{formatCurrency(row.prevDividend, 4)}</td>

                                        {/* Reinvestindo */}
                                        <td className="border px-3 py-2 text-gray-600">{formatCurrency(row.reinvestStart)}</td>
                                        <td className="border px-3 py-2 text-green-700 font-medium">
                                            +{formatCurrency(row.reinvestDividends, 2)}
                                        </td>
                                        <td className="border px-3 py-2 font-bold text-gray-900">
                                            {formatCurrency(row.reinvestMontanteAtual)}
                                        </td>
                                        <td className={`border px-3 py-2 font-medium ${row.reinvestGain >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                            {formatCurrency(row.reinvestGain)}
                                        </td>

                                        {/* Sem Reinvestir */}
                                        <td className="border px-3 py-2 text-gray-600">{formatCurrency(row.noReinvestStart)}</td>
                                        <td className="border px-3 py-2 text-purple-700 font-medium">
                                            +{formatCurrency(row.noReinvestDividends, 2)}
                                        </td>
                                        <td className="border px-3 py-2 font-bold text-gray-900">
                                            {formatCurrency(row.noReinvestMontanteAtual)}
                                        </td>
                                        <td className={`border px-3 py-2 font-medium ${row.noReinvestGain >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                            {formatCurrency(row.noReinvestGain)}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FiiSimulator;