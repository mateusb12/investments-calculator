import { useState } from 'react';
import Sidebar, { defaultCalculator } from './components/Sidebar';

// A simple hamburger icon component
function HamburgerIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
    );
}

function App() {
    const [ActiveCalculator, setActiveCalculator] = useState(() => defaultCalculator.component);

    // --- NEW ---
    // State to manage the mobile menu's visibility
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // --- NEW ---
    // This wrapper function will be passed to the sidebar.
    // It selects a calculator AND closes the mobile menu.
    const handleSelectCalculator = (component) => {
        setActiveCalculator(() => component);
        setIsMobileMenuOpen(false); // Close menu on selection
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* --- UPDATED ---
                Pass the mobile state and the new handler to the Sidebar.
                The Sidebar will now control its own visibility.
            */}
            <Sidebar
                onSelectCalculator={handleSelectCalculator}
                isMobileOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-auto">

                {/* --- NEW: Mobile Header --- */}
                {/* This header is hidden on medium screens and up (md:hidden) */}
                <div className="md:hidden flex items-center justify-between p-4 bg-gray-800 text-white sticky top-0 z-10">
                    <h1 className="text-lg font-semibold">Calculadora</h1>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 rounded-md text-white hover:bg-gray-700"
                    >
                        <HamburgerIcon />
                    </button>
                </div>

                {/* Calculator Content */}
                <div className="flex-1 overflow-auto">
                    <ActiveCalculator />
                </div>
            </div>
        </div>
    );
}

export default App;