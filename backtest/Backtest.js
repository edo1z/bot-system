const strategies = require('../strategies')
const Screen = require('../screen/ScreenForBacktest')
const {datetimeToX, nowdate, yesterday, subtract, now} = require('../utils/time')
const fs = require('fs')
const csv = require('csv')

// Brokers
const BfFx = require('../brokers/bf/fx')

class Backtest {
  constructor({
    date,
    startTime,
    endTime,
    graph
  }) {
    this.screenMode = graph
    this.strategies = strategies
    this.executions = []
    this.orderbooks = []
    this.tradeData = [] // backtest result
    this.date = date
    this.startTime = startTime
    this.endTime = endTime
    this.latestMinute = 1 
    this.initBrokers()
    this.initStrategies()
  }

  initBrokers() {
    this.bfFx = new BfFx({
      isBacktestMode: true
    })
  }

  initStrategies() {
    for(const strategy of this.strategies) {
      strategy.broker = this.bfFx
      strategy.backtestMode = true
      strategy.backtest = this
      strategy.executionList.backtestMode = true
    }
  }

  sliceList() {
    let startDatetime = `${this.date} ${this.startTime}`
    let endDatetime = `${this.date} ${this.endTime}`
    if (this.date === 'latest') {
      const targetDatetime = this._targetDatetime()
      startDatetime = targetDatetime.start
      endDatetime = targetDatetime.end
    }
    if(this.date === 'today') {
      return ['00:00', '23:59']
    }
    const start = datetimeToX(startDatetime)
    const end = datetimeToX(endDatetime)
    if (this.startTime && this.endTime || this.date === 'latest') {
      this.orderbooks = this.orderbooks.filter(book => {
        const time = parseInt(book[0])
        return time >= start && time <= end
      })
    } else if (this.startTime) {
      this.orderbooks = this.orderbooks.filter(book => {
        return parseInt(book[0]) >= start
      })
    } else if (this.endTime) {
      this.orderbooks = this.orderbooks.filter(book => {
        return parseInt(book[0]) <= end
      })
    }
    return [startDatetime, endDatetime]
  }

  async start() {
    await this.readFiles()
    const [start, end] = this.sliceList()
    console.log(`start: ${start} end: ${end}`)
    await this.backtests()
    this.outputTradeData()
    if(this.screenMode) {
      this.screen = new Screen(this)
    }
  }

  async latestBestParams() {
    await this.readFiles()
    const [start, end] = this.sliceList()
    await this.backtests()
    return {
      start: start,
      end: end,
      data: this.tradeData
    }
  }

  async backtests() {
    this.tradeData = []
    for(const strategy of this.strategies) {
      await this.backtest(strategy)
      this.tradeData.push(this._getTradeData(strategy))
    }
    this.sortTradeData()
  }

  async backtest(strategy) {
    let nextTime = 0
    let time = null
    for (let book of this.orderbooks) {
      time = parseInt(book[0])
      if(nextTime > time) continue
      const backtestData = {
        time: parseInt(book[0]),
        bestAsk: parseInt(book[1]),
        bestBid: parseInt(book[2]),
        maxSpread: parseInt(book[3]),
        avgSpread: parseInt(book[4]),
        volume: parseFloat(book[6]),
      }
      nextTime = await strategy.onBoardForBacktest(backtestData)
    }
  }

  sortTradeData() {
    this.tradeData.sort((a, b) => {
      if (parseFloat(a.totalProfit) > parseFloat(b.totalProfit)) {
        return -1
      } else if (parseFloat(a.totalProfit) < parseFloat(b.totalProfit)) {
        return 1
      } else {
        if (parseFloat(a.winRate) > parseFloat(b.winRate)) {
          return -1
        } else if (parseFloat(a.winRate) < parseFloat(b.winRate)) {
          return 1
        } else {
          return 0
        }
      }
    })
  }

  outputTradeData() {
    this.tradeData.forEach(data => {
      this._outputTradeData(data)
    })
  }

  _outputTradeData(tradeData) {
    const d = tradeData
    const strategyInfo = `[minSpread] ${d.strategy.minSpread} [maxPosi] ${d.strategy.maxPosiSize} [interval] ${d.strategy.updateInterval}`
    const profitInfo = `[profit] ${d.totalProfit} [winRate] ${d.winRate} [upDownRate] ${d.upDownRate} [maxDD] ${d.maxDD} [maxDown] ${d.maxDown} [maxProfit] ${d.maxProfit} [maxUp] ${d.maxUp} [maxOneDD] ${d.maxOneDD} [maxOneProfit] ${d.maxOneProfit}`
    const execInfo = `[buyExec] ${d.buyExec} [sellExec] ${d.sellExec} [execRate] ${d.executedRate}`
    console.log(`${strategyInfo} ${profitInfo} ${execInfo}`)
  }

  _getTradeData(strategy) {
    const executionList = strategy.executionList

    const totalProfit = executionList.profit
    const winRate = executionList.winRate()
    const maxDD = executionList.maxDD
    const maxDown = executionList.maxDown
    const maxUp = executionList.maxUp
    const upDownRate = executionList.upDownRate
    const maxProfit = executionList.maxProfit
    const maxOneDD = executionList.maxOneDD
    const maxOneProfit = executionList.maxOneProfit

    const onBoardCount = strategy.onBoardCount
    const buyOrderCount = strategy.buyOrderCount
    const sellOrderCount = strategy.sellOrderCount
    const totalOrderCount = strategy.totalOrderCount()
    const cancelCount = strategy.cancelCount

    const executedCount = strategy.executedCount
    const buyExec = executionList.buyExecutionCount()
    const sellExec = executionList.sellExecutionCount()
    const executedRate = strategy.executedRate()

    return {
      strategy,
      executionList, totalProfit,
      upDownRate, maxDD, maxDown, maxUp,
      maxProfit, maxOneDD, maxOneProfit,
      winRate, buyExec, sellExec,
      onBoardCount, buyOrderCount, sellOrderCount,
      cancelCount, executedCount, totalOrderCount,
      executedRate
    }
  }

  async readFiles() {
    return await Promise.all([
      this.readFile('executions'),
      this.readFile('orderbooks'),
    ])
  }

  _targetDatetime() {
    const targetDates = [yesterday(), nowdate()]
    const startTime = subtract(null, this.latestMinute, 'minutes')
    const endTime = now()
    return {
      dates: targetDates,
      start: startTime,
      end: endTime
    }
  }

  async readFile(type) {
    let fileNames = []
    let fileName = `tradeData/data/${type}`
    if(this.date === 'latest') {
      const targetDatetime = this._targetDatetime()
      fileNames.push(fileName + targetDatetime.dates[0])
      fileNames.push(fileName + targetDatetime.dates[1])
    } else if(this.date === 'today') {
      fileName += nowdate()
      fileNames.push(fileName)
    } else {
      fileName += this.date
      fileNames.push(fileName)
    }
    for(fileName of fileNames) {
      const data = await this._readFile(fileName)
      this[type] = this[type].concat(data)
    }
  }

  _readFile(fileName) {
    return new Promise((resolve, reject) => {
      const file = fs.createReadStream(fileName)
      file.on('error', err => {
        console.error(`file is not exist.\n${err.message}`)
        process.exit(1)
      })
      file.pipe(csv.parse((err, data) => {
        resolve(data)
      }))
    })
  }

}

module.exports = Backtest
