const Strategy = require('./strategies/bf/Strategy1')

const strategies = [
  new Strategy({
    minSpread: 1500,
  }),
  new Strategy({
    minSpread: 2000,
  }),
  new Strategy({
    minSpread: 750,
  }),
]

module.exports = strategies
