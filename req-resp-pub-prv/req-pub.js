'use strict'

const ReqSvcOpen = require('../req-resp-svc/req-svc.js').open
const WsSrvChnlOpen = require('../ws-chnl/srv-chnl.js').open

const open = (port, host, max_streams)=>{
    var chnl = WsSrvChnlOpen(port, host)
    return ReqSvcOpen(chnl, max_streams)
}

module.exports.open = open

if (require.main === module) {
}
