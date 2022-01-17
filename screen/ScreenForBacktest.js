const blessed = require('blessed')
const contrib = require('blessed-contrib')
const ProfitChart = require('./parts/backtest/ProfitChart')

class ScreenForBacktest {
  constructor(backtest) {
    console.log('screen start')
    this.backtest = backtest
    this.screen = blessed.screen()
    this.grid = new contrib.grid({
      rows: 12,
      cols: 12,
      screen: this.screen
    })
    this.tradeRecordTable = null
    this._profitChart([0, 0, 12, 12])
    // this._initTradeRecord()

    this.setKey()
    this.screen.render()
  }

  setKey() {
    this.screen.key(['C-c'], async (ch, key) => {
      return process.exit(0);
    })
    this.screen.key(['C-x'], async (ch, key) => {
      return process.exit(0);
    })
  }

  _profitChart(displayPosition) {
    new ProfitChart({
      backtest: this.backtest,
      screen: this.screen,
      grid: this.grid,
      displayPosition: displayPosition,
    }).init()
  }

  _initTradeRecord() {
    this.tradeRecordTable = this.grid.set(
      6,9,2,3,
      contrib.table,
      TradeRecordTable.chartOptions
    )
    const data = TradeRecordTable.update(this.backtest)
    this.tradeRecordTable.setData(data)
    this.screen.render()
  }

}

module.exports = ScreenForBacktest
