const BaseBroker = require('../BaseBroker')
const BfWs = require('../../api/bf/WebSocketClient')
const BfApi = require('../../api/bf/ApiClient')
const BfExec = require('../../model/bf/Execution')
const BfPosition = require('../../model/bf/Position')
const BfOrderList = require('../../model/bf/OrderList')
const BfPriceList = require('../../model/bf/PriceList')
const BfExecutionList = require('../../model/bf/ExecutionList')
const BfVolumeList = require('../../model/bf/VolumeList')
const BfCollateral = require('../../model/bf/Collateral')
const BfApiCall = require('../../model/bf/ApiCall')
const BfApiTime = require('../../model/bf/ApiTime')
const Log = require('../../log/Log')

class BfFx extends BaseBroker {
  constructor({
    bot = null,
    bf,
    isTestMode = true,
    isBacktestMode = false,
    isCliMode = false,
  }) {
    super({
      bot,
      isTestMode,
      isBacktestMode,
      isCliMode
    })
    this.api = new BfApi()
    this.bf = bf
    this.delta = 0.0 // SFD
    this.position = new BfPosition({broker: this})
    this.priceList = new BfPriceList({broker: this})
    this.orderList = new BfOrderList({broker: this})
    this.executionList = new BfExecutionList({broker: this})
    this.volumeList = new BfVolumeList({broker: this})
    this.collateral = new BfCollateral({broker: this})
    this.apiCall = new BfApiCall({broker: this})
    this.apiTime = new BfApiTime({broker: this})
    this.start()
  }

  async start() {
    super.start()
    if (!this.isTestMode && !this.isBacktestMode) {
      // 利益グラフをAPI取得に切り替える場合は下記を使う
      // 最初に今のポジをAPIで取得
      await this.position.updateByApi()
      // 証拠金の定期取得開始
      await this.collateral.init()
      this.collateral.start()
    }
  }

  initWs() {
    this.ws = new BfWs({
      publicChannels: [
        'lightning_executions_FX_BTC_JPY',
        'lightning_board_snapshot_FX_BTC_JPY',
        'lightning_board_FX_BTC_JPY'
      ],
      callbacks: {
        'lightning_executions_FX_BTC_JPY': (msg) => {
          const executions = msg.map(exec => new BfExec(exec))
          this.updateExecution(executions)
        },
        'lightning_board_snapshot_FX_BTC_JPY': (msg) => {
          this.initOrderBook(msg)
        },
        'lightning_board_FX_BTC_JPY': (msg) => {
          this.updateOrderBook(msg)
        }
      }
    })
    this.ws.init()
  }

  update() {
    super.update()
    this.updateDelta()
  }

  updateDelta() {
    this.delta = (this.lastPrice - this.bf.lastPrice) / this.bf.lastPrice
  }

  updateExecution(executions) {
    // executionsの配列の最後が最新の前提（違ったら直す）
    const exec = executions[executions.length - 1]
    this.lastPrice = exec.price
    let maxPrice = 0
    let minPrice = 0
    executions.forEach(exec => {
      if (maxPrice <= 0 || maxPrice < exec.price) {
        maxPrice = exec.price
      }
      if (minPrice <= 0 || minPrice > exec.price) {
        minPrice = exec.price
      }
    })
    this.lastMaxPrice = maxPrice
    this.lastMinPrice = minPrice

    // add to VolumeList
    this.volumeList.add(executions)

    // Real Modeの場合にポジションや約定履歴を保存
    this.updatePosition(executions)

    // 各StrategyのonTickを実行
    this.doOnTicks()
  }

  // Websocketのexecutionsからポジ計算
  updatePosition(executions) {
    if (this.isTestMode) return
    this.executionList.update(executions)
  }

  initOrderBook(data) {
    this.orderBook.init(data)
    this.doOnBoards()
  }

  updateOrderBook(data) {
    if(!this.orderBook) return
    this.orderBook.update(data)
    this.bestBid = this.orderBook.bestBid()
    this.bestAsk = this.orderBook.bestAsk()
    this.midPrice = this.orderBook.midPrice
    this.updateBestPrices(
      this.bestBid,
      this.bestAsk,
      this.midPrice
    )
    this.doOnBoards()
  }

  async order({ type, size, price }) {
    if(this.apiCall.total() >= this.apiCall.totalLimit) {
      Log.error('private1 api call over - order')
      return null
    }
    if(this.apiCall.private2 >= this.apiCall.private2Limit) {
      Log.error('private2 api call over - order')
      return null
    }
    this.apiCall.add('private2')
    const side = size > 0 ? 'BUY' : 'SELL'
    size = Math.round(Math.abs(size) * 100000000) / 100000000
    // FIXME
    if (size < 0.01) {
      Log.error(`BfFx Order ERROR: size is too small. ${size}`)
      return null
    }
    price = parseInt(price)
    const startTime = new Date()
    const result = await this.api.order(
      type,
      side,
      price,
      size,
      null,
      null
    ).catch(err => {
      Log.error(`BfFx Order ERROR: ${err.message}`)
      Log.error(`${type} ${side} ${price} ${size}`)
      return null
    })
    if (result) {
      const time = new Date() - startTime
      this.apiTime.add('order', time)
      return result.data.child_order_acceptance_id
    } else {
      return null
    }
  }

  async cancel(id) {
    if(this.apiCall.total() >= this.apiCall.totalLimit) {
      Log.error('private1 api call over - cancel')
      return null
    }
    this.apiCall.add('private1')
    const startTime = new Date()
    return await this.api.cancel({
      child_order_acceptance_id: id
    }).catch(err => {
      Log.error(`BfFx Cancel ERROR: ${err.message}`)
      return false
    }).then(() => {
      const time = new Date() - startTime
      this.apiTime.add('cancel', time)
      return true
    })
  }

  async cancelAll() {
    if(this.apiCall.private2 >= this.apiCall.private2Limit) {
      Log.error('private2 api call over - cancel all')
      return null
    }
    this.apiCall.add('private2')
    return await this.api.cancelAll()
      .catch(err => {
        Log.error(`BfFx CancelAll ERROR: ${err.message}`)
        return false
      }).then(() => {
        return true
      })
  }

}

module.exports = BfFx
