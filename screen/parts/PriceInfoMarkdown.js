require("dotenv").config();
const {xToTime, now, timeDiff, hourlyWage} = require('../../utils/time')

class PriceInfo {
  static update({bot}) {
    if (!bot || !bot.strategy) return null

    // PriceInfo1
    const fxPrice = bot.broker.lastPrice.toLocaleString()
    const price = bot.broker.bf.lastPrice.toLocaleString()
    const spread = this._localString(bot.broker.spread)
    const maxSpread = this._localString(bot.broker.maxSpread)
    const avgSpread = this._localString(bot.broker.avgSpread)
    const priceList = bot.broker.priceList
    const vola = priceList.vola
    const maxVola = priceList.maxVola
    const avgVola = priceList.avgVola
    const volumeList = bot.broker.volumeList
    const volume = volumeList.volume
    const avgVol = volumeList.avgVolume
    const maxVol = volumeList.maxVolume
    let delta = 0.0
    if (bot.broker.delta) {
      delta = (bot.broker.delta * 100).toFixed(2)
    }

    // PriceInfo2
    const strategy = bot.strategy
    const apiCall = bot.broker.apiCall
    const apiTime = bot.broker.apiTime
    const minSpread = strategy.minSpread
    const spreadRate = strategy.spreadRate
    const apiTotal = apiCall.total()
    const apiPrivate2 = apiCall.private2
    const maxApiTotal = apiCall.maxTotalCall
    const avgApiTotal = apiCall.avgTotalCall
    // api
    const orderTime = apiTime.avgTime.order / 1000
    const cancelTime = apiTime.avgTime.cancel / 1000
    const posiTime = apiTime.avgTime.posi / 1000
    const executionTime = apiTime.avgTime.execution / 1000
    // count
    const onBoardExecTime = strategy.onBoardExecTime
    const onBoardCount = strategy.onBoardCount
    // collateral
    const collateral = bot.broker.collateral
    const collateralFirstAmount = collateral.firstAmount
    const collateralAmount = collateral.amount
    const collateralDiff = collateral.diff
    const collateralUpdated = xToTime(collateral.date)
    const collateralUpdatedCount = collateral.count

    const data = this.createData({
      bot,
      strategy,

      // priceInfo1
      fxPrice,
      price,
      spread,
      maxSpread,
      avgSpread,
      delta,
      volume,
      avgVol,
      maxVol,
      vola,
      maxVola,
      avgVola,

      // priceInfo2
      apiTotal,
      apiPrivate2,
      maxApiTotal,
      avgApiTotal,
      orderTime,
      cancelTime,
      posiTime,
      executionTime,
      onBoardExecTime,
      onBoardCount,
      minSpread,
      spreadRate,

      //collateral
      collateralFirstAmount,
      collateralAmount,
      collateralDiff,
      collateralUpdated,
      collateralUpdatedCount
    })
    return data
  }

  static _localString(num) {
    if(num) {
      return num.toLocaleString()
    } else {
      return 0
    }
  }

  static createData({
    bot,
    strategy,

    // priceInfo1
    fxPrice,
    price,
    spread,
    maxSpread,
    avgSpread,
    delta,
    volume,
    avgVol,
    maxVol,
    vola,
    maxVola,
    avgVola,

    // priceInfo2
    apiTotal,
    apiPrivate2,
    maxApiTotal,
    avgApiTotal,
    orderTime,
    cancelTime,
    posiTime,
    executionTime,
    onBoardExecTime,
    onBoardCount,
    minSpread,
    spreadRate,

    //collateral
    collateralFirstAmount,
    collateralAmount,
    collateralUpdated,
  }) {
    const botName = process.env.BOT_NAME
    // priceInfo2
    const min = timeDiff(bot.startTime)
    const hour = Math.round(min / 60 * 100) / 100
    const mode = strategy.isTestMode() ? 'TEST' : 'PRO'

    let msg = ''
    msg += `${botName} ${mode} \`${minSpread}\` \`${spreadRate}\`\n\n`
    msg += `${bot.startTime}\n`
    msg += `${hour}h (${min}m)\n`
    msg += '\n# PRICE \n'
    msg += `fx: \`${fxPrice}\`\n`
    msg += `spot: \`${price}\`\n`
    msg += `delta: \`${delta}\`\n`
    msg += '\n# SPREAD \n'
    msg += `spread: \`${spread}\`\n`
    msg += `max: \`${maxSpread}\`\n`
    msg += `avg: \`${avgSpread}\`\n`
    msg += '\n# VOLA \n'
    msg += `vola: \`${vola}\`\n`
    msg += `max: \`${maxVola}\`\n`
    msg += `avg: \`${avgVola}\`\n`
    msg += '\n# VOLUME \n'
    msg += `total: \`${volume}\`\n`
    msg += `max: \`${maxVol}\`\n`
    msg += `avg: \`${avgVol}\`\n`
    msg += '\n# COUNT \n'
    msg += `onBoard: \`${onBoardCount}\`\n`
    msg += `total: \`${apiTotal}\`\n`
    msg += `order: \`${apiPrivate2}\`\n`
    msg += `max: \`${maxApiTotal}\`\n`
    msg += `avg: \`${avgApiTotal}\`\n`
    msg += '\n# TIME \n'
    msg += `onBoard: \`${onBoardExecTime}\`\n`
    msg += `order: \`${orderTime}\`\n`
    msg += `cancel: \`${cancelTime}\`\n`
    msg += `posi: \`${posiTime}\`\n`
    msg += `exec: \`${executionTime}\`\n`
    msg += '\n# COLLATERAL \n'
    msg += `first: \`${collateralFirstAmount}\`\n`
    msg += `now: \`${collateralAmount}\`\n`
    msg += `updated: \`${collateralUpdated}\`\n`
    return msg
  }

}

module.exports = PriceInfo
