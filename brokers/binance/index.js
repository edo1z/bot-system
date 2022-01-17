const BaseBroker = require('../BaseBroker')
const BinanceWs = require('../../api/binance/WebSocketClient')

class Binance extends BaseBroker {
  constructor() {
    super()
    this.api = null
    this.start()
  }

  initWs() {
    this.ws = new BinanceWs({
      streamName: 'btcusdt@trade',
      subscriptions: ['btcusdt@trade'],
      onmessage: async (data) => {
        if (data.e === 'trade') {
          this.updateTrade(data)
        }
      }
    })
    this.ws.connect()
  }

  updateTrade(data) {
    this.updateLastPrice(data.p)
  }

}

module.exports = Binance
