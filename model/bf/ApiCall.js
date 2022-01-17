const Log = require('../../log/Log')

class BfApiCall {
  constructor({broker}) {
    this.public1 = 0
    this.private1 = 0
    this.private2 = 0
    this.totalLimit = 100 // 1min
    this.private2Limit = 60 // 1min
    this.list = []
    this.maxListLength = 300
    this.maxTotalCall = 0
    this.avgTotalCall = 0
    this.broker = broker
    this.init()
  }

  init() {
    if(this.broker.isBacktestMode) return
    setInterval(() => {
      this._update()
    }, 60000)
  }

  _update() {
    const total = this.total()
    if (this.private2 > this.private2Limit) {
      Log.error(`API P2 OVER: ${this.private2} total: ${total}`)
    } else if (total > this.totalLimit) {
      Log.error(`API TOTAL OVER: ${total}`)
    }
    this.list.push(total)
    if (this.list.length > this.maxListLength) {
      this.list.shift()
    }
    this.maxTotalCall = Math.max(...this.list)
    const sum = this.list.reduce((a,b) => a + b)
    this.avgTotalCall = Math.round(sum / this.list.length * 10) / 10
    if (this.broker && this.broker.isCliMode) {
      Log.log(`[api] ${total}(p2: ${this.private2} p1: ${this.private1} pub: ${this.public1})`)
    }
    this.reset()
  }

  reset() {
    this.public1 = 0
    this.private1 = 0
    this.private2 = 0
  }

  add(type) {
    switch(type) {
      case 'public':
        this.public1++
        break
      case 'private1':
        this.private1++
        break
      case 'private2':
        this.private2++
        break
    }
  }

  total() {
    return this.public1 + this.private1 + this.private2
  }
}

module.exports = BfApiCall
