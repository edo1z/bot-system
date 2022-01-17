class PriceList {
  constructor({broker}) {
    this.broker = broker
    this.priceList = []
    this.maxLength = 300
  }

  // BaseBrokerからConfig.intervalForUpdatePriceInfoミリ秒毎に呼び出される
  // 引数には現在のmidPriceが与えられる
  update(price) {
    if(price <= 0) return
    this.priceList.push(price)
    if (this.priceList.length > this.maxLength) {
      this.priceList.shift()
    }
  }

}

module.exports = PriceList
