const LineChart = require('../_parts/lineChart')
// const Log = require('../../log/Log')

class SpreadChart extends LineChart {
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
    this.max = 0
    this.min = 0
    this.color = 'green'
    this.maxListLength = 300
    this.spreadList = []
  }

  update() {
    const price = this.bot.broker.lastPrice
    if (price <= 0) return null
    const spread = this.bot.broker.avgSpread
    this.spreadList.push(spread)
    if(this.spreadList.length > this.maxListLength) {
      this.spreadList.shift()
    }
    this.max = Math.max(...this.spreadList)
    this.min = Math.min(...this.spreadList)
    let x = []
    let y = []
    this.spreadList.forEach((spread, idx) => {
      x.push(idx)
      y.push(spread)
    })
    return {
      x: x,
      y: y,
      style: {
        line: this.color
      }
    }
  }

  chartOptions() {
    let options = super.chartOptions()
    let min = this.min - 100
    if (min < 0) min = 0
    options.label = 'SPREAD'
    options.min = min
    options.max = this.max + 100
    return options
  }

}

module.exports = SpreadChart
