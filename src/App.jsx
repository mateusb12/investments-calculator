import { useState } from 'react'
import Sidebar from './components/Sidebar'
import CompoundInterestCalculator from './components/CompoundInterestCalculator'
import RentabilityComparisonCalculator from './components/RentabilityComparisonCalculator'
import ReverseImpactCalculator from "./components/ReverseImpactCalculator.jsx";

function App() {
  const [activeCalculator, setActiveCalculator] = useState('compound-interest')

  const renderCalculator = () => {
    switch (activeCalculator) {
      case 'compound-interest':
        return <CompoundInterestCalculator />
      case 'rentability-comparison':
        return <RentabilityComparisonCalculator />
        case 'reverse-impact':
            return <ReverseImpactCalculator/>
      default:
        return <CompoundInterestCalculator />
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar onSelectCalculator={setActiveCalculator} />
      <div className="flex-1 overflow-auto">
        {renderCalculator()}
      </div>
    </div>
  )
}

export default App
