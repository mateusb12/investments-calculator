import { useState } from 'react';

function RentabilityComparisonCalculator() {
  const [amount, setAmount] = useState(10000);

  const [cdiRate, setCdiRate] = useState(14.9);

  const [lciRate, setLciRate] = useState(95);

  const [cdbRate, setCdbRate] = useState(110);
  const [results, setResults] = useState([]);

  const getCdbTaxRate = (days) => {
    if (days <= 180) return 0.225;
    if (days <= 360) return 0.2;
    if (days <= 720) return 0.175;
    return 0.15;
  };

  const getFutureDate = (daysToAdd) => {
    const today = new Date();
    const futureDate = new Date(today.getTime());
    futureDate.setDate(today.getDate() + daysToAdd);

    const day = futureDate.getDate().toString().padStart(2, '0');

    const month = futureDate.toLocaleDateString('pt-BR', { month: 'short' });
    const year = futureDate.getFullYear();

    const cleanMonth = month.replace('.', '');

    return `${day}/${cleanMonth}/${year}`;
  };

  const calculateComparison = () => {
    const annualLciRate = (lciRate / 100) * cdiRate;

    const annualCdbRate = (cdbRate / 100) * cdiRate;

    const newResults = [];

    const basePeriods = [
      { label: '6 meses', days: 180 },
      { label: '1 ano', days: 360 },
      { label: '2 anos', days: 720 },
      { label: '3 anos', days: 1080 },
    ];

    const periods = basePeriods.map((p) => {
      const futureDateStr = getFutureDate(p.days);
      return {
        ...p,

        formattedLabel: `${p.label} (${futureDateStr})`,
      };
    });

    for (const period of periods) {
      const years = period.days / 365.0;

      const lciReturn = amount * (1 + (annualLciRate / 100) * years);
      const lciProfit = lciReturn - amount;

      const cdbGrossReturn = amount * (1 + (annualCdbRate / 100) * years);
      const cdbGrossProfit = cdbGrossReturn - amount;

      const taxRate = getCdbTaxRate(period.days);
      const taxPaid = cdbGrossProfit * taxRate;
      const cdbNetProfit = cdbGrossProfit - taxPaid;
      const cdbNetReturn = amount + cdbNetProfit;

      const difference = cdbNetReturn - lciReturn;
      const betterOption = cdbNetReturn > lciReturn ? 'CDB' : 'LCI/LCAs';

      newResults.push({
        periodLabel: period.formattedLabel,
        taxRate: (taxRate * 100).toFixed(1) + '%',
        lci: {
          total: lciReturn.toFixed(2),
          profit: lciProfit.toFixed(2),
        },
        cdb: {
          total: cdbNetReturn.toFixed(2),
          profit: cdbNetProfit.toFixed(2),
          grossProfit: cdbGrossProfit.toFixed(2),
          taxPaid: taxPaid.toFixed(2),
        },
        difference: Math.abs(difference).toFixed(2),
        betterOption,
      });
    }
    setResults(newResults);
  };

  return (
    <div className="p-8 ">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Calculadora de Comparação de Rentabilidade
      </h2>
      <p className="text-gray-600 mb-6">
        Compare LCI/LCAs (isento) vs. CDB (com IR regressivo) em diferentes prazos.
      </p>

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
              Taxa CDI Anual (%)
            </label>
            <input
              type="number"
              value={cdiRate}
              onChange={(e) => setCdiRate(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              min="0"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LCI/LCAs (% do CDI)
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
            <label className="block text-sm font-medium text-gray-700 mb-2">CDB (% do CDI)</label>
            <input
              type="number"
              value={cdbRate}
              onChange={(e) => setCdbRate(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              min="0"
              step="0.1"
            />
          </div>

          <button
            onClick={calculateComparison}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Comparar Cenários
          </button>
        </div>
      </div>

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

                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <h5 className="text-lg font-semibold text-purple-800 mb-3">CDB (Com IR)</h5>
                  <div className="space-y-1">
                    <p className="text-gray-700">
                      <span className="font-medium">Valor Total Líquido:</span> R$ {res.cdb.total}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Lucro Líquido:</span> R$ {res.cdb.profit}
                    </p>
                    <hr className="my-2" />
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Lucro Bruto:</span> R$ {res.cdb.grossProfit}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Imposto Pago:</span> R$ {res.cdb.taxPaid}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-300 text-center">
                <p className="text-lg font-bold text-blue-900">Melhor Opção: {res.betterOption}</p>
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
