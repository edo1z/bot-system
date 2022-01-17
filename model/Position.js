const Log = require('../log/Log')

class Position {
  constructor() {
    // sellはminus
    this.size = 0.0
    this.price = 0
  }

  update(size, avgPrice) {
    this.size = size
    this.price = avgPrice
  }
}

module.exports = Position

