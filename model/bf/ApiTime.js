const Log = require('../../log/Log')

class BfApiTime {
  constructor({broker}) {
    this.time = {
      order: 0,
      cancel: 0,
      posi: 0,
      execution: 0
    }
    this.avgTime = {
      order: 0,
      cancel: 0,
      posi: 0,
      execution: 0
    }
    this.tmpList = {
      order: [],
      cancel: [],
      posi: [],
      execution: []
    }
    this.list = {
      order: [],
      cancel: [],
      posi: [],
      execution: []
    }
    this.broker = broker
    this.init()
    this.maxListLength = 300
  }

  init() {
    if(this.broker.isBacktestMode) return
    setInterval(() => {
      this._update()
    }, 60000)
  }

  add(type, time) {
    this.time[type] = time
    this.tmpList[type].push(time)
    this.avgTime[type] = this.avg(this.tmpList[type])
  }

  avg(list) {
    const sum = list.reduce((a,b) => a + b)
    return Math.round(sum / list.length)
  }

  _update() {
    const typeList = ['order', 'cancel', 'posi', 'execution']
    typeList.forEach(type => {
      this.list[type].push(this.avgTime[type])
      if (this.list[type].length > this.maxListLength) {
        this.list[type].shift()
      }
      this.tmpList[type] = []
    })
    if (this.broker && this.broker.isCliMode) {
      Log.log(`[api time] order: ${this.avgTime.order}(${this.time.order}) cancel: ${this.avgTime.cancel} posi: ${this.avgTime.posi} exec: ${this.avgTime.execution}`)
    }
  }

}

module.exports = BfApiTime
