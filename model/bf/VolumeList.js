const VolumeList = require('../VolumeList')

class BfVolumeList extends VolumeList {
  constructor({
    broker
  }) {
    super({broker})
  }

  add(executions) {
    executions.forEach(exec => {
      let size = exec.size
      if (exec.side === 'SELL') {
        size *= -1
      }
      super.add(size)
    })
  }

}

module.exports = BfVolumeList
