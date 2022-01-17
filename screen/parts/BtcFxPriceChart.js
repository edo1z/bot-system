const LineChart = require('../_parts/lineChart')
const Log = require('../../log/Log')

class BtcFxPriceChart extends LineChart {
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
  }

  update() {
    const priceList = this.bot.broker.priceList.priceList
    this.max = Math.max(...priceList)
    this.min = Math.min(...priceList)
    let x = []
    let y = []
    priceList.forEach((price, idx) => {
      x.push(idx)
      y.push(price)
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
    options.label = 'BTC-FX'
    options.min = this.min - 1000
    options.max = this.max + 1000
    return options
  }

}

module.exports = BtcFxPriceChart
