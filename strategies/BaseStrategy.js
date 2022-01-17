const moment = require('moment')
const Config = require('../config/Config')
const OrderList = require('../model/OrderList')
const ExecutionList = require('../model/ExecutionList')
const Log = require('../log/Log')
const {timeDiff, sleep, nowx} = require('../utils/time')

class BaseStrategy {
  constructor() {
    this.bot = null
    this.testMode = true
    this.backtestMode = false
    this.stop = false // 強制停止の場合trueになる
    this.posiCleared = false
    this.broker = null
    this.orderList = new OrderList()
    this.executionList = new ExecutionList()

    this.marketFee = 0 // %
    this.limitFee = 0 // %
    this.sizeOfOneTrade = 0.01
    this.minSizeOfOneTrade = 0.01, // 1回当たりの最小サイズ
    this.apiWaitTime = 100 // ms
    this.longOrderStartTime = null // 直近のロング注文の時間
    this.shortOrderStartTime = null // 直近のショート注文の時間
    this.updateInterval = 1000 // updateの実行間隔(ms)

    // APIからポジション情報を取得する間隔(ms)
    this.updateIntervalOfPosition = 15000
    // ポジションを更新した時間
    this.positionUpdatingTime = null
    // バックテスト時のexecutionsの現在値(index)
    this.backtestExecutionIdx = 0

    // 注文数等（主にテストモードで使用）
    this.onBoardCount = 0
    this.buyOrderCount = 0
    this.sellOrderCount = 0
    this.cancelCount = 0
    this.executedCount = 0

    this.onBoardExecTime = 0
  }

  // updateInterval経過後とに呼び出される
  async onTimer() {}

  // 約定発生毎に呼び出される
  async onTick() {}

  // 板状況変更時に呼び出される
  async onBoard() {}

  createInstance() {
    return new this(this)
  }

  totalOrderCount() {
    return this.buyOrderCount + this.sellOrderCount
  }

  // for test mode
  executedRate() {
    const rate = this.executedCount / this.totalOrderCount()
    return Math.round(rate * 100) / 100
  }

  // 約定率の取得
  executedAllRate() {
    let orderList = this.orderList
    if(!this.isTestMode()) {
      orderList = this.broker.orderList
    }
    const executedRate = orderList.executedRate()
    const allExecutedRate = orderList.allExecutedRate()
    return {executedRate, allExecutedRate}
  }

  // profitが最大許容損失を超過している場合、システムを停止する
  async checkMaxLoss() {
    if(this.isTestMode()) return
    const maxLoss = Config.maxLossPrice
    const profit = this.broker.collateral.diff
    if (profit < maxLoss && !this.posiCleared) {
      Log.error('maxLoss over (ToT)')
      this.bot.stopAll()
      await this.posiClear()
    }
  }

  async posiClear() {
    if (this.posiCleared) return
    this.posiCleared = true
    Log.error('POSI CLEAR')
    await this.cancelOrdersBySide(null, true)
    Log.error('CANCELED ORDERS')
    await sleep(3000)
    const position = this.broker.position
    await position.updateByApi()
    const size = position.size
    const price = position.price
    if(size !== 0) {
      Log.error(`now position ${size} ${price}`)
      if (size > 0) {
        // LONG
        if(size >= this.minSizeOfOneTrade) {
          await this.order('MARKET', size * -1, 0, true)
        } else {
          await this.order('MARKET', this.minSizeOfOneTrade, 0, true)
          await sleep(3000)
          await this.order('MARKET', (size + this.minSizeOfOneTrade) * -1, 0, true)
        }
      } else {
        // SHORT
        if(size <= this.minSizeOfOneTrade) {
          await this.order('MARKET', size * -1, 0, true)
        } else {
          await this.order('MARKET', this.minSizeOfOneTrade * -1, 0, true)
          await sleep(3000)
          await this.order('MARKET', (size - this.minSizeOfOneTrade) * -1, 0, true)
        }
      }
      Log.error('POSI CLEARED')
    }
  }

  posi() {
    if (this.isTestMode()) {
      return {
        size: this.executionList.posiSize,
        price: this.executionList.posiPrice
      }
    } else {
      return {
        size: this.broker.executionList.posiSize,
        price: this.broker.executionList.posiPrice
      }
    }
  }

  isTestMode() {
    if (
      this.testMode
      || this.backtestMode
    ) {
      return true
    } else {
      return false
    }
  }

  // 利益の取得
  latestProfit() {
    if(!this.isTestMode()) {
      return this.broker.collateral.latestProfit
    } else {
      return this.executionList.latestProfit
    }
  }

  // 正しいポジションを取得・反映する
  async checkGapOfPosition() {
    if (this.isTestMode()) return false
    if(this.positionUpdatingTime) {
      const diff = timeDiff(this.positionUpdatingTime, null, 'seconds')
      if (diff <= this.updateIntervalOfPosition / 1000) return false
    }
    this.positionUpdatingTime = moment().format('YYYY-MM-DD HH:mm:ss')
    const executionList = this.broker.executionList
    const position = this.broker.position
    await this.cancelOrdersBySide()
    await position.updateByApi()
    executionList.posiSize = position.size
    executionList.posiPrice = position.price
    return true
  }

  isExecutedForBacktest(time) {
    const orders = this.orderList.getOpenOrders()
    if(!orders || orders.length <= 0) return
    const orderStart = time + this.apiWaitTime
    const orderEnd = time + this.updateInterval
    const executions = this.backtest.executions
    let i = this.backtestExecutionIdx
    const length = executions.length
    let minPrice = 0
    let maxPrice = 0
    for(i; i < length; i++) {
      const execTime = parseInt(executions[i][0])
      if (execTime < orderStart) continue
      if (execTime > orderEnd) break
      const execPrice = parseInt(executions[i][2])
      if (minPrice === 0 || minPrice > execPrice) {
        minPrice = execPrice
      }
      if (maxPrice === 0 || maxPrice < execPrice) {
        maxPrice = execPrice
      }
    }
    if (minPrice > 0 && maxPrice > 0) {
      orders.forEach(order => {
        let isExecuted = false
        if(order.size > 0) {
          // LONG
          if(order.price > minPrice) {
            isExecuted = true
          }
        } else {
          // SHORT
          if(order.price < maxPrice) {
            isExecuted = true
          }
        }
        if (isExecuted) {
          this.executedCount++
          this.executionList.add({
            price: order.price,
            size: order.size,
            date: time
          })
          order.executed = true
          order.allExecuted = true
        }
      })
    }
    this.backtestExecutionIdx = i
  }

  isExecuted() {
    if(!this.isTestMode()) return
    const orders = this.orderList.getOpenOrders()
    orders.forEach(order => {
      let isExecuted = false
      const lastMinPrice = this.broker.lastMinPrice
      const lastMaxPrice = this.broker.lastMaxPrice
      if (order.size > 0) {
        // LONG
        if (
          order.price >= this.broker.bestAsk
          || order.price > lastMinPrice
        ) {
          isExecuted = true
        } else if (order.price == lastMinPrice) {
        }
      } else if (order.size < 0) {
        // SHORT
        if (
          order.price <= this.broker.bestBid
          || order.price < lastMaxPrice
        ) {
          isExecuted = true
        } else if(order.price == lastMaxPrice){
        }
      }
      if (isExecuted) {
        this.executedCount++
        this.executionList.add({
          price: order.price,
          size: order.size,
          date: nowx()
        })
        order.executed = true
        order.allExecuted = true
      }
    })
  }

  // 注文を出す
  async order({ type, size, price, force = false}) {
    if(this.stop && !force) return
    size = Math.round(size * 100000000) / 100000000
    // FIXME
    if(Math.abs(size) < 0.01) {
      Log.error(`size too small. ${size}`)
      return
    }
    let id = null
    if (type === 'LIMIT') {
      if (size == 0) return
      if(this.isTestMode()) {
        if(!this.backtestMode) {
          await sleep(this.apiWaitTime)
        }
        this.orderList.add({id, size, price})
      } else {
        id = await this.broker.order({type, size, price})
        if(id) {
          this.broker.orderList.add({id, size, price})
        }
      }
    } else {
      if(this.isTestMode()) {
        if(!this.backtestMode) {
          await sleep(this.apiWaitTime)
        }
        if (size > 0) {
          price = this.broker.bestAsk
        } else {
          price = this.broker.bestBid
        }
        this.executionList.add({
          price,
          size,
          date: nowx()
        })
      } else {
        Log.error(`MARKET ORDER ${type} ${size} ${price}`)
        id = await this.broker.order({type, size, price})
        if (id) {
          this.broker.orderList.add({id, size, price})
        }
      }
    }
    const side = size > 0 ? 'BUY' : 'SELL'
    if(side === 'BUY') {
      this.buyOrderCount++
    } else {
      this.sellOrderCount++
    }
    this._setOrderStartTime(side)
  }

  _hasPassedOrderTime(side) {
    if (side === 'BUY') {
      if (this.longOrderStartTime) {
        const startTime = moment(this.longOrderStartTime, 'x')
        if(startTime.add(this.orderTimeLimit, 's').isAfter(moment())) {
          return false
        }
      }
    } else {
      if (this.shortOrderStartTime) {
        const startTime = moment(this.shortOrderStartTime, 'x')
        if(startTime.add(this.orderTimeLimit, 's').isAfter(moment())) {
          return false
        }
      }
    }
    return true
  }

  _setOrderStartTime(side) {
    const time = moment().format('x')
    if (side === 'BUY') {
      this.longOrderStartTime = time
    } else {
      this.shortOrderStartTime = time
    }
  }

  async cancelAll(force = false) {
    if(this.stop && !force) return
    if(this.isTestMode()) {
      if(!this.backtestMode) {
        await sleep(this.apiWaitTime)
      }
      this.orderList.cancelAll()
    } else {
      await this.broker.cancelAll()
      this.broker.orderList.cancelAll()
    }
  }

  async cancel(id, force = false) {
    if(this.stop && !force) return
    this.cancelCount++
    if(this.isTestMode()) {
      if(!this.backtestMode) {
        await sleep(this.apiWaitTime)
      }
      this.orderList.cancel(id)
    } else {
      await this.broker.cancel(id)
      this.broker.orderList.cancel(id)
    }
  }

  async cancelOrdersBySide(side = null, force = false) {
    if(this.stop && !force) return
    let cancelFuncList = []
    let orders = this.orderList.getOpenOrders()
    if (!this.isTestMode()) {
      orders = this.broker.orderList.getOpenOrders()
    }
    if (side === 'BUY') {
      orders.forEach(order => {
        if (order.size > 0) {
          cancelFuncList.push(this.cancel(order.id))
        }
      })
    } else if (side === 'SELL') {
      orders.forEach(order => {
        if (order.size < 0) {
          cancelFuncList.push(this.cancel(order.id))
        }
      })
    } else {
      orders.forEach(order => {
        if (order.size !== 0) {
          cancelFuncList.push(this.cancel(order.id))
        }
      })
    }
    return await Promise.all(cancelFuncList)
  }

}
module.exports = BaseStrategy
