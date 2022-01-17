const Config = require('../../config/Config')

class PositionChart {
  static positionList = []
  static maxListLength = Config.maxPriceListLength

  static update() {
    let x = []
    let y = []
    let baseY = []
    this.positionList.forEach((size, idx) => {
      x.push(idx)
      y.push(size)
      baseY.push(0)
    })
    return [
      {
        x: x,
        y: y,
        style: {
          line: 'green'
        }
      },
      {
        x: x,
        y: baseY,
        style: {
          line: 'white'
        }
      }
    ]
  }

  static chartOptions = {
    style: {
      line: "green",
      text: "white",
      baseline: "white"
    },
    top: 12,
    left: 15,
    height: 30,
    width: 80,
    numYLabels: 5,
    xLabelPadding: 3,
    xPadding: 5,
    showLegend: false,
    minY: -0.05,
    maxY: 0.05,
    label: 'POSITION'
  }

  static initPositionList(bot) {
    setInterval(() => {
      this._updatePositionList(bot)
    }, 500)
  }

  static _updatePositionList(bot) {
    const side = bot.broker.position.side
    let size = bot.broker.position.size
    if (size > 0) {
      size = side === 'BUY' ? size : -1 * size
    }
    PositionChart.positionList.push(size)
    if (PositionChart.positionList.length > PositionChart.maxListLength) {
      PositionChart.positionList.shift()
    }
  }

}
module.exports = PositionChart
