const BfWs = require('../../api/bf/WebSocketClient')
const BfExec = require('../../model/bf/Execution')
const OrderBook = require('../../model/OrderBook')
const BfPriceList = require('../../model/bf/PriceList')
const BfVolumeList = require('../../model/bf/VolumeList')
const {nowx, nowdate} = require('../../utils/time')
const fs = require('fs')

class BfFx {
  constructor() {
    this.filePath = 'tradeData/data/'
    this.outputInterval = 1000
    this.executions = ''
    this.orderBooks = '' 
    this.executionsRow = 0
    this.orderBooksRow = 0
    this.orderBook = new OrderBook()
    this.volumeList = new BfVolumeList({broker: this})
    this.priceList = new BfPriceList({broker: this})
    this.spreadList = [] 
    this.spreadListLength = 300
    this.midPrice = 0
  }

  start() {
    this.initWs()
    setInterval(() => {
      this.priceList.update(this.midPrice)
    }, 1000)
    setInterval(() => {
      this.outputExecution()
      this.outputOrderBook()
    }, this.outputInterval)
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

  fileName(type) {
    return this.filePath + type + nowdate()
  }

  updateExecution(executions) {
    const time = nowx()
    const exec = executions[executions.length - 1]
    this.lastPrice = exec.price
    this.volumeList.add(executions)
    executions.reverse().forEach(data => {
      let size = Math.round(data.size * 1000000) / 1000000
      if(data.side === 'SELL') {
        size *= -1 
      }
      this.executions += `${time},${size},${data.price}\n`
      this.executionsRow++
    })
  }

  initOrderBook(msg) {
    this.orderBook.init(msg)
  }

  _updateSpread(bestBid, bestAsk) {
    const spread = Math.abs(bestBid - bestAsk) 
    this.spreadList.push(spread)
    if(this.spreadList.length > this.spreadListLength) {
      this.spreadList.shift()
    }
    const maxSpread = Math.max(...this.spreadList)
    const sumSpread = this.spreadList.reduce((prev, current) => prev + current)
    const avgSpread = parseInt(sumSpread / this.spreadList.length)
    return { maxSpread, avgSpread }
  }

  updateOrderBook(msg) {
    this.orderBook.update(msg)
    const bestAsk = this.orderBook.bestAsk()
    const bestBid = this.orderBook.bestBid()
    this.midPrice = (bestAsk - bestBid) / 2 + bestBid
    const {maxSpread, avgSpread} = this._updateSpread(bestBid, bestAsk)
    const vola = this.priceList.vola
    const volume = this.volumeList.volume
    const afterPriceRanges = this.orderBook.afterPriceRange(volume)
    if (bestAsk > 0 && bestBid > 0 && this.midPrice) {
      const time = nowx()
      this.orderBooks += `${time},${bestAsk},${bestBid},${maxSpread},${avgSpread},${vola},${volume},${afterPriceRanges.ask},${afterPriceRanges.bid}\n`
      this.orderBooksRow++
    }
  }

  outputExecution() {
    console.log(`executions saving (${this.executionsRow}) ...`)
    const fileName = this.fileName('executions')
    const options = {flag: 'a'}
    fs.writeFile(fileName, this.executions, options, (err) => {
      if (err) {
        console.error(`ERROR: execution save error.\n${err}`)
      } else {
        this.executions = ''
      }
    })
  }

  outputOrderBook() {
    console.log(`orderBooks saving (${this.orderBooksRow}) ...`)
    const fileName = this.fileName('orderbooks')
    const options = {flag: 'a'}
    fs.appendFile(fileName, this.orderBooks, options, (err) => {
      if (err) {
        console.error(`ERROR: orderBooks save error.\n${err}`)
      } else {
        this.orderBooks = ''
      }
    })
  }

}

module.exports = BfFx
