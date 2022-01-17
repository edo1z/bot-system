require("dotenv").config();
const axios = require("axios");
const signature = require("./signature");

class ApiRequest {
  constructor () {
    this.baseUrl = 'https://api.bitflyer.com'
    this.apiKey = process.env.BF_API_KEY;
  }

  async request (method, path, data) {
    const [timestamp, body, sign]
      = signature.createSign( method, path, data )
    let options = {
      url: this.baseUrl + path,
      method: method,
      data: body,
      headers: {
        'ACCESS-KEY': this.apiKey,
        'ACCESS-TIMESTAMP': timestamp,
        'ACCESS-SIGN': sign,
        'Content-Type': 'application/json',
      },
    }
    if (method === 'GET') options.params = data
    return await axios(options)
  }

  _encodeQueryData (data) {
    const ret = [];
    for (let d in data) {
      ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
    }
    return ret.join("&");
  }

}

module.exports = ApiRequest
