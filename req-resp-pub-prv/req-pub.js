'use strict'

const ReqSvcOpen = require('../req-resp-svc/req-svc.js').open
const WsSrvChnlOpen = require('../ws-chnl/srv-chnl.js').open

const open = (port, host, max_streams, valid)=>{
    var chnl = WsSrvChnlOpen(port, host, valid)
    return ReqSvcOpen(chnl, max_streams)
}

module.exports.open = open

if (require.main === module) {
}
