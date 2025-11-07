import { useState } from 'react';

function RentabilityComparisonCalculator() {
    const [amount, setAmount] = useState(10000);
    const [lciRate, setLciRate] = useState(4.5);
    const [cdbRate, setCdbRate] = useState(6.0);
    // O estado 'time' foi removido
    const [results, setResults] = useState([]); // Agora é um array

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

    const calculateComparison = () => {
        const newResults = [];

        // Define os períodos de simulação em dias
        const periods = [
            { label: "6 meses (180 dias)", days: 180 },
            { label: "1 ano (360 dias)", days: 360 },
            { label: "2 anos (720 dias)", days: 720 },
            { label: "3 anos (1080 dias)", days: 1080 } // Exemplo da última faixa
        ];

        for (const period of periods) {
            // Converte dias para uma fração do ano para o cálculo da taxa
            const years = period.days / 365.0;

            // 1. LCI/LCA (Isento de IR)
            // Usando a mesma lógica de juros simples do seu cálculo original
            const lciReturn = amount * (1 + (lciRate / 100) * years);
            const lciProfit = lciReturn - amount;

            // 2. CDB (Com IR)
            const cdbGrossReturn = amount * (1 + (cdbRate / 100) * years);
            const cdbGrossProfit = cdbGrossReturn - amount;

            // Calcula o imposto
            const taxRate = getCdbTaxRate(period.days);
            const taxPaid = cdbGrossProfit * taxRate;

            // Calcula o lucro líquido e o total líquido
            const cdbNetProfit = cdbGrossProfit - taxPaid;
            const cdbNetReturn = amount + cdbNetProfit;

            // 3. Comparação
            const difference = cdbNetReturn - lciReturn;
            const betterOption = cdbNetReturn > lciReturn ? 'CDB' : 'LCI/LCAs';

            newResults.push({
                periodLabel: period.label,
                taxRate: (taxRate * 100).toFixed(1) + '%',
                lci: {
                    total: lciReturn.toFixed(2),
                    profit: lciProfit.toFixed(2)
                },
                cdb: {
                    total: cdbNetReturn.toFixed(2),
                    profit: cdbNetProfit.toFixed(2),
                    grossProfit: cdbGrossProfit.toFixed(2),
                    taxPaid: taxPaid.toFixed(2)
                },
                difference: Math.abs(difference).toFixed(2),
                betterOption
            });
        }
        setResults(newResults);
    };

    return (
        <div className="p-8 ">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Calculadora de Comparação de Rentabilidade</h2>
            <p className="text-gray-600 mb-6">Compare LCI/LCAs (isento) vs. CDB (com IR regressivo) em diferentes prazos.</p>

            <div className="border border-gray-500  bg-white rounded-lg shadow-md p-6 max-w-2xl">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Valor do Investimento (R$)
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="0"
                            step="1000"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Taxa Anual LCI/LCAs (%)
                        </label>
                        <input
                            type="number"
                            value={lciRate}
                            onChange={(e) => setLciRate(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            min="0"
                            step="0.1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Taxa Anual CDB (%)
                        </label>
                        <input
                            type="number"
                            value={cdbRate}
                            onChange={(e) => setCdbRate(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            min="0"
                            step="0.1"
                        />
                    </div>

                    {/* Input de Prazo foi removido */}

                    <button
                        onClick={calculateComparison}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                    >
                        Comparar Cenários
                    </button>
                </div>
            </div>

            {/* Nova seção de resultados em loop */}
            {results.length > 0 && (
                <div className="mt-8 max-w-2xl space-y-6">
                    <h3 className="text-2xl font-bold text-gray-800">Resultados da Simulação</h3>

                    {results.map((res, index) => (
                        <div key={index} className="border border-gray-300 bg-white rounded-lg shadow-lg p-6">
                            <h4 className="text-xl font-semibold text-blue-800 mb-4">
                                Cenário: {res.periodLabel}
                            </h4>

                            <div className="mb-4">
                                <span className="font-medium text-gray-700">Alíquota de IR (CDB): </span>
                                <span className="font-bold text-red-600">{res.taxRate}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* LCI Card */}
                                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                                    <h5 className="text-lg font-semibold text-green-800 mb-3">LCI/LCAs (Isento)</h5>
                                    <div className="space-y-1">
                                        <p className="text-gray-700">
                                            <span className="font-medium">Valor Total:</span> R$ {res.lci.total}
                                        </p>
                                        <p className="text-gray-700">
                                            <span className="font-medium">Lucro Líquido:</span> R$ {res.lci.profit}
                                        </p>
                                    </div>
                                </div>

                                {/* CDB Card */}
                                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                                    <h5 className="text-lg font-semibold text-purple-800 mb-3">CDB (Com IR)</h5>
                                    <div className="space-y-1">
                                        <p className="text-gray-700">
                                            <span className="font-medium">Valor Total Líquido:</span> R$ {res.cdb.total}
                                        </p>
                                        <p className="text-gray-700">
                                            <span className="font-medium">Lucro Líquido:</span> R$ {res.cdb.profit}
                                        </p>
                                        <hr className="my-2"/>
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Lucro Bruto:</span> R$ {res.cdb.grossProfit}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Imposto Pago:</span> R$ {res.cdb.taxPaid}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Comparison Block */}
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-300 text-center">
                                <p className="text-lg font-bold text-blue-900">
                                    Melhor Opção: {res.betterOption}
                                </p>
                                <p className="text-gray-700 mt-1">
                                    <span className="font-medium">Diferença Líquida:</span> R$ {res.difference}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default RentabilityComparisonCalculator;