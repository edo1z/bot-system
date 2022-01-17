const Log = require('../../log/Log')

class OrderBookTable {
  static update(bot) {
    const headers = [
      'MINE',
      'SIZE',
      'PRICE',
      'SIZE',
      'MINE',
    ]
    const orderbook = bot.broker.orderBook.orderBook
    const boardSize = bot.broker.orderBook.boardSize
    const strategy = bot.strategies[0]
    let orders = []
    if(strategy.isTestMode()) {
      orders = strategy.orderList.getOpenOrders()
    } else {
      orders = strategy.broker.orderList.getOpenOrders()
    }
    const lastPrice = bot.broker.lastPrice
    let data = []
    if(orderbook && orderbook.bids.length > 0) {
      // asks
      const asks = orderbook.asks.slice(0, boardSize).reverse()
      asks.forEach(ask => {
        const idx = orders.findIndex(order => {
          if(order.size < 0) {
            if(parseInt(order.price) === ask.price) {
              return true
            }
          }
          return false
        })
        let mySize = ''
        if (idx > -1) {
          mySize = orders[idx].size * -1
          mySize = Math.round(mySize * 1000) / 1000
          orders = orders.filter((_, i) => {
            return idx !== i
          })
        }
        const size = Math.round(ask.size * 10000) / 10000
        data.push([mySize, size, ask.price, '', ''])
      })

      // lastPrice
      data.push(['-----', '-----', '-----', '-----', '-----'])
      data.push(['', '', lastPrice, '', ''])
      data.push(['-----', '-----', '-----', '-----', '-----'])

      // bids
      const bids = orderbook.bids.slice(0, boardSize)
      bids.forEach(bid => {
        const idx = orders.findIndex(order => {
          if(order.size > 0) {
            if(parseInt(order.price) === bid.price) {
              return true
            }
          }
          return false
        })
        let mySize = ''
        if (idx > -1) {
          mySize = orders[idx].size
          mySize = Math.round(mySize * 1000) / 1000
          orders = orders.filter((_, i) => {
            return idx !== i
          })
        }
        const size = Math.round(bid.size * 10000) / 10000
        data.push(['', '', bid.price, size, mySize])
      })
    }
    return {
      headers: headers,
      data: data
    }
  }

  static chartOptions = {
    keys: true
   , fg: 'green'
   , selectedFg: 'white'
   , selectedBg: 'blue'
   , interactive: false
   , label: 'BOARD'
   , width: '30%'
   , height: '30%'
   , border: {type: "line", fg: "cyan"}
   , columnSpacing: 3 //in chars
   , columnWidth: [
     10, 10, 10, 10, 10
   ]
  }

}

module.exports = OrderBookTable
