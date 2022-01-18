const Strategy = require('./strategies/bf/Strategy1')

const strategies = [
  new Strategy({
    minSpread: 500,
  }),
  new Strategy({
    minSpread: 750,
  }),
  new Strategy({
    minSpread: 1250,
  }),
]

module.exports = strategies
