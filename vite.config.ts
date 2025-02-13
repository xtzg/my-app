import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/my-app/',
  plugins: [react()],
  build: {
    // 调整块大小警告限制
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // 手动分块策略
        manualChunks: {
          // 将第三方库分开打包
          vendor: [
            'react',
            'react-dom',
            'three',
            'ogl'
          ],
        },
        // 用于从入口点创建的块的打包输出格式
        entryFileNames: 'assets/[name].[hash].js',
        // 用于命名代码分割时创建的共享块的输出命名
        chunkFileNames: 'assets/[name].[hash].js',
        // 用于输出静态资源的命名，[ext]会被替换为文件扩展名
        assetFileNames: 'assets/[name].[hash].[ext]'
      },
    },
    // 禁用 sourcemap
    sourcemap: false,
    // 启用混淆和压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        comments: false, // 删除注释
      },
    },
    // 设置资源目录
    assetsDir: 'assets',
    // 小于此阈值的导入或引用资源将内联为 base64 编码
    assetsInlineLimit: 4096,
  },
})
