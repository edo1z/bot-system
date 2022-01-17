const BfFx = require('../../brokers/bf/fx')

class SimulationExecutionHistoryTable {
  static update() {
    return []
  }

  static createData({
    fxPrice,
    price,
    spread,
    delta,
    score
  }) {
    return {
      headers: ['name', 'value'],
      data: [ 
        ['PRICE(FX)', fxPrice],
        ['PRICE(SPOT)', price],
        ['SPREAD', spread],
        ['DELTA', delta],
        ['SCORE', score]
      ]
    }
  }

  static createMsg({
    fxPrice,
    price,
    spread,
    delta,
    score
  }) {
    const msg = `PRICE(FX): \`${fxPrice}\` `
    + `PRICE(SPOT): \`${price}\` \n`
    + `SPREAD: \`${spread}\` `
    + `DELTA: \`${delta}%\` `
    + `SCORE: \`${score}%\` `
    return msg
  }

  static chartOptions = {
    keys: true
   , fg: 'green'
   , selectedFg: 'white'
   , selectedBg: 'blue'
   , interactive: false
   , label: 'SIMULATION EXECUTION HISTORY'
   , width: '30%'
   , height: '30%'
   , border: {type: "line", fg: "cyan"}
   , columnSpacing: 5 //in chars
   , columnWidth: [15, 15 ] /*in chars*/ 
  }

}

module.exports = SimulationExecutionHistoryTable
