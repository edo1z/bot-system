const {v4: uuidv4} = require('uuid')
const Log = require('../log/Log')

class OrderList {
  constructor() {
    // [{id, size, price}, ...]
    this.orders = []
    this.maxLength = 300
  }

  add(order) {
    order.canceled = false
    order.executed = false
    order.allExecuted = false
    order.id = uuidv4()
    this.orders.push(order)
    if (this.orders.length > this.maxLength) {
      this.orders.shift()
    }
  }

  cancel(orderId) {
    const order = this.orders.find(order => order.id === orderId)
    order.canceled = true
  }

  cancelAll() {
    this.orders = this.orders.map(order => {
      order.canceled = true
      return order
    })
  }

  getOpenOrders() {
    return this.orders.filter(order => {
      if(order.size === 0) return false
      if(order.canceled) return false
      if(order.allExecuted) return false
      return true
    })
  }

  executedRate() {
    const length = this.orders.length
    const executed = this.orders.filter(order => order.executed)
    if(length <= 0 || executed.length <= 0) {
      return 0
    }
    const rate = executed.length / length
    return Math.round(rate * 100) / 100
  }

  allExecutedRate() {
    const length = this.orders.length
    const executed = this.orders.filter(order => order.allExecuted)
    if(length <= 0 || executed.length <= 0) {
      return 0
    }
    const rate = executed.length / length
    return Math.round(rate * 100) / 100
  }

}

module.exports = OrderList
