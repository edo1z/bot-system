const ApiRequest = require("./ApiRequest");
const axios = require('axios')

class ApiClient {
  constructor () {
    this.apiRequest = new ApiRequest();
  }

  async markets() {
    const path = '/v1/markets'
    return await axios.get(baseUrl + path)
  }

  //API稼働状況取得
  async getHealth() {
    const path = '/v1/gethealth'
    const data = { product_code: 'FX_BTC_JPY' }
    return await axios.get(baseUrl + path, { params: data })
  }

  //板の稼働状況取得
  async getBoardHealth() {
    const path = '/v1/getboardstate'
    const data = { product_code: 'FX_BTC_JPY' }
    return await axios.get(baseUrl + path, { params: data })
  }

  //約定履歴の取得
  async getExecutions({
    product_code = 'FX_BTC_JPY',
    count = 300,
    before = null,
    after = null
  }) {
    const path = '/v1/getexecutions'
    let data = { product_code, count }
    if (before) data.before = before
    if (after) data.after = after
    return await axios.get(baseUrl + path, { params: data })
  }

  //板情報の取得
  async getBoard(productCode) {
    const path = '/v1/getboard'
    const data = { product_code: productCode }
    return await axios.get(baseUrl + path, { params: data })
  }

  //証拠金の状態を取得
  async getCollateral() {
    const path = '/v1/me/getcollateral'
    return await this.apiRequest.request('GET', path, null)
  }

  //証拠金の状態を取得
  async getCollateralHistory({
    count = 300,
    before = null,
    after = null
  }) {
    const path = '/v1/me/getcollateralhistory'
    let data = { count }
    if (before) data.before = before
    if (after) data.after = after
    return await this.apiRequest.request('GET', path, null)
  }
  
  //ポジション一覧の取得
  async getPositions(productCode) {
    const path = '/v1/me/getpositions'
    const data = { product_code: productCode }
    return await this.apiRequest.request('GET', path, data)
  }

  //自分の約定履歴の取得
  async getMyExecutions({
    product_code = 'FX_BTC_JPY',
    count = 300,
    before = null,
    after = null
  }) {
    const path = '/v1/me/getexecutions'
    let data = { product_code, count}
    if (before) data.before = before
    if (after) data.after = after
    return await this.apiRequest.request('GET', path, data)
  }

  //アクティブな注文一覧を取得
  async getOrders() {
    const path = '/v1/me/getchildorders'
    const data = {
      product_code: 'FX_BTC_JPY',
      child_order_state: 'ACTIVE',
    }
    return await this.apiRequest.request('GET', path, data)
  }

  // 新規注文のキャンセル
  async cancel({
    child_order_acceptance_id,
    product_code = 'FX_BTC_JPY'
  }) {
    if (!product_code) product_code = 'FX_BTC_JPY'
    const path = '/v1/me/cancelchildorder'
    const data = {
      product_code,
      child_order_acceptance_id
    }
    return await this.apiRequest.request('POST', path, data)
  }

  //全ての注文をキャンセル
  async cancelAll (product_code) {
    if (!product_code) product_code = 'FX_BTC_JPY'
    const path = '/v1/me/cancelallchildorders'
    const data = { product_code: product_code }
    return await this.apiRequest.request('POST', path, data)
  }

  //新規注文
  async order (
    type,
    side,
    price,
    size,
    expire,
    time_in_force,
    product_code,
  ) {
    if (!product_code) product_code = 'FX_BTC_JPY'
    if (!expire) expire = 43200
    if (!time_in_force) time_in_force = 'GTC'
    const path = '/v1/me/sendchildorder'
    const data = {
      product_code: product_code,
      child_order_type: type,
      side: side,
      price: price,
      size: size,
      minute_to_expire: expire,
      time_in_force: time_in_force,
    }
    return await this.apiRequest.request('POST', path, data)
  }

}

module.exports = ApiClient;
