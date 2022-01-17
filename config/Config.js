class Config {
  static intervalForUpdatePriceInfo = 1000
  static maxPriceListLength = 400 // default 400
  static lengthForCalcPriceRange = 300 // default 300
  static maxLossPrice = -3000 // 最大許容損失額
}

module.exports = Config
