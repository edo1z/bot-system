const {timeDiff, hourlyWage} = require('../../utils/time')

class TradeRecordTable {
  static update(bot) {
    const headers = [
      'NO',
      'CNT',
      'PL',
      'DD',
      'TOP',
      'Down',
      'UP',
      'UDRate',
      '1DD', 
      '1TOP',
      'HOUR',
      'MIN',
      'WIN',
      'EXE',
      'AEXE'
    ]
    const min = timeDiff(bot.startTime)
    const data = bot.strategies.map(
      (strategy, idx) => {
        let executionList = null
        let orderList = null
        if(strategy.isTestMode()) {
          executionList = strategy.executionList
          orderList = strategy.orderList
          return TradeRecordTable._updateForTestMode(
            executionList,
            orderList,
            idx,
            min
          )
        } else {
          executionList = strategy.broker.executionList
          orderList = strategy.broker.orderList
          const collateral = strategy.broker.collateral
          return TradeRecordTable._updateForProMode(
            executionList,
            orderList,
            collateral,
            idx,
            min
          )
        }
      }
    )
    return {
      headers: headers,
      data: data
    }
  }

  static _updateForTestMode(
    executionList,
    orderList,
    idx,
    min
  ) {
    const profit = executionList.profit
    const _hourlyWage = hourlyWage(profit, min)
    return [
      idx + 1,
      executionList.tradeCount(),
      profit,
      executionList.maxDD,
      executionList.maxProfit,
      executionList.maxDown,
      executionList.maxUp,
      executionList.upDownRate,
      executionList.maxOneDD,
      executionList.maxOneProfit,
      _hourlyWage.toLocaleString(),
      executionList.latestProfit,
      executionList.winRate(),
      orderList.executedRate(),
      orderList.allExecutedRate()
    ]
  }

  static _updateForProMode(
    executionList,
    orderList,
    collateral,
    idx,
    min
  ) {
    const profit = collateral.diff
    const _hourlyWage = hourlyWage(profit, min)
    return [
      idx + 1,
      collateral.count,
      profit,
      collateral.maxDD,
      collateral.maxProfit,
      collateral.maxDown,
      collateral.maxUp,
      collateral.upDownRate,
      executionList.maxOneDD,
      executionList.maxOneProfit,
      _hourlyWage.toLocaleString(),
      collateral.latestProfit,
      executionList.winRate(),
      orderList.executedRate(),
      orderList.allExecutedRate()
    ]
  }

  static chartOptions = {
    keys: true
   , fg: 'green'
   , selectedFg: 'white'
   , selectedBg: 'blue'
   , interactive: false
   , label: 'TRADE RECORDS'
   , width: '30%'
   , height: '30%'
   , border: {type: "line", fg: "cyan"}
   , columnSpacing: 3 //in chars
   , columnWidth: [
     5, 5, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 5, 5
   ] /*in chars*/ 
  }

}

module.exports = TradeRecordTable
