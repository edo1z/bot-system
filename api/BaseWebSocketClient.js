const moment = require('moment')
const WebSocket = require('ws')
const Log = require('../log/Log')

class BaseWebSocketClient {
  constructor(config, url) {
    this.type = null
    this.config = config
    this.url = url
    this.ws = null
    this.pongAt = null
    this.onmessageFunc = null
    this.pingInterval = null
    this.pongWaiting = false
    this.pingIntervalTime = 3000
    this.subscriptions = []
    this.active = false
  }
  init() {}
  connect() {
    if (this.ws && this.ws.readyState !== 3) {
      this.close()
    }
    this.pongAt = null
    this.active = true
    this.init()
    if (this.config) {
      if ('subscriptions' in this.config) {
        this.subscriptions = this.config.subscriptions
      }
      if ('onmessage' in this.config) {
        this.onmessageFunc = this.config.onmessage
      }
    }
    this.ws = new WebSocket(this.url)
    this.ws.onopen = () => this.onopen()
    this.ws.onclose = (e) => this.onclose(e)
    this.ws.onmessage = (e) => this.onmessage(e)
    this.ws.onerror = (err) => this.onerror(err)
  }

  close() {
    Log.log('close!')
    this.ws.close()
  }

  closeAndStop() {
    Log.log('close and stop')
    this.ws.close()
    this.active = false
  }

  onopen() {
    Log.log(this.broker + ' ' + this.type + ' ws opened')
    this.pingInterval = setInterval(() => this.ping(), this.pingIntervalTime)
    this.subscribe()
  }

  onmessage(e) {
    try {
      const data = JSON.parse(e.data)
      if (this._isPongMessage(data)) {
        this.pongAt = moment()
        this.pongWaiting = false
      } else {
        this.onmessageFunc(data)
      }
    } catch (err) {
      return
    }
  }

  onerror(err) {
    Log.log(this.broker + ' ' + this.type + ' ws error', err)
  }

  onclose(e) {
    Log.log(this.broker + ' ' + this.type + ' ws closed.', e.code)
    clearInterval(this.pingInterval)
    this.pongWaiting = false
  }

  send(data) {
    const ws = this.ws
    this.waitForSocketConnection(ws, function () {
      ws.send(JSON.stringify(data))
    })
  }

  waitForSocketConnection(ws, callback) {
    const self = this
    setTimeout(function () {
      if (ws.readyState === 1) {
        if (callback != null) {
          callback()
        }
      } else {
        Log.log('wait for connection...')
        self.waitForSocketConnection(ws, callback)
      }
    }, 5)
  }

  ping() {
    if (this.pongAt && this.active) {
      if (moment().diff(this.pongAt) > this.pingIntervalTime + 500) {
        Log.log(this.broker + ' ' + this.type + ' pong too late')
        this.close()
        this.connect()
      }
    }
    if (!this.pongWaiting) {
      this.pongWaiting = true
      this.sendPing()
    }
  }

  sendPing() {}
  _isPongMessage() {}
  subscribe() {}
}

module.exports = BaseWebSocketClient
