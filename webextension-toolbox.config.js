const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin');
 
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
    config.plugins.unshift(new CopyWebpackPlugin({
      patterns: [
      { from: 'ejdc-hand/ejdc-hand.json'}
      ]
     }))
    // config.plugins.push(new CopyPlugin([
    //   {
    //       from: `ejdc-hand/ejdic-hand.json`,
    //       to: config.output.path + '/ejdc-hand/ejdc-hand.json',
    //       cache: true,
    //   }
    // ]))
    return config
  }
}