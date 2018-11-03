const RaftJs = require('./lib/raft-js')
module.exports = new RaftJs({config: atom.config})
