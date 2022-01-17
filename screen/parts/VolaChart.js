const LineChart = require('../_parts/lineChart')
// const Log = require('../../log/Log')

class VolaChart extends LineChart {
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
    this.color = ['green', 'blue']
  }

  update() {
    const maxVolaList = this.bot.broker.priceList.maxVolaList
    const avgVolaList = this.bot.broker.priceList.avgVolaList
    if(!maxVolaList || maxVolaList.length <= 0) return null
    this.max = Math.max(...maxVolaList)
    this.min = Math.min(...avgVolaList)
    let lists = []
    let x = []
    let y = []
    maxVolaList.forEach((vola, idx) => {
      x.push(idx)
      y.push(vola)
    })
    lists.push({
      x: x,
      y: y,
      style: {
        line: this.color[0]
      }
    })
    x = []
    y = []
    avgVolaList.forEach((vola, idx) => {
      x.push(idx)
      y.push(vola)
    })
    lists.push({
      x: x,
      y: y,
      style: {
        line: this.color[1]
      }
    })
    return lists
  }

  chartOptions() {
    let options = super.chartOptions()
    let min = this.min - 100
    if (min < 0) min = 0
    options.label = 'VOLA'
    options.min = min
    options.max = this.max + 100
    return options
  }

}

module.exports = VolaChart
