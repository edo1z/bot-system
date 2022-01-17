const contrib = require('blessed-contrib')

class LineChart {
  constructor({
    screen,
    grid,
    displayPosition,
    interval = 0
  }) {
    this.screen = screen
    this.grid = grid
    this.displayPosition = displayPosition
    this.interval = interval
    this.content = null

    this.min = 0
    this.max = 0
    this.oldMax = 0 
    this.oldMin = 0
  }

  init() {
    let dataList = this.update()
    this.content = this._initLineChart()
    if (!dataList) {
      dataList = [{x:[0], y:[0]}]
    }
    this.content.setData(dataList)
    this.screen.render()
    if(this.interval > 0) {
      setInterval(() => {
        const dataList = this.update()
        if (dataList) {
          if (this.shouldRefreshY()) {
            this.screen.remove(this.content)
            this.content = this._initLineChart()
          }
          this.content.setData(dataList)
          this.screen.render()
        }
      }, this.interval)
    }
  }

  _initLineChart() {
    return this.grid.set(
      ...this.displayPosition,
      contrib.line,
      this.chartOptions()
    )
  }

  shouldRefreshY() {
    if(Math.abs(this.max - this.oldMax) > 0) {
      this.oldMax = this.max
      return true
    } else if(Math.abs(this.min - this.oldMin) > 0) {
      this.oldMin = this.min
      return true
    } else {
      return false
    }
  }

  chartOptions() {
    return {
      style: {
        line: "green",
        text: "white",
        baseline: "white"
      },
      numYLabels: 5,
      showLegend: false,
      minY: this.min,
      maxY: this.max,
      label: 'LINE CHART'
    }
  }
}

module.exports = LineChart
