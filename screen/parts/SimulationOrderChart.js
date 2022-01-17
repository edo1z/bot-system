// const Log = require('../../log/Log')

class SimulationOrderChart {
  constructor({
    label,
    orderList
  }) {
    this.label = label
    this.orderList = orderList
  }

  update() {
    const headers = ['SIDE', 'PRICE', 'SIZE']
    const orders = this.orderList.orders
    let data = orders.map(order => {
      const side = order.size > 0 ? 'BUY' : 'SELL'
      const price = order.price
      const size = Math.abs(order.size)
      return [side, price, size]
    })
    if (!data || data.length <= 0) {
      data = [['---', 0, 0]]
    }
    return {
      headers,
      data
    }
  }

  chartOptions() {
    return {
      keys: true
     , fg: 'green'
     , selectedFg: 'white'
     , selectedBg: 'blue'
     , interactive: false
     , label: this.label
     , width: '30%'
     , height: '30%'
     , border: {type: "line", fg: "cyan"}
     , columnSpacing: 5 //in chars
     , columnWidth: [15, 15, 15 ] /*in chars*/ 
    }
  }

}
module.exports = SimulationOrderChart
