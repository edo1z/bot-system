require("dotenv").config();
const crypto = require("crypto");
const secret = process.env.BF_SECRET;

function createSign(method, path, data) {
  const timestamp = Date.now().toString()
  const body = method === 'POST' ? JSON.stringify(data) : ''
  if (method === 'GET' && data) {
    path = path + '?' + _encodeQueryData(data)
  }
  const text = timestamp + method + path + body
  const sign = crypto
    .createHmac('sha256', secret)
    .update(text)
    .digest('hex')
  return [timestamp, body, sign]
}

function _encodeQueryData(data) {
  const ret = []
  for (let d in data)
    ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]))
  return ret.join('&')
}

exports.createSign = createSign;
