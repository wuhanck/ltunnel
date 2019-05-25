'use strict'

const RespSvcOpen = require('../req-resp-svc/resp-svc.js').open
const WsClnChnlOpen = require('../ws-chnl/cln-chnl.js').open

const open = (path)=>{
    var chnl = WsClnChnlOpen(path)
    return RespSvcOpen(chnl)
}

module.exports.open = open

if (require.main === module) {

}
