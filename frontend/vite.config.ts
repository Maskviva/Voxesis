import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    server: {
        proxy: {
            '/plugins': {
                target: process.env.VITE_WAILS_ASSET_SERVER_URL,
                changeOrigin: true,
                secure: false,
            }
        }
    }
})
