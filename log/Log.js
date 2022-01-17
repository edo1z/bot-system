class Log {
  static logScreen = null
  static ererorScreen = null
  static isCliMode = false
  static bot =  null

  static log(msg) {
    if (this.isCliMode) {
      console.log(msg)
    } else if(Log.logScreen) {
      msg = JSON.stringify(msg)
      if (msg === undefined) {
        msg = 'undefined'
      }
      Log.logScreen.log(msg)
    } else {
      console.log(msg)
    }
  }

  static error(msg) {
    if (this.isCliMode) {
      console.error(msg)
    } else if(Log.ererorScreen) {
      msg = JSON.stringify(msg)
      if (msg === undefined) {
        msg = 'undefined'
      }
      Log.ererorScreen.log(msg)
    } else {
      console.error(msg)
    }
  }

  static logOptions = {
    fg: 'green',
    selectedFg: 'blue',
    label: 'LOG'
  }

  static errorOptions = {
    fg: 'red',
    selectedFg: 'blue',
    label: 'ERROR'
  }
}

module.exports = Log
