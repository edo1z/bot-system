const BaseBroker = require('../BaseBroker')
const CoinbaseWs = require('../../api/coinbase/WebSocketClient')

class Coinbase extends BaseBroker {
  constructor() {
    super()
    this.api = null
    this.start()
  }

  initWs() {
    this.ws = new CoinbaseWs({
      subscriptions: [
        { name: 'ticker', product_ids: ['BTC-USD'] },
        { name: 'heartbeat', product_ids: ['BTC-USD'] },
      ],
      onmessage: (data) => {
        if (data.type === 'ticker') {
          this.updateTicker(data)
        }
      },
    })
    this.ws.connect()
  }

  static updateTicker(data) {
    this.updateLastPrice(data.price)
  }

}

module.exports = Coinbase
