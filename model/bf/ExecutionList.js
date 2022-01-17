const ExecutionList = require('../ExecutionList')
const Log = require('../../log/Log')
const {bfTimeToJpX} = require('../../utils/time')

class BfExecutionList extends ExecutionList{
  constructor({
    broker
  }) {
    super()
    this.broker = broker
  }

  update(executions) {
    const orderList = this.broker.orderList
    const orders = orderList.orders
    executions.forEach(exec => {
      const executedOrder = orders.find(order => {
        if(exec.buy_child_order_acceptance_id === order.id) {
          return true
        } else if (exec.sell_child_order_acceptance_id === order.id) {
          return true
        }
      })
      if(executedOrder) {
        executedOrder.executed = true
        let size = exec.size
        if(executedOrder.size < 0) {
          size *= -1
        }
        this.add({
          price: exec.price,
          size,
          date: bfTimeToJpX(exec.exec_date, null, false)
        })
        executedOrder.size -= size
        if(executedOrder.size === 0) {
          executedOrder.allExecuted = true
        }
      }
    })
  }
}

module.exports = BfExecutionList
