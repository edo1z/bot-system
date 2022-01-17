const ss = require('simple-statistics')

class VolumeList {
  constructor({
    broker
  }) {
    this.broker = broker
    this.interval = 1000

    this.tmpBuyVolume = 0
    this.tmpSellVolume = 0
    this.totalList = []
    this.volume = 0
    this.avgVolume = 0
    this.maxVolume = 0

    this.init()
  }

  init() {
    if(this.broker.isBacktestMode) return
    setInterval(() => {
      this.update()
    }, this.interval)
  }

  add(size) {
    if (size > 0) {
      this.tmpBuyVolume += size
    } else {
      this.tmpSellVolume += size * -1
    }
  }

  // 1秒間の約定サイズを1分間格納（最大60個）
  update() {
    const totalVolume = this.tmpBuyVolume + this.tmpSellVolume
    this.tmpBuyVolume = 0
    this.tmpSellVolume = 0
    this.totalList.push(totalVolume)
    if(this.totalList.length > 60) {
      this.totalList.shift()
    }
    const total = this.totalList.reduce((a,b) => a + b)
    this.avgVolume = Math.round(total / this.totalList.length * 100000000) / 100000000
    this.maxVolume = Math.max(...this.totalList)
    const sd = ss.standardDeviation(this.totalList)
    this.volume = Math.round((sd + this.avgVolume) * 100000000) / 100000000
  }

}

module.exports = VolumeList
