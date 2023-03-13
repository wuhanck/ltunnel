'use strict'

const ReqSvcOpen = require('../req-resp-svc/req-svc.js').open
const WsClnChnlOpen = require('../ws-chnl/cln-chnl.js').open

const open = (path, origin, max_streams)=>{
	var chnl = WsClnChnlOpen(path, origin)
	return ReqSvcOpen(chnl, max_streams)
}

module.exports.open = open

if (require.main === module) {
}
