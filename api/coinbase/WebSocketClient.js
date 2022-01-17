const BaseWebSocketClient = require('../BaseWebSocketClient')

class WebSocketClient extends BaseWebSocketClient {
  constructor(config) {
    const url = "wss://ws-feed.pro.coinbase.com/"
    super(config, url)
    this.broker = 'coinbase'
    this.type = ''
  }

  _isPongMessage(data) {
    return data.type === 'heartbeat'
  }

  sendPing() {
  }

  subscribe() {
    const message = {
      type: "subscribe",
      channels: this.subscriptions,
    };
    this.send(message);
  }

}

module.exports = WebSocketClient
