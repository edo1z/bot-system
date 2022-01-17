const OrderList = require('../OrderList')
const Log = require('../../log/Log')

class BfOrderList extends OrderList {
  constructor() {
    super()
  }

  add(order) {
    order.canceled = false
    order.executed = false
    order.allExecuted = false
    this.orders.push(order)
    if (this.orders.length > this.maxLength) {
      this.orders.shift()
    }
  }

}

module.exports = BfOrderList
