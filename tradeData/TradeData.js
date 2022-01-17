const BfFx = require('./bf/fx')

class TradeData {
  constructor() {
    this.start()
  }

  start() {
    this.bfFx = new BfFx()
    this.bfFx.start()
  }
}

module.exports = TradeData
