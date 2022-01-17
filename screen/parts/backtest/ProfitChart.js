const LineChart = require('../../_parts/lineChart')
// const Log = require('../../log/Log')

class ProfitChartForBacktest extends LineChart {
  constructor({
    backtest,
    screen,
    grid,
    displayPosition,
    interval = 0
  }) {
    super({
      screen,
      grid,
      displayPosition,
      interval
    })

    this.backtest = backtest
    this.min = 0
    this.max = 0
    this.colors = [
      'green',
      'blue',
      'red',
      'yellow',
      [0, 200, 255],
      [255, 30, 150],
      [100, 100, 255],
    ]
  }

  update() {
    let profitList = []
    let idx = 0
    this.backtest.strategies.forEach((strategy) => {
      const executions = strategy.executionList.executions
      const data = this._update(
        executions,
        this.colors[idx]
      )
      profitList.push(data)
      idx++
    })
    return profitList
  }

  _update(profitList, color) {
    if (!profitList || profitList.length <= 0) {
      return {
        x: [0],
        y: [0]
      }
    } 
    let x = []
    let y = []
    profitList.forEach((profit, idx) => {
      const total = profit.totalProfit
      x.push(idx)
      y.push(total)
      if (this.max < total) {
        this.max = total
      }
      if (this.min > total) {
        this.min = total
      }
    })
    if (this.max < 50) {
      this.max = 50
    }
    if (this.min > 0) {
      this.min = 0
    }
    return {
      x: x,
      y: y,
      style: {
        line: color 
      }
    }
  }
  
  chartOptions() {
    let options = super.chartOptions()
    options.label = 'PROFIT'
    options.minY = this.min
    options.maxY = this.max + 50
    return options
  }

}

module.exports = ProfitChartForBacktest
