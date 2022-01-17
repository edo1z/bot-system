class TradeRecordTable {
  static update(backtest) {
    const headers = [
      'NO',
      'COUNT',
      'PROFIT',
      'MAX DD',
      'MAX PROFIT',
      'MAX ONE DD', 
      'MAX ONE PROFIT'
    ]
    const data = backtest.strategies.map(
      (strategy, idx) => {
        let executionList = null
        if(strategy.isTestMode()) {
          executionList = strategy.executionList
        } else {
          executionList = strategy.broker.executionList
        }
        return TradeRecordTable._update(
          executionList,
          idx
        )
      }
    )
    return {
      headers: headers,
      data: data
    }
  }

  static _update(executionList, idx) {
    return [
      idx + 1,
      executionList.tradeCount(),
      executionList.profit,
      executionList.maxDD,
      executionList.maxProfit,
      executionList.maxOneDD,
      executionList.maxOneProfit
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
     3, 5, 10, 10, 10, 10, 10
   ] /*in chars*/ 
  }

}

module.exports = TradeRecordTable
