// const moment = require('moment')
const moment = require('moment-timezone')
const dateFormat = 'YYYY-MM-DD HH:mm:ss'
const timezone = 'Asia/Tokyo'

const defaultFormat = (timeStr, format = null) => {
  return moment(timeStr, format).format(dateFormat)
}

const sleep = msec => {
  return new Promise(
    resolve => setTimeout(resolve, msec)
  )
}

const now = () => {
  return moment().format(dateFormat)
}

const nowx = () => {
  return moment().format('x')
}

const nowdate = () => {
  return moment().format('YYYY-MM-DD')
}

const nowTime = () => {
  return moment().format('HH:mm:ss')
}

const yesterday = () => {
  return moment().subtract(1, 'days').format('YYYY-MM-DD')
}

const add = (datetime = null, add, unit = 'minutes') => {
  if(datetime) {
    return moment(datetime, dateFormat).add(add, unit).format(dateFormat)
  } else {
    return moment().add(add, unit).format(dateFormat)
  }
}

const subtract = (datetime = null, minus, unit = 'minutes') => {
  if(datetime) {
    return moment(datetime, dateFormat).subtract(minus, unit).format(dateFormat)
  } else {
    return moment().subtract(minus, unit).format(dateFormat)
  }
}

// unit:
//   years, months, weeks, days,
//   hours, minutes, seconds
const timeDiff = (
  start,
  end = null,
  unit = 'minutes'
) => {
  start = moment(start, dateFormat)
  if (end) {
    end = moment(end, dateFormat)
  } else {
    end = moment()
  }
  // end > start ならプラスになる
  let diff = end.diff(start, unit, true)
  return Math.round(diff * 10) / 10
}

// start, endは文字列(dateFormat)でもOK
const between = (start, end) => {
  const now = moment()
  if(now.isBefore(start)) return false
  if(now.isAfter(end)) return false
  return true
}

const betweenTime = (startTime, endTime) => {
  const nowDate = moment().format('YYYY-MM-DD') 
  const start = moment(`${nowDate} ${startTime}`, dateFormat)
  const end = moment(`${nowDate} ${endTime}`, dateFormat)
  return between(start, end)
}

const hourlyWage = (price, minutes) => {
  return Math.round(price / minutes * 60)
}

const xToDatetime = (x) => {
  return moment(x, 'x').format(dateFormat)
}

const xToTime = (x) => {
  return moment(x, 'x').format('HH:mm:ss')
}

const datetimeToX = datetime => {
  return moment(datetime, dateFormat).format('x')
}

const datetimeTo = (datetime, format = 'HH:mm:ss') => {
  return moment(datetime, dateFormat).format(format)
}

const bfTimeToJpX = (datetime, format = null, addZ = true) => {
  if (addZ) datetime += 'Z'
  return moment(datetime, format).tz(timezone).format('x')
}

exports.defaultFormat = defaultFormat
exports.sleep = sleep
exports.now = now
exports.nowx = nowx
exports.nowdate = nowdate
exports.yesterday = yesterday
exports.add = add
exports.subtract = subtract
exports.timeDiff = timeDiff
exports.between = between
exports.betweenTime = betweenTime
exports.hourlyWage = hourlyWage
exports.xToDatetime = xToDatetime
exports.xToTime = xToTime
exports.datetimeToX = datetimeToX
exports.datetimeTo = datetimeTo
exports.bfTimeToJpX = bfTimeToJpX
