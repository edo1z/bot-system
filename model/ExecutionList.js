const Log = require('../log/Log')
const {nowx} = require('../utils/time')

class ExecutionList {
  constructor() {
    this.broker = null
    this.backtestMode = false
    // TestMode => 全ての約定履歴を保存する
    // ProMode => 最新〇件のみ保存
    this.executions = []
    this.maxListLengthForProMode = 100
    this.posiSize = 0 // BUYならplus、SELLならminus
    this.posiPrice = 0
    this.profit = 0
    this.maxDD = 0
    this.maxDown = 0
    this.maxUp = 0
    this.upDownRate = 0
    this.maxProfit = 0
    this.maxOneDD = 0
    this.maxOneProfit = 0
    this.latestProfit = 0
  }

  tradeCount() {
    return this.executions.length
  }

  winRate() {
    let win = 0
    this.executions.forEach(exec => {
      if(exec.profit > 0) win++
    })
    const length = this.tradeCount()
    return Math.round(win / length * 100) / 100
  }

  buyExecutionCount() {
    return this.executions.filter(exec => exec.side === 'BUY').length
  }

  sellExecutionCount() {
    return this.executions.filter(exec => exec.side === 'SELL').length
  }

  add({
    price,
    size,
    date = null, 
  }) {
    const nowSize = this.posiSize
    const nowPrice = this.posiPrice
    const absPosiSize = Math.abs(nowSize)
    const absSize = Math.abs(size)

    // 最新size
    const newSize = nowSize + size

    // 最新price
    let newPrice = 0
    let closeSize = 0
    if (newSize == 0) {
      closeSize = absSize
    } else {
      if ((nowSize > 0 && size > 0) || (nowSize < 0 && size < 0) || nowSize == 0) {
        const totalPrice = nowPrice * absPosiSize + price * absSize
        const totalSize = absPosiSize + absSize
        newPrice = parseInt(totalPrice / totalSize)
        // SIDEが同一方向のため決済(クローズ）はなし)
        this.posiSize = newSize
        this.posiPrice = newPrice
        return
      } else {
        if ((nowSize > 0 && newSize < 0) || (nowSize < 0 && newSize > 0)) {
          newPrice = price
          closeSize = absPosiSize
        } else {
          newPrice = nowPrice
          closeSize = absSize
        }
      }
    }

    // 利益
    let profit = 0
    let priceRange = 0
    let side = 'BUY'
    if (size > 0) {
      side = 'SELL'
      priceRange = nowPrice - price
      profit = priceRange * closeSize
    } else {
      priceRange = price - nowPrice
      profit = priceRange * closeSize
    }
    profit = Math.floor(profit)
    this.posiSize = newSize
    this.posiPrice = newPrice
    this.profit += profit
    if(!date) date = nowx()
    closeSize = Math.round(closeSize * 100000000) / 100000000
    priceRange = Math.round(priceRange)
    const executionData = {
      closeDate: date,
      side: side,
      inPrice: nowPrice,
      outPrice: price,
      size: closeSize,
      priceRange: priceRange,
      profit: profit,
      totalProfit: this.profit
    }
    this.executions.push(executionData)
    if (this.broker && !this.broker.bot.isTestMode) {
      if(this.executions.length > this.maxListLengthForProMode) {
        this.executions.shift()
      }
    }
    if(this.maxDD == 0 || this.maxDD > this.profit) {
      this.maxDD = this.profit
    }
    if(this.maxProfit == 0 || this.maxProfit < this.profit) {
      this.maxProfit = this.profit
    }
    if(this.maxOneDD == 0 || this.maxOneDD > profit) {
      this.maxOneDD = profit
    }
    const down = this.profit - this.maxProfit
    if (down < this.maxDown) {
      this.maxDown = down
    }
    const up = this.profit - this.maxDown
    if (up > this.maxUp) {
      this.maxUp = up
    }
    if(this.maxUp > 0 && this.maxDown < 0) {
      const upDownRate = this.maxUp / Math.abs(this.maxDown)
      this.upDownRate = upDownRate.toFixed(1)
    }
    if(this.maxOneProfit == 0 || this.maxOneProfit < profit) {
      this.maxOneProfit = profit
    }
    this.getLatestProfit()
    if(this.broker && this.broker.isCliMode) {
      Log.log(`[exec] ${executionData.side} ${executionData.size} ${executionData.profit} ${executionData.totalProfit}`)
    }
  }

  getLatestProfit() {
    if(this.executions && this.executions.length > 0) {
      this.latestProfit = this.executions.slice(-10).reduce((sum, a) => {
        return sum + parseInt(a.profit)
      }, 0)
    } else {
      this.latestProfit = 0
    }
  }

}

module.exports = ExecutionList
