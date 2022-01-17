const BaseStrategy = require('../BaseStrategy')
const {sleep, betweenTime} = require('../../utils/time')

class Strategy1 extends BaseStrategy{
  constructor({
    testMode = true,
    backtestMode = false,
    sizeOfOneTrade = 0.01, // 1回当たりの取引サイズ
    minSizeOfOneTrade = 0.01, // 1回当たりの最小サイズ
    updateInterval = 1500, // 2sec
    maxPosiSize = 0.06, // 最大ポジ数
    apiWaitTime = 130, // APIの想定リクエスト時間
    minSpread = 2000,
    spreadRate = 0.95,
    spreadRateForRikaku = 0.95,
    spreadRateForLosscut = 0.5,
    
    // if spread < avgSpread * this.avgSpreadRateLimit -> can not buy
    avgSpreadRateLimit = 1.0,
    // if spread < maxSpread * this.maxSpreadRateLimit -> can not buy
    maxSpreadRateLimit = 0.0,
  }) {
    super()
    this.testMode = testMode
    this.backtestMode = backtestMode
    this.sizeOfOneTrade = sizeOfOneTrade
    this.minSizeOfOneTrade = minSizeOfOneTrade
    this.updateInterval = updateInterval
    this.maxPosiSize = maxPosiSize
    this.apiWaitTime = apiWaitTime

    this.minSpread = minSpread
    this.spreadRate = spreadRate
    this.spreadRateForRikaku = spreadRateForRikaku
    this.spreadRateForLosscut = spreadRateForLosscut
    this.avgSpreadRateLimit = avgSpreadRateLimit
    this.maxSpreadRateLimit = maxSpreadRateLimit

    this.backtestData = null

    this.onBoardExecTime = 0
  }

  async onTick() {
    this.isExecuted()
  }

  async onBoard() {
    let start = new Date()
    this.onBoardCount++
    this.checkMaxLoss()
    if (this.broker && this.broker.midPrice > 0 && this.minSpread > 0) {
      await Promise.all([
        this.buyAndSell(),
        sleep(this.updateInterval)
      ])
    }
    this.onBoardExecTime = new Date() - start
  }

  async onBoardForBacktest(data) {
    this.onBoardCount++

    // 事前のモック作成
    this.backtestData = data
    this.broker.bestAsk = data.bestAsk
    this.broker.bestBid = data.bestBid
    this.broker.spread = data.bestAsk - data.bestBid
    this.broker.maxSpread = data.maxSpread
    this.broker.avgSpread = data.avgSpread
    this.broker.midPrice = parseInt((data.bestAsk - data.bestBid) / 2) + data.bestBid

    // 注文判断および注文
    await this.buyAndSellForBacktest()

    // 注文があれば約定判定
    this.isExecutedForBacktest(data.time)

    // 次の時間まで飛ばす
    return data.time + this.updateInterval
  }

  _priceRangeForRikaku(targetSpread = null) {
    const spread = targetSpread ? targetSpread : this.broker.spread
    return spread / 2 * this.spreadRateForRikaku
  }

  _priceRangeForLosscut(targetSpread = null) {
    const spread = targetSpread ? targetSpread : this.broker.spread
    return spread / 2 * this.spreadRateForLosscut
  }

  _priceRangeForIn(targetSpread = null) {
    const spread = targetSpread ? targetSpread : this.broker.spread
    return spread / 2 * this.spreadRate
  }

  __price(type, targetSpread = null) {
    const midPrice = this.broker.midPrice
    const bestBid = this.broker.bestBid
    const bestAsk = this.broker.bestAsk
    let priceRange = 0
    switch(type) {
      case 'noposi':
        priceRange = this._priceRangeForIn(targetSpread)
        break
      case 'rikaku':
        priceRange = this._priceRangeForRikaku(targetSpread)
        break
      case 'losscut':
        priceRange = this._priceRangeForLosscut(targetSpread)
        break
    }
    priceRange = priceRange
    return { midPrice, bestBid, bestAsk, priceRange }
  }

  _buyPrice(type = 'noposi', targetSpread = null) {
    const prices = this.__price(type, targetSpread)
    return Math.ceil(prices.midPrice - prices.priceRange)
  }

  _sellPrice(type = 'noposi', targetSpread = null) {
    const prices = this.__price(type, targetSpread)
    return Math.floor(prices.midPrice + prices.priceRange)
  }

  async _buyAndSell() {
    const posi = this.posi()
    let buyPrice = 0
    let sellPrice = 0
    let buySize = this.sizeOfOneTrade
    let sellSize = this.sizeOfOneTrade * -1
    let canBuy = true
    let canSell = true
    let canCancelBuy = true
    let canCancelSell = true

    if (Math.abs(posi.size) >= this.maxPosiSize) {
      if(posi.size > 0) {
        canBuy = false
        sellPrice = this._sellPrice('losscut')
      } else {
        canSell = false
        buyPrice = this._buyPrice('losscut')
      }
    } else if (posi.size >= this.sizeOfOneTrade) {
      // 全体的に下げる
      sellPrice = this._sellPrice('rikaku')
      canBuy = false
    }else if (posi.size <= this.sizeOfOneTrade * -1) {
      // 全体的に上げる
      buyPrice = this._buyPrice('rikaku')
      canSell = false
    } else {
      // NOPOSI
      if(await this.checkGapOfPosition()) return

      let sfd = 0
      if(this.broker.delta) sfd = this.broker.delta
      const spread = this.broker.spread
      const avgSpread = this.broker.avgSpread
      const maxSpread = this.broker.maxSpread
      if (
        sfd * 100 > 4.8
        || spread < this.minSpread
        || spread < avgSpread * this.avgSpreadRateLimit
        || spread < maxSpread * this.maxSpreadRateLimit
      ) {
        canBuy = false
        canSell = false
      } else {
        buyPrice = this._buyPrice('noposi')
        sellPrice = this._sellPrice('noposi')
      }
    }

    if(canBuy && canSell) {
      return await Promise.all([
        this._cancel(canCancelBuy, canCancelSell),
        this.order({
          type: 'LIMIT',
          size: buySize,
          price: buyPrice
        }),
        this.order({
          type: 'LIMIT',
          size: sellSize,
          price: sellPrice
        })
      ])
    } else if (!canBuy && !canSell) {
      this.cancelOrdersBySide()
    } else if (canBuy) {
      return await Promise.all([
        this._cancel(canCancelBuy, canCancelSell),
        this.order({
          type: 'LIMIT',
          size: buySize,
          price: buyPrice
        })
      ])
    } else if (canSell) {
      return await Promise.all([
        this._cancel(canCancelBuy, canCancelSell),
        this.order({
          type: 'LIMIT',
          size: sellSize,
          price: sellPrice
        })
      ])
    }
  }

  async buyAndSell() {
    // 4時～4時10分は注文停止
    if(betweenTime('04:00', '04:10')) {
      return
    }
    await this._buyAndSell()
  }

  async buyAndSellForBacktest() {
    await this._buyAndSell()
  }

  async _cancel(canCancelBuy, canCancelSell) {
    let side = null
    if(!canCancelBuy) {
      side = 'SELL'
    } else if(!canCancelSell) {
      side = 'BUY'
    }
    await this.cancelOrdersBySide(side)
  }

}

module.exports = Strategy1
