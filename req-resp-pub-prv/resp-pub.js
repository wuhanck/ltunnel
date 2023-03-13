'use strict'

const RespSvcOpen = require('../req-resp-svc/resp-svc.js').open
const WsSrvChnlOpen = require('../ws-chnl/srv-chnl.js').open

const open = (port, host, valid)=>{
	var chnl = WsSrvChnlOpen(port, host, valid)
	return RespSvcOpen(chnl)
}

module.exports.open = open

if (require.main === module) {

}
