'use strict'

const Assert = require('assert')
const ReqRespCommonSvcOpen = require('./req-resp-common-svc.js').open

var open = (chnl)=>{
	Assert(!!chnl)

	return ReqRespCommonSvcOpen(chnl, false)
}

module.exports.open = open

if (require.main === module) {


}
