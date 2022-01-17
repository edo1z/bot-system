class BfExecution {
  constructor({
    id,
    side,
    price,
    size,
    exec_date,
    buy_child_order_acceptance_id,
    sell_child_order_acceptance_id,
  }) {
    this.id = id
    this.side = side
    this.price = price
    this.size = size
    this.exec_date = exec_date
    this.buy_child_order_acceptance_id = buy_child_order_acceptance_id
    this.sell_child_order_acceptance_id = sell_child_order_acceptance_id
  }
}

module.exports = BfExecution
