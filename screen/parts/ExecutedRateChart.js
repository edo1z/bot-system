const LineChart = require('../_parts/lineChart')
const Log = require('../../log/Log')

class ExecutedRateChart extends LineChart {
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
    this.colors = ['green', 'red']

    this.executedRateList = []
    this.allExecutedRateList = []
    this.maxListLength = 300
  }

  update() {
    const price = this.bot.broker.lastPrice
    if (price <= 0) return null

    const strategy = this.bot.strategies[0]
    let orderList = strategy.orderList
    if(!strategy.isTestMode()) {
      orderList = this.bot.broker.orderList
    }
    const executedRate = orderList.executedRate()
    const allExecutedRate = orderList.allExecutedRate()

    this.executedRateList.push(executedRate)
    this.allExecutedRateList.push(allExecutedRate)
    if(this.executedRateList.length > this.maxListLength) {
      this.executedRateList.shift()
      this.allExecutedRateList.shift()
    }
    const max1 = Math.max(...this.executedRateList)
    const max2 = Math.max(...this.allExecutedRateList)
    const min1 = Math.min(...this.executedRateList)
    const min2 = Math.min(...this.allExecutedRateList)
    this.max = max1 > max2 ? max1 : max2
    this.min = min1 < min2 ? min1 : min2
    return this._update([
      this.executedRateList,
      this.allExecutedRateList
    ])
  }

  _update(rateLists) {
    let data = []
    let colorIdx = 0
    rateLists.forEach(rateList => {
      let x = []
      let y = []
      rateList.forEach((rate, idx) => {
        x.push(idx)
        y.push(rate)
      })
      data.push({
        x: x,
        y: y,
        style: {
          line: this.colors[colorIdx]
        }
      })
      colorIdx++
    })
    return data
  }

  chartOptions() {
    let options = super.chartOptions()
    let min = this.min - 0.03
    if (min < 0) min = 0
    options.label = 'EXECUTED RATE'
    options.min = min
    options.max = this.max + 0.03
    return options
  }

}

module.exports = ExecutedRateChart
