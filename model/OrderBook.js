class OrderBook {
  constructor(orderBook) {
    this.orderBook = null
    this.boardSize = 20 
    this.midPrice = 0
    this.init(orderBook)
  }

  init(orderBook) {
    this.orderBook = null
    if(!orderBook) return
    this.midPrice = orderBook.mid_price
    orderBook.bids = orderBook.bids.slice(0, this.boardSize * 2)
    orderBook.asks = orderBook.asks.slice(0, this.boardSize * 2)
    this.orderBook = orderBook
  }

  update(data) {
    if (!this.orderBook) return
    this.midPrice = data.mid_price
    let newBids = data.bids
    let newAsks = data.asks

    let updatedBids = this.orderBook.bids.map(bid => {
      if (bid.price >= this.midPrice) bid.size = 0
      newBids = newBids.filter(newBid => {
        if (newBid.price !== bid.price) {
          return true
        } else {
          bid.size = newBid.size
          return false
        }
      })
      return bid
    })
    updatedBids = updatedBids.filter(bid => bid.size > 0)
    newBids.forEach(newBid => {
      updatedBids.push(newBid)
    })
    updatedBids = updatedBids.slice(0, this.boardSize * 2)
    updatedBids = this._sortBids(updatedBids)

    let updatedAsks = this.orderBook.asks.map(ask => {
      if (ask.price <= this.midPrice) ask.size = 0
      newAsks = newAsks.filter(newAsk => {
        if (newAsk.price !== ask.price) {
          return true
        } else {
          ask.size = newAsk.size
          return false
        }
      })
      return ask
    })
    updatedAsks = updatedAsks.filter(ask => ask.size > 0)
    newAsks.forEach(newAsk => {
      updatedAsks.push(newAsk)
    })
    updatedAsks = updatedAsks.slice(0, this.boardSize * 2)
    updatedAsks = this._sortAsks(updatedAsks)

    this.orderBook = {
      bids: updatedBids,
      asks: updatedAsks,
      mid_price: this.midPrice
    }
  }

  _sortBids(bids) {
    return bids.sort((a, b) => b.price - a.price)
  }
  _sortAsks(asks) {
    return asks.sort((a, b) => a.price - b.price)
  }

  bestBid() {
    if (!this.orderBook || this.orderBook.bids.length <= 0) {
      return 0
    } 
    return this.orderBook.bids[0].price
  }

  bestAsk() {
    if (!this.orderBook || this.orderBook.asks.length <= 0) {
      return 0
    } 
    return this.orderBook.asks[0].price
  }

  bestBidSize() {
    if (!this.orderBook || this.orderBook.bids.length <= 0) {
      return 0
    } 
    return this.orderBook.bids[0].size
  }

  bestAskSize() {
    if (!this.orderBook || this.orderBook.asks.length <= 0) {
      return 0
    } 
    return this.orderBook.asks[0].size
  }

  volumeFromBestPrice(priceRangeStart = 0, priceRangeEnd = 1000) {
    if (
      !this.orderBook
      || this.orderBook.asks.length <= 0
      || this.orderBook.bids.length <= 0
    ) {
      return null
    } 
    const askStartPrice = this.bestAsk() + priceRangeStart
    const askEndPrice = this.bestAsk() + priceRangeEnd
    const bidStartPrice = this.bestBid() - priceRangeStart
    const bidEndPrice = this.bestBid() - priceRangeEnd
    let askSize = 0
    let bidSize = 0
    for(const ask of this.orderBook.asks) {
      if(askStartPrice > ask.price) continue
      if(askEndPrice < ask.price) break
      askSize += ask.size
    }
    for(const bid of this.orderBook.bids) {
      if(bidStartPrice < bid.price) continue
      if(bidEndPrice > bid.price) break
      bidSize += bid.size
    }
    return {
      ask: Math.round(askSize * 10000) / 10000,
      bid: Math.round(bidSize * 10000) / 10000
    }
  }

  afterPriceRange(size) {
    if(!this.orderBook) {
      return { ask: 0, bid:0 }
    }
    let askSize = 0
    let bidSize = 0
    const bestAsk = this.bestAsk()
    const bestBid = this.bestBid() 
    let askPrice = bestAsk
    let bidPrice = bestBid
    for(const ask of this.orderBook.asks) {
      askSize += ask.size
      if(size < askSize) break
      askPrice = ask.price
    }
    for(const bid of this.orderBook.bids) {
      bidSize += bid.size
      if(size < bidSize) break
      bidPrice = bid.price
    }
    return {
      ask: askPrice - bestAsk,
      bid: bestBid - bidPrice
    }

  }

  strongBoardPrice({
    side,
    limitPrice,
    minSize, 
    maxPriceRange = 5000
  }) {
    if(side === 'BUY') {
      for(const bid of this.orderBook.bids) {
        if(limitPrice < bid.price) continue
        if(this.midPrice - bid.price >= maxPriceRange) break
        if(bid.size >= minSize) {
          return bid.price
        }
      }
      return limitPrice - maxPriceRange
    } else {
      for(const ask of this.orderBook.asks) {
        if(limitPrice > ask.price) continue
        if(ask.price - this.midPrice >= maxPriceRange) break
        if(ask.size >= minSize) {
          return ask.price
        }
      }
      return limitPrice + maxPriceRange
    }
  }

}

module.exports = OrderBook
