const LineChart = require('../_parts/lineChart')
const {xToTime} = require('../../utils/time')
// const Log = require('../../log/Log')

class CollateralChart extends LineChart {
  constructor({
    bot,
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

    this.bot = bot
    this.color = 'yellow'
  }

  update() {
    const strategy = this.bot.strategies[0]
    const histories = strategy.broker.collateral.collateralHistories
    if(!histories || histories.length <= 0) {
      return [{ x: [0], y: [0] }]
    }
    let x = []
    let y = []
    histories.forEach((history) => {
      const diff = history.diff
      const date = xToTime(history.date)
      x.push(date)
      y.push(diff)
      if (this.max < diff) {
        this.max = diff
      }
      if (this.min > diff) {
        this.min = diff
      }
    })
    if (this.max < 50) {
      this.max = 50
    }
    if (this.min > 0) {
      this.min = 0
    }
    return [{
      x: x,
      y: y,
      style: {
        line: this.color
      }
    }]
  }

  chartOptions() {
    let options = super.chartOptions()
    options.label = 'COLLATERAL'
    options.min = this.min
    options.max = this.max + 50
    return options
  }

}
module.exports = CollateralChart
