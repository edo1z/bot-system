const blessed = require('blessed')
const contrib = require('blessed-contrib')
const PriceInfo = require('./parts/PriceInfoMarkdown')
const Log = require('../log/Log')
const ProfitChart = require('./parts/ProfitChart')
const CollateralChart = require('./parts/CollateralChart')
const OrderTable = require('./parts/OrderTable')
const ExecutionHistoryTable = require('./parts/ExecutionHistoryTable')
const TradeRecordTable = require('./parts/TradeRecordTable')
const PositionTable = require('./parts/PositionTable')
const BtcFxPriceChart = require('./parts/BtcFxPriceChart')
const SpreadChart = require('./parts/SpreadChart')
const VolaChart = require('./parts/VolaChart')
const DelayChart = require('./parts/DelayChart')
const ExecutedRateChart = require('./parts/ExecutedRateChart')
const VolumeChart = require('./parts/VolumeChart')
const OrderBookTable = require('./parts/OrderBookTable')

class Screen {
  constructor(bot) {
    this.bot = bot
    this.screen = blessed.screen()
    this.grid = new contrib.grid({
      rows: 12,
      cols: 12,
      screen: this.screen
    })
    this.priceInfo = null
    this.orderTable = null
    this.orderBookTable = null
    this.executionHistory = null
    this.tradeRecordTable = null
    this.positionTable = null

    this._initLog()
    this._initPriceInfo([0,0,12,2])
    if(this.bot.isTestMode) {
      this._initProfitChart([0, 2, 4, 10])
    } else {
      this._initCollateralChart([0, 2, 4, 10])
    }
    this._initTradeRecord([4,2,2,10])
    this._initExecutionHistory([6,2,2,10])
    this._initOrderTable([8, 2, 2, 3])
    this._initPositionTable([8,5,2,7])

    this.setKey()
    this.screen.render()
  }

  setKey() {
    this.screen.key(['C-c'], async (ch, key) => {
      this.bot.stopAll()
      if(!this.bot.strategy.isTestMode()) {
        await this.bot.strategy.posiClear()
      }
    })
    this.screen.key(['C-x'], async (ch, key) => {
      Log.error('SHUTDOWN')
      return process.exit(0);
    })
  }

  _initLog() {
    Log.logScreen = this.grid.set(
      10, 2, 2, 5, contrib.log, Log.logOptions
    )
    Log.ererorScreen = this.grid.set(
      10, 7, 2, 5, contrib.log, Log.errorOptions
    )
  }

  _initPriceInfo(displayPosition) {
    this.priceInfo = this.grid.set(
      ...displayPosition, contrib.markdown, null
    )
    setInterval(() => {
      const priceInfo = PriceInfo.update({
        bot: this.bot
      })
      this.priceInfo.setMarkdown(priceInfo)
      this.screen.render()
    }, 1000)
  }

  _initExecutionHistory(displayPosition) {
    this.executionHistory = this.grid.set(
      ...displayPosition,
      contrib.table,
      ExecutionHistoryTable.chartOptions
    )
    setInterval(() => {
      if (this.bot.strategy) {
        const executions = ExecutionHistoryTable.update(this.bot.strategy)
        if (executions) {
          this.executionHistory.setData(executions)
          this.screen.render()
        }
      }
    }, 1000)
  }

  _initTradeRecord(displayPosition) {
    this.tradeRecordTable = this.grid.set(
      ...displayPosition,
      contrib.table,
      TradeRecordTable.chartOptions
    )
    setInterval(() => {
      const data = TradeRecordTable.update(this.bot)
      this.tradeRecordTable.setData(data)
      this.screen.render()
    }, 1000)
  }

  _initPositionTable(displayPosition) {
    this.positionTable = this.grid.set(
      ...displayPosition,
      contrib.table,
      PositionTable.chartOptions()
    )
    setInterval(() => {
      const data = PositionTable.update(this.bot)
      this.positionTable.setData(data)
      this.screen.render()
    }, 1000)
  }

  _initOrderTable(displayPosition) {
    this.orderTable = this.grid.set(
      ...displayPosition,
      contrib.table,
      OrderTable.chartOptions()
    )
    setInterval(() => {
      const data = OrderTable.update(this.bot)
      if (data) {
        this.orderTable.setData(data)
        this.screen.render()
      }
    }, 1000)
  }

  _initOrderBookTable() {
    this.orderBookTable = this.grid.set(
      4, 6, 8, 3,
      contrib.table,
      OrderBookTable.chartOptions
    )
    setInterval(() => {
      const data = OrderBookTable.update(this.bot)
      this.orderBookTable.setData(data)
      this.screen.render()
    }, 1000)
  }

  _initProfitChart(displayPosition) {
    new ProfitChart({
      bot: this.bot,
      screen: this.screen,
      grid: this.grid,
      displayPosition: displayPosition,
      interval: 1000
    }).init()
  }

  _initCollateralChart(displayPosition) {
    new CollateralChart({
      bot: this.bot,
      screen: this.screen,
      grid: this.grid,
      displayPosition: displayPosition,
      interval: 1000
    }).init()
  }

  _initBtcFxPriceChart(displayPosition) {
    new BtcFxPriceChart({
      bot: this.bot,
      screen: this.screen,
      grid: this.grid,
      displayPosition: displayPosition,
      interval: 1000
    }).init()
  }

  _initSpreadChart(displayPosition) {
    new SpreadChart({
      bot: this.bot,
      screen: this.screen,
      grid: this.grid,
      displayPosition: displayPosition,
      interval: 1000
    }).init()
  }

  _initVolaChart(displayPosition) {
    new VolaChart({
      bot: this.bot,
      screen: this.screen,
      grid: this.grid,
      displayPosition: displayPosition,
      interval: 1000
    }).init()
  }

  _initVolumeChart(displayPosition) {
    new VolumeChart({
      bot: this.bot,
      screen: this.screen,
      grid: this.grid,
      displayPosition: displayPosition,
      interval: 1000
    }).init()
  }

  _initDelayChart(displayPosition) {
    new DelayChart({
      bot: this.bot,
      screen: this.screen,
      grid: this.grid,
      displayPosition: displayPosition,
      interval: 1000
    }).init()
  }

  _initExecutedRateChart(displayPosition) {
    new ExecutedRateChart({
      bot: this.bot,
      screen: this.screen,
      grid: this.grid,
      displayPosition: displayPosition,
      interval: 1000
    }).init()
  }

}

module.exports = Screen
