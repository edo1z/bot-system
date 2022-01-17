const BaseWebSocketClient = require('../BaseWebSocketClient')

class WebSocketClient extends BaseWebSocketClient {
  constructor(config) {
    const baseUrl = "wss://stream.binance.com:9443/"
    const url = baseUrl + `ws/${config.streamName}`
    super(config, url)
    this.broker = "binance"
    this.type = ''
  }

  _isPongMessage(data) {
    return data.type === 'heartbeat'
  }

  sendPing() {
  }

  subscribe() {
    const message = {
      "method": "SUBSCRIBE",
      "params": this.subscriptions,
      "id": 1 // とりあえず固定
    };
    this.send(message);
  }
}

module.exports = WebSocketClient
