const LineChart = require('../_parts/lineChart')
const Log = require('../../log/Log')

class VolumeChart extends LineChart {
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
  }

  update() {
    const price = this.bot.broker.lastPrice
    if (price <= 0) return null
    const volumeList = this.bot.broker.volumeList.latestVolumeList
    const totalList = volumeList.map(volume => volume.total)
    this.max = Math.max(...totalList)
    this.min = Math.min(...totalList)
    let x = []
    let y = []
    if (!totalList || totalList.length <= 0) {
      return null
    }
    totalList.forEach((total, idx) => {
      x.push(idx)
      y.push(total)
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
    let min = this.min - 0.1
    if(min < 0) min = 0
    options.label = 'VOLUME'
    options.min = min
    options.max = this.max + 0.1
    return options
  }

}

module.exports = VolumeChart
