const webpack = require('webpack')
 
module.exports = {
  webpack: (config, { dev, vendor }) => {
    // Perform customizations to webpack config
    config.module.rules.push({
      resolve: {
        alias: {
            'jsframe': 'jsframe.js/lib/jsframe.min.js',
        }
      }
    })
    // config.resolve.push({alias: {'jsframe': 'jsframe.js/dist/jsframe.min.js'}})
    // Important: return the modified config
    return config
  }
}