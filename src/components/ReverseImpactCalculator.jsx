import { useState, useCallback } from 'react';

/**
 * Retorna a alíquota de IR com base no número de dias.
 * @param {number} days
 */
const getCdbTaxRate = (days) => {
    if (days <= 180) return 0.225; // 22.5%
    if (days <= 360) return 0.20;  // 20%
    if (days <= 720) return 0.175; // 17.5%
    return 0.15; // 15%
};

/**
 * Formata um número para a moeda BRL.
 * @param {number} value
 */
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

function ReverseImpactCalculator() {
    // Inputs do usuário
    const [targetImpact, setTargetImpact] = useState(2000);
    const [initialCapital, setInitialCapital] = useState(8000);
    const [monthlyContribution, setMonthlyContribution] = useState(2500);
    const [cdiRate, setCdiRate] = useState(14.9);
    const [lciRatePercent, setLciRatePercent] = useState(95); // Ex: 95% do CDI
    const [cdbRatePercent, setCdbRatePercent] = useState(110); // Ex: 110% do CDI

    // Outputs da simulação
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const calculateTimeToImpact = useCallback(() => {
        setIsLoading(true);
        setResult(null);
        setError(null);

        // --- Inicia a simulação ---
        // Precisamos rodar a simulação em "worker" (setTimeout) para o UI atualizar
        setTimeout(() => {
            try {
                // 1. Calcular taxas mensais efetivas
                const annualLciRate = (lciRatePercent / 100) * (cdiRate / 100);
                const annualCdbRate = (cdbRatePercent / 100) * (cdiRate / 100);

                const monthlyLciRate = (1 + annualLciRate)**(1 / 12) - 1;
                const monthlyCdbRate = (1 + annualCdbRate)**(1 / 12) - 1;

                // 2. Variáveis da simulação
                let months = 0;
                let lciValue = initialCapital;
                let cdbGrossValue = initialCapital;
                let cdbPrincipal = initialCapital; // Total de dinheiro "colocado" no CDB

                let netDifference = 0;
                const maxMonths = 12 * 30; // Limite de 30 anos para evitar loop infinito

                // 3. Loop de simulação (mês a mês)
                while (netDifference < targetImpact && months < maxMonths) {
                    // Aporte é feito no início do mês
                    if (months > 0) {
                        lciValue += monthlyContribution;
                        cdbGrossValue += monthlyContribution;
                        cdbPrincipal += monthlyContribution;
                    }

                    // Rentabilidade do mês é aplicada sobre o valor atual
                    lciValue *= (1 + monthlyLciRate);
                    cdbGrossValue *= (1 + monthlyCdbRate);

                    months++;

                    // 4. Calcular o valor líquido de cada um no final deste mês
                    const lciNetValue = lciValue;

                    const cdbGrossProfit = cdbGrossValue - cdbPrincipal;
                    const daysElapsed = months * (365.25 / 12); // Dias médios
                    const taxRate = getCdbTaxRate(daysElapsed);
                    const taxPaid = cdbGrossProfit * taxRate;
                    const cdbNetValue = cdbGrossValue - taxPaid;

                    // 5. Verificar o "impacto" (diferença)
                    netDifference = Math.abs(lciNetValue - cdbNetValue);
                }

                // 6. Fim do loop, verificar o resultado
                if (months >= maxMonths && netDifference < targetImpact) {
                    setError(`O impacto de ${formatCurrency(targetImpact)} não foi atingido em 30 anos. A diferença máxima atingida foi de ${formatCurrency(netDifference)}.`);
                } else {
                    // Sucesso!
                    const years = Math.floor(months / 12);
                    const remainingMonths = months % 12;

                    const finalLciValue = lciValue;
                    const finalCdbGrossProfit = cdbGrossValue - cdbPrincipal;
                    const finalTaxRate = getCdbTaxRate(months * (365.25 / 12));
                    const finalTaxPaid = finalCdbGrossProfit * finalTaxRate;
                    const finalCdbNetValue = cdbGrossValue - finalTaxPaid;

                    setResult({
                        months,
                        years,
                        remainingMonths,
                        finalLciValue,
                        finalCdbNetValue,
                        finalDifference: netDifference,
                    });
                }

            } catch (e) {
                console.error(e);
                setError("Ocorreu um erro no cálculo. Verifique se as taxas são válidas.");
            } finally {
                setIsLoading(false);
            }
        }, 50); // 50ms para permitir a renderização do 'loading'
    }, [targetImpact, initialCapital, monthlyContribution, cdiRate, lciRatePercent, cdbRatePercent]);

    return (
        <div className="p-8 ">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Calculadora de Impacto Reverso</h2>
            <p className="text-gray-600 mb-6">
                Descubra quanto tempo leva para que a diferença de rentabilidade entre dois investimentos
                atinja um valor específico (seu "impacto" desejado).
            </p>

            <div className="border border-gray-500 bg-white rounded-lg shadow-md p-6 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Coluna 1: Cenário */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Impacto Desejado (R$)
                        </label>
                        <input
                            type="number"
                            value={targetImpact}
                            onChange={(e) => setTargetImpact(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            min="0"
                            step="100"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Taxa CDI Anual (%)
                        </label>
                        <input
                            type="number"
                            value={cdiRate}
                            onChange={(e) => setCdiRate(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                            min="0"
                            step="0.1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Capital Atual (R$)
                        </label>
                        <input
                            type="number"
                            value={initialCapital}
                            onChange={(e) => setInitialCapital(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                            min="0"
                            step="1000"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Aportes Mensais (R$)
                        </label>
                        <input
                            type="number"
                            value={monthlyContribution}
                            onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                            min="0"
                            step="100"
                        />
                    </div>

                    {/* Coluna 2: Investimentos */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Opção 1: LCI/LCAs (% do CDI)
                        </label>
                        <input
                            type="number"
                            value={lciRatePercent}
                            onChange={(e) => setLciRatePercent(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            min="0"
                            step="1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Opção 2: CDB (% do CDI)
                        </label>
                        <input
                            type="number"
                            value={cdbRatePercent}
                            onChange={(e) => setCdbRatePercent(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            min="0"
                            step="1"
                        />
                    </div>
                </div>

                <button
                    onClick={calculateTimeToImpact}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 mt-6 disabled:bg-gray-400"
                >
                    {isLoading ? "Calculando..." : "Calcular Tempo para Impacto"}
                </button>
            </div>

            {/* --- Seção de Resultados --- */}
            {isLoading && (
                <div className="mt-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Simulando mês a mês, isso pode levar alguns segundos...</p>
                </div>
            )}

            {error && (
                <div className="mt-8 max-w-2xl p-6 bg-red-50 border border-red-300 rounded-lg shadow-md">
                    <h3 className="text-2xl font-bold text-red-800 mb-3">Erro na Simulação</h3>
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {result && !isLoading && (
                <div className="mt-8 max-w-2xl p-6 bg-green-50 border-2 border-green-300 rounded-lg shadow-lg">
                    <h3 className="text-2xl font-bold text-green-800 mb-4">Simulação Concluída!</h3>

                    <div className="text-center mb-6">
                        <p className="text-lg text-gray-700">Tempo para atingir o impacto de <span className="font-bold">{formatCurrency(targetImpact)}</span>:</p>
                        <p className="text-4xl font-bold text-blue-700 mt-2">
                            {result.years} {result.years === 1 ? 'ano' : 'anos'} e {result.remainingMonths} {result.remainingMonths === 1 ? 'mês' : 'meses'}
                        </p>
                        <p className="text-sm text-gray-600">({result.months} meses no total)</p>
                    </div>

                    <div className="border-t border-gray-300 pt-4">
                        <h4 className="text-xl font-semibold text-gray-800 mb-3">Valores Finais no Período:</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                                <span className="font-medium text-green-700">Valor Líquido LCI/LCA:</span>
                                <span className="font-bold text-lg text-green-700">{formatCurrency(result.finalLciValue)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                                <span className="font-medium text-purple-700">Valor Líquido CDB:</span>
                                <span className="font-bold text-lg text-purple-700">{formatCurrency(result.finalCdbNetValue)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-blue-100 rounded-lg border border-blue-300 mt-2">
                                <span className="font-medium text-blue-800">Diferença Líquida Final:</span>
                                <span className="font-bold text-lg text-blue-800">{formatCurrency(result.finalDifference)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ReverseImpactCalculator;