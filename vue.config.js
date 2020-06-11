const path = require('path')
const resolve = dir => {
  return path.join(__dirname, dir)
}

module.exports = {
  publicPath: './',
  outputDir: 'web',
  chainWebpack: config => {
    config.resolve.alias
      .set('@', resolve('src')) // key,value自行定义，比如.set('@@', resolve('src/components'))
      .set('_c', resolve('src/components'))
      .set('_conf', resolve('config'))
  },

  // 打包时不生成.map文件
  productionSourceMap: true,
  // 这里写你调用接口的基础路径，来解决跨域，如果设置了代理，那你本地开发环境的axios的baseUrl要写为 '' ，即空字符串
  // devServer: {
    // port: 80,
    // proxy: {
    //   '/mmbiz_*/*': {
    //     // target: 'http://localhost:3000/',
    //     target: 'http://mmbiz.qpic.cn/',
    //     changeOrigin: true,
    //     ws: true
    //   },
    //   '/apin/*': {
    //     target: 'http://swoft-test.knowyourself.cc:11620/',
    //     // target: 'http://localhost:3000/',
    //     pathRewrite:{
    //       '^/apin':'/'
    //     },
    //     changeOrigin: true,
    //     ws: true
    //   },
    //   '/api/activity/*': {
    //     target: 'http://api-test.knowyourself.cc/wechat_activity/activity',
    //     // target: 'http://localhost:3000/activity',
    //     pathRewrite: {
    //       '^/api/activity/': '/'
    //     },
    //     changeOrigin: true,
    //     ws: true
    //   },
    // },
    // disableHostCheck: true
  // },
}
