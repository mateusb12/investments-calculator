import { useState } from 'react';
import Sidebar, { defaultCalculator } from './components/Sidebar';


function HamburgerIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
    );
}

function App() {
    const [ActiveCalculator, setActiveCalculator] = useState(() => defaultCalculator.component);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleSelectCalculator = (component) => {
        setActiveCalculator(() => component);
        setIsMobileMenuOpen(false); 
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar
                onSelectCalculator={handleSelectCalculator}
                isMobileOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <div className="flex-1 flex flex-col overflow-auto">

                <div className="md:hidden flex items-center justify-between p-4 bg-gray-800 text-white sticky top-0 z-10">
                    <h1 className="text-lg font-semibold">Calculadora</h1>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 rounded-md text-white hover:bg-gray-700"
                    >
                        <HamburgerIcon />
                    </button>
                </div>

                <div className="flex-1 overflow-auto">
                    <ActiveCalculator />
                </div>
            </div>
        </div>
    );
}

export default App;