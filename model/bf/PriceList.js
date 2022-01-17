const PriceList = require('../PriceList')
const ss = require('simple-statistics')

class BfPriceList extends PriceList{
  constructor({broker}) {
    super({broker})
    this.diffList = []
    this.maxLengthOfVolaList = 300
    this.vola = 0
    this.maxVola = 0
    this.avgVola = 0
  }

  // 1秒間の中央値の値動きを1分間リストに格納(最大60個）
  updateVola() {
    if (this.priceList.length < 2) return
    const lastIdx = this.priceList.length - 1
    const newPrice = this.priceList[lastIdx]
    const oldPrice = this.priceList[lastIdx - 1]
    const diff = Math.abs(newPrice - oldPrice)
    this.diffList.push(diff)
    if(this.diffList.length > 60) {
      this.diffList.shift()
    }
    const total = this.diffList.reduce((a,b) => a + b)
    this.avgVola = Math.round(total / this.diffList.length)
    this.maxVola = Math.max(...this.diffList)
    const sd = ss.standardDeviation(this.diffList)
    this.vola = Math.round(sd + this.avgVola)
  }

  // BaseBrokerからConfig.intervalForUpdatePriceInfoミリ秒毎に呼び出される
  // 引数には現在のmidPriceが与えられる
  update(price) {
    if(price <= 0) return
    this.priceList.push(price)
    if (this.priceList.length > this.maxLength) {
      this.priceList.shift()
    }
    this.updateVola()
  }

}

module.exports = BfPriceList
