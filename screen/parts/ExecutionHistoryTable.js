const Log = require('../../log/Log')
const {xToTime} = require('../../utils/time')

class ExecutionHistoryTable {
  static update(strategy) {
    const headers = [
      'NO',
      'DATE',
      'SIDE',
      'SIZE',
      'IN',
      'OUT',
      'RANGE',
      'PL',
      'TOTAL PL'
    ]
    let executionList = []
    if(strategy.isTestMode()) {
      executionList = strategy.executionList.executions
    } else {
      executionList = strategy.broker.executionList.executions
    }
    let data = []
    for(let i = executionList.length - 1; i >= 0; i--) {
      const exec = executionList[i]
      const size = Math.round(exec.size * 100000000) / 100000000
      const priceRange = Math.round(exec.priceRange)
      data.push([
        i + 1,
        xToTime(exec.closeDate),
        exec.side,
        size,
        exec.inPrice,
        exec.outPrice,
        priceRange,
        exec.profit,
        exec.totalProfit
      ])
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
   , label: 'EXECUTION HISTORY'
   , width: '30%'
   , height: '30%'
   , border: {type: "line", fg: "cyan"}
   , columnSpacing: 5 //in chars
   , columnWidth: [
     5, 10, 5, 10, 7, 7, 6, 6, 10
   ] /*in chars*/
  }

}

module.exports = ExecutionHistoryTable
