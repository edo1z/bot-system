const BaseBroker = require('../BaseBroker')
const BfWs = require('../../api/bf/WebSocketClient')
const BfExec = require('../../model/bf/Execution')

class Bf extends BaseBroker {
  constructor() {
    super({})
    this.api = null
    this.start()
  }

  initWs() {
    this.ws = new BfWs({
      publicChannels: [
        'lightning_executions_BTC_JPY',
      ],
      callbacks: {
        'lightning_executions_BTC_JPY': (msg) => {
          const executions = msg.map(exec => new BfExec(exec))
          this.updateExecution(executions)
        },
      }
    })
    this.ws.init()
  }

  updateExecution(executions) {
    // executionsの配列の最後が最新の前提（違ったら直す）
    const exec = executions[executions.length - 1]
    this.updateLastPrice(exec.price)
  }

}

module.exports = Bf
