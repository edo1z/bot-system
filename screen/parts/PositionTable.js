const Log = require('../../log/Log')

class PositionTable {
  static update(bot) {
    const headers = [
      'NO',
      'SIDE',
      'PRICE',
      'SIZE',
      'RANGE',
      'PROFIT',
    ]
    const data = bot.strategies.map(
      (strategy, idx) => {
        const size = strategy.posi().size
        const price = strategy.posi().price
        return PositionTable._update(
          price, size, idx, bot
        )
      }
    )
    return {
      headers: headers,
      data: data
    }
  }

  static _update(price, size, idx, bot) {
    if (!price) price = 0
    if (!size) size = 0
    const no = idx + 1
    let side = size > 0 ? 'BUY' : 'SELL'
    if (size === 0) side = '---'
    let priceRange = 0
    let profit = 0
    if (size != 0) {
      priceRange = size > 0
        ? bot.broker.midPrice - price
        : price - bot.broker.midPrice
      profit = Math.floor(priceRange * Math.abs(size))
    }
    size = Math.round(size * 10000) / 10000
    return [
      no,
      side,
      price,
      size,
      priceRange,
      profit
    ]
  }

  static chartOptions() {
    return {
      keys: true
     , fg: 'green'
     , selectedFg: 'white'
     , selectedBg: 'blue'
     , interactive: false
     , label: 'POSITIONS'
     , width: '30%'
     , height: '30%'
     , border: {type: "line", fg: "cyan"}
     , columnSpacing: 5 //in chars
     , columnWidth: [
       3, 5, 10, 10, 10, 7
     ] /*in chars*/
    }
  }

}

module.exports = PositionTable
