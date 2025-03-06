// GitHub Actions 測試
// 在 GitHub Actions 中，我們需要使用 @babel/preset-env 和 @babel/preset-react 來編譯我們的測試程式碼。
// 這些設定會告訴 Babel 如何編譯我們的程式碼，並且讓我們的測試程式碼能夠在 Node.js 環境中正常運行。

module.exports = {
  presets: [
    '@babel/preset-env',
    ['@babel/preset-react', { runtime: 'automatic' }]
  ]
}; 