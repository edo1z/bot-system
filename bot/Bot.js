const Screen = require('../screen/Screen')
const strategies = require('../strategies')
const Log = require('../log/Log')
const {now} = require('../utils/time')

// Brokers
const BfFx = require('../brokers/bf/fx')
const Bf = require('../brokers/bf')

class Bot {
  constructor({
    isTestMode,
    cliMode
  }) {
    this.isTestMode = isTestMode
    this.isCliMode = cliMode
    this.startTime = now()
    Log.bot = this
    this.strategies = this.setStrategies()
    this.strategy = this.strategies[0]
    if(cliMode) Log.isCliMode = true
    this.initBrokers()
  }

  setStrategies() {
    if (!this.isTestMode) {
      return [strategies[0]]
    } else {
      return strategies
    }
  }

  initBrokers() {
    this.broker = new BfFx({
      bot: this,
      bf: new Bf(),
      isTestMode: this.isTestMode,
      isCliMode: this.isCliMode
    })
  }

  startStrategies() {
    this.strategies.forEach(strategy => {
      strategy.bot = this
      strategy.broker = this.broker
      strategy.testMode = this.isTestMode
    })
  }

  startScreen() {
    if (!this.isCliMode) {
      this.screen = new Screen(this)
    }
  }

  stopAll() {
    this.strategies.forEach(strategy => {
      strategy.stop = true
    })
  }

}

module.exports = Bot
