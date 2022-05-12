// const { resolve } = require('path')

export default {
  root: 'src',
  build: {
    outDir: '../dist',
    sourcemap: true,
//    rollupOptions: {
//      input: {
//        main: resolve(__dirname, 'src', 'index.html'),
//        plan: resolve(__dirname, 'src', 'plan.html')
//      }
//    }
  }
}
