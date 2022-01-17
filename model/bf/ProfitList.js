const BfApi = require('../../api/bf/ApiClient')
const ExecutionList = require('../ExecutionList')
const Log = require('../../log/Log')
const {sleep, bfTimeToJpX} = require('../../utils/time')

class BfProfitList extends ExecutionList{
  constructor({
    broker
  }) {
    super()
    this.broker = broker
    this.lastId = null
    // 何ミリ秒おきに約定履歴を取得するか
    this.intervalTime = 30000
    this.api = new BfApi()
  }

  async start({
    price, size
  }) {
    this.posiSize = size
    this.posiPrice = price

    // 定期的にAPIで約定履歴取得・利益情報更新
    while(true) {
      await Promise.all([
        this.update(),
        sleep(this.intervalTime)
      ])
    }
  }

  async update() {
    if (this.lastId) {
      await this._update()
    } else {
      // 最新のExecutionを取得し、それをlastIDにする
      await this._latestExecution()
    }
  }

  async _latestExecution() {
    if(this.broker.apiCall.total() >= this.broker.apiCall.totalLimit) {
      Log.error('private1 api call over - execution')
      return null
    }
    this.broker.apiCall.add('private1')
    const startTime = new Date()
    this.broker.apiTime.add
    await this.api.getMyExecutions({ count: 1 })
      .then((result) => {
        this.lastId = result.data[0].id
        // Log.log(`lastId: ${lastId}`)
        const time = new Date() - startTime
        this.broker.apiTime.add('execution', time)
      })
      .catch(err => Log.log(err.message))
  }

  async _update() {
    if(this.broker.apiCall.total() >= this.broker.apiCall.totalLimit) {
      Log.error('private1 api call over - execution')
      return null
    }
    this.broker.apiCall.add('private1')
    const startTime = new Date()
    const result = await this.api.getMyExecutions({
      count: 500,
      after: this.lastId
    })
    const time = new Date() - startTime
    this.broker.apiTime.add('execution', time)
    const executions = result.data
    if (!executions || executions.length <= 0) {
      return
    }
    this.lastId = executions[0].id
    for (let i = executions.length - 1; i >= 0; i--) {
      const side = executions[i].side
      let size = executions[i].size
      if (side === 'SELL') size *= -1
      const price = executions[i].price
      const date = bfTimeToJpX(executions[i].exec_date)
      this.add({
        price,
        size,
        date,
        real: true
      })
    }
  }
}

module.exports = BfProfitList
