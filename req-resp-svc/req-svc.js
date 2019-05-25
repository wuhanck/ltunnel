'use strict'

const Assert = require('assert')
const ReqRespCommonSvcOpen = require('./req-resp-common-svc.js').open

var open = (chnl, max_streams)=>{
	Assert(!!chnl)
	Assert(max_streams > 0)

	return ReqRespCommonSvcOpen(chnl, true, max_streams)
}

module.exports.open = open

if (require.main === module) {


}
