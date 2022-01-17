const Position = require('../Position')
const Log = require('../../log/Log' )
const {sleep} = require('../../utils/time')

class BfPosition extends Position {
  constructor({
    broker
  }) {
    super()
    this.broker = broker
    this.intervalTime = 10000 // 何ミリ秒おきにポジションを取得するか
  }

  async posi() {
    if(this.broker.apiCall.total() >= this.broker.apiCall.totalLimit) {
      Log.error('private1 api call over - posi')
      return null
    }
    this.broker.apiCall.add('private1')
    const startTime = new Date()
    const result = await this.broker.api.getPositions(
      'FX_BTC_JPY'
    ).catch(err => {
      Log.error(`[BfPosition] GET POSITIONS ERROR: ${err.message}`)
      return null
    })
    const time = new Date() - startTime
    this.broker.apiTime.add('posi', time)
    if(result && 'data' in result) {
      return result.data
    } else {
      return null
    }
  }

  async updateByApi() {
    const positions = await this.posi()
    let totalSize = 0
    let totalPrice = 0
    let avgPrice = 0
    if (positions && positions.length > 0) {
      let side = positions[0].side
      positions.forEach(posi => {
        totalPrice += posi.price * posi.size
        totalSize += posi.size
      })
      avgPrice = parseInt(totalPrice / totalSize)
      if (side === 'SELL') {
        totalSize *= -1
      }
      this.update(totalSize, avgPrice)
    }
  }
}

module.exports = BfPosition

