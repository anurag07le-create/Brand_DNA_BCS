import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api/webhook': {
                target: 'https://hook.eu2.make.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/webhook/, '/wnpf3qfxrfhg5xb6rvb3vkbqm7vxqhwg'),
                secure: false
            }
        }
    }
})
