const Config = require('../config/Config')
const PriceList = require('../model/PriceList')
const OrderBook = require('../model/OrderBook')
const Log = require('../log/Log')

// Brokerインスタンスを作成したら、自動的にプライス情報取得が始まる
class BaseBroker {
  constructor({
    bot = null,
    isTestMode = true,
    isBacktestMode = false,
    isCliMode = false,
  }) {
    this.bot = bot
    this.isTestMode = isTestMode
    this.isBacktestMode = isBacktestMode
    this.isCliMode = isCliMode

    this.api = null
    this.ws = null
    this.position = null
    this.orderList = null
    this.executionList = null
    this.volumeList = null
    this.orderBook = new OrderBook()
    this.priceList = new PriceList({broker: this})

    this.lastPrice = 0
    // lastPriceと同じタイミングで送信されてきた約定価格の最高値
    this.lastMaxPrice = 0
    // lastPriceと同じタイミングで送信されてきた約定価格の最安値
    this.lastMinPrice = 0
    this.bestAsk = 0
    this.bestBid = 0
    this.midPrice = 0
    this.spread = 0
    this.spreadList = []
    this.spreadListLength = 300
    this.avgSpread = 0
    this.maxSpread = 0

    // イベント時に呼び出される関数が実行中の場合true
    // 実行中の場合、関数呼び出しがスキップされる
    this.onTicksDoing = false
    this.onBoardsDoing = false
  }

  start() {
    if(this.isBacktestMode) return
    this.initWs()
    setInterval(
      () => { this.update() },
      Config.intervalForUpdatePriceInfo
    )
  }

  initWs() {}

  async doOnTicks() {
    if (!this.bot) return
    if (
      !this.bot.strategies
      || this.bot.strategies.length <= 0
      || this.onTicksDoing
    ) {
      return
    }
    this.onTicksDoing = true
    const funcList = this.bot.strategies.map(
      strategy => strategy.onTick()
    )
    await Promise.all(funcList)
    this.onTicksDoing = false
  }

  async doOnBoards() {
    if (!this.bot) return
    if(
      !this.bot.strategies
      || this.bot.strategies.length <= 0
      || this.onBoardsDoing
    ) {
      return
    }
    this.onBoardsDoing = true
    const funcList = this.bot.strategies.map(
      strategy => strategy.onBoard()
    )
    await Promise.all(funcList)
    this.onBoardsDoing = false
  }

  update() {
    this.priceList.update(this.midPrice)
  }

  updateLastPrice(price) {
    this.lastPrice = price
  }

  updateBestPrices(bestBid, bestAsk, midPrice = 0) {
    this.bestBid = bestBid
    this.bestAsk = bestAsk
    this.spread = bestAsk - bestBid
    this.spreadList.push(this.spread)
    if (this.spreadList.length > this.spreadListLength) {
      this.spreadList.shift()
    }
    this.maxSpread = Math.max(...this.spreadList)
    const sumSpread = this.spreadList.reduce((prev, current) => prev + current)
    this.avgSpread = parseInt(sumSpread / this.spreadList.length)
    if(midPrice) {
      this.midPrice = midPrice
    } else {
      this.midPrice = bestBid + this.spread / 2
    }
  }

  updateOrderBook(orderBookData) {
    this.orderBook.update(orderBookData)
  }

}

module.exports = BaseBroker
