const BfApi = require('../../api/bf/ApiClient')
const moment = require('moment')
const {bfTimeToJpX} = require('../../utils/time')
const Log = require('../../log/Log')

class BfCollateral {
  constructor({
    broker
  }) {
    this.broker = broker
    this.collateralHistories = []
    this.id = 0
    this.date = null
    this.firstAmount = 0
    this.amaount = 0
    this.diff = 0
    this.count = 0
    this.maxProfit = 0
    this.maxDD = 0
    this.maxDown = 0
    this.upDownRate = 0
    this.maxUp = 0
    this.latestProfit = 0
    this.interval = 20000
    this.api = new BfApi()
  }

  async init() {
    const histories = await this.getCollateralHistories({amount: 500})
    if(histories && histories.length > 0) {
      for (const history of histories) {
        if(history.currency_code === 'JPY') {
          this.firstAmount = parseInt(history.amount)
          this.push(history)
          break
        }
      }
    }
  }

  push(history) {
    this.id = history.id
    this.date = bfTimeToJpX(history.date)
    this.amount = parseInt(history.amount)
    this.diff = this.amount - this.firstAmount
    if(this.diff < this.maxDD) {
      this.maxDD = this.diff
    }
    if(this.diff > this.maxProfit) {
      this.maxProfit = this.diff
    }
    const down = this.diff - this.maxProfit
    if (down < this.maxDown) {
      this.maxDown = down
    }
    const up = this.diff - this.maxDown
    if (up > this.maxUp) {
      this.maxUp = up
    }
    if(this.maxUp > 0 && this.maxDown < 0) {
      const upDownRate = this.maxUp / Math.abs(this.maxDown) 
      this.upDownRate = upDownRate.toFixed(1)
    }
    const historyData = {
      id: this.id,
      date: this.date,
      amount: this.amount,
      diff: this.diff 
    }
    this.collateralHistories.push(historyData)
    this.count = this.collateralHistories.length
    const latestList = this.collateralHistories.slice((60000 / this.interval + 1) * -1)
    const firstDiff = latestList[0].diff
    const lastDiff = latestList[latestList.length - 1].diff
    this.latestProfit = lastDiff - firstDiff
  }

  start() {
    setInterval(() => {
      this.update()
    }, this.interval)
  }

  async update() {
    const histories = await this.getCollateralHistories({
      before: this.id,
      count: 500
    })
    histories
      .filter(history => history.id > this.id)
      .reverse()
      .map(history => {
        if(history.currency_code === 'JPY') {
          this.push(history)
        }
      })
  }

  async getCollateralHistories({
    id = null,
    count = 500
  }) {
    if(this.broker.apiCall.total() >= this.broker.apiCall.totalLimit) {
      Log.error('private1 api call over - collateral')
      return []
    }
    this.broker.apiCall.add('private1')
    const result = await this.api.getCollateralHistory({
      id, count
    })
    return result.data
  }
}

module.exports = BfCollateral 
