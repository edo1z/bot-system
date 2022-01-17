const Bot = require('./bot/Bot')
const TradeData = require('./tradeData/TradeData')
const Backtest = require('./backtest/Backtest')

const main = async() => {
  const mode = process.argv[2]
  switch(mode) {
    case 'bot':
    case 'bot-cli':
      let isTestMode = true
      const proMode = process.argv[3]
      if(proMode === 'pro') {
        isTestMode = false
      }
      const cliMode = mode === 'bot-cli' ? true : false
      const bot = new Bot({
        isTestMode,
        cliMode
      })
      bot.startStrategies()
      if(!cliMode) {
        bot.startScreen()
      }
      break
    case 'data':
      new TradeData()
      break
    case 'test':
    case 'test-graph':
      const date = process.argv[3] // latest という指定も出来る
      const startTime = process.argv[4]
      const endTime = process.argv[5]
      let graph = false
      if(mode === 'test-graph') {
        graph = true
      }
      const execStartTime = new Date()
      this.backtest = new Backtest({
        date,
        startTime,
        endTime,
        graph
      })
      await this.backtest.start()
      const execTime = new Date() - execStartTime
      console.log(`exec time: ${execTime}`)
      break
    default:
      console.error('please input mode.')
      break
  }
}

main()
