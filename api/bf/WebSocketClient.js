const io = require('socket.io-client')
const Log = require('../../log/Log')

class WebSocketClient {
  constructor(config) {
    this.url = "https://io.lightstream.bitflyer.com" 
    this.broker = 'bitflyer'
    this.active = false
    this.publicChannels = config.publicChannels
    this.callbacks = config.callbacks
    this.socket = io(this.url, {
      transports: ['websocket'],
      timeout: 1000
    })
  }

  init() {
    this.socket.on('error', (err) => {this.onError(err)})
    this.socket.on('connect', () => {this.onConnect()}) 
    this.socket.on('disconnect', (reason) => {
      this.onDisConnect(reason)
    }) 
    this.socket.on('reconnect_attempt', () => {this.onReConnectAttempt()}) 
    this.socket.on('reconnect', () => {this.onReConnect}) 
    this.socket.on('connect_error', () => {this.onConnectError}) 
    this.subscribe()
  }

  connect() {
    this.active = true
    this.socket.connect()
  }

  close() {
    Log.log('BF close')
    this.socket.disconnect()
  }

  closeAndStop() {
    Log.log('BF close and stop')
    this.socket.disconnect()
    this.active = false
  }

  onError(err) {
    Log.log(err.message)
  }

  onConnect() {
    Log.log('BF connected')
    for (const ch of this.publicChannels) {
      this.socket.emit('subscribe', ch, err => {
        if(err) {
          console.error(ch, `BF subscribe error:`, err.message)
          return
        }
        Log.log('BF subscribed')
      })
    }
  }

  onDisConnect(reason) {
    Log.log('BF disconnected', reason)
    if (this.active) {
      this.tryReconnect()
    }
  }

  onReConnectAttempt() {
    Log.log('BF reconnect attempt')
  }

  onReConnect() {
    Log.log('BF reconnectted')
  }

  onConnectError = (err) => {
    Log.log('BF connect error', err)
  }

  tryReconnect() {
    Log.log('BF try reconnect')
    setTimeout(() => {
      this.socket.connect((err) => {
        if (err) {
          this.tryReconnect();
        }
      });
    }, 2000);
  }

  subscribe() {
    for (const ch of this.publicChannels) {
      this.socket.on(ch, msg => {
        this.callbacks[ch](msg)
      })
    }
  }
}

module.exports = WebSocketClient
