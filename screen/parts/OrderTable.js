// const Log = require('../../log/Log')

class OrderTable {
  static update(bot) {
    const headers = [
      'SIDE',
      'PRICE',
      'SIZE',
    ]
    const strategy = bot.strategies[0]
    if (!strategy) return null
    let orders = []
    if(strategy.isTestMode()) {
      orders = strategy.orderList.getOpenOrders()
    } else {
      orders = strategy.broker.orderList.getOpenOrders()
    }
    const data = orders.map(order => {
      let side = order.size > 0 ? 'BUY' : 'SELL'
      let size = Math.abs(order.size)
      size = Math.round(size * 1000) / 1000
      return [
        side,
        parseInt(order.price),
        size
      ]
    })
    return {
      headers: headers,
      data: data
    }
  }

  static chartOptions() {
    return {
      keys: true
     , fg: 'green'
     , selectedFg: 'white'
     , selectedBg: 'blue'
     , interactive: false
     , label: 'ORDERS'
     , width: '30%'
     , height: '30%'
     , border: {type: "line", fg: "cyan"}
     , columnSpacing: 5 //in chars
     , columnWidth: [
       5, 10, 10 
     ] /*in chars*/ 
    }
  }
}
module.exports = OrderTable
