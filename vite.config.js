import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// ⛔️ Remove this line: import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        react(),
        // ⛔️ And remove this line: tailwindcss(),
    ],
})