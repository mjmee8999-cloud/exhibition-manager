import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 우리 Next 앱의 public/booth/ 아래에서 열리도록 상대 경로 기준으로 빌드
export default defineConfig({
  base: '/booth/',
  plugins: [react()],
})
