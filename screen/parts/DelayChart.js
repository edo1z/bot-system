const LineChart = require('../_parts/lineChart')
const Log = require('../../log/Log')

class DelayChart extends LineChart {
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
    const price = this.bot.broker.lastPrice
    if (price <= 0) return null
    const apiTime = this.bot.broker.apiTime
    const typeList = ['order', 'cancel', 'posi', 'execution']
    let max = -10000
    let min = 100000
    const result = typeList.map((type, idx) => {
      const list = apiTime.list[type]
      const _max = Math.max(...list)
      const _min = Math.min(...list)
      if (max < _max) max = _max
      if (min > _min) min = _min
      let x = []
      let y = []
      list.forEach((apiTime, idx) => {
        x.push(idx)
        y.push(apiTime)
      })
      x.push(list.length)
      y.push(apiTime.avgTime[type])
      return {
        x: x,
        y: y,
        style: {
          line: this.colors[idx]
        }
      }
    })
    this.max = max
    this.min = min
    return result
  }

  chartOptions() {
    let options = super.chartOptions()
    let min = this.min - 0.5
    if (min < 0) min = 0
    options.label = 'API TIME'
    options.min = min
    options.max = this.max + 0.5
    return options
  }

}

module.exports = DelayChart
