import { useState } from 'react'
// 1. Import the Sidebar component AND the defaultCalculator config
import Sidebar, { defaultCalculator } from './components/Sidebar'

// 2. No other component imports are needed!

function App() {
    // 3. The state is now the component *type* itself, not a string
    const [ActiveCalculator, setActiveCalculator] = useState(() => defaultCalculator.component)

    // 4. The switch statement is no longer needed!
    // const renderCalculator = () => { ... } // DELETED

    return (
        <div className="flex h-screen bg-gray-100">
            {/* 5. Pass the setter function to the Sidebar */}
            <Sidebar onSelectCalculator={setActiveCalculator} />
            <div className="flex-1 overflow-auto">
                {/* 6. Render the component stored in state. It MUST be PascalCase. */}
                <ActiveCalculator />
            </div>
        </div>
    )
}

export default App