'use strict'

const ReqOpen = require('../req-resp-proto/req.js').open
const RespOpen = require('../req-resp-proto/resp.js').open

//chnl interfaces:
//chnl.send(buff)//send Buffer. Used by req or resp.
//chnl.connected()//whether chnl is connected.
//chnl.close().
//chnl.start().
//chnl.on_msg(cb)//msg comming, will call cb.

var open = (chnl, is_req, max_streams)=>{
	if (is_req)
		var req_resp = ReqOpen(chnl, max_streams)
	else
		var req_resp = RespOpen(chnl)
	var connected_cbs = []//Repeated connect callback.
	var disconnected_cbs = []//Repeated disconnect callback.

	const close = ()=>{
		if (!req_resp)
			return
		const req_resp_tmp = req_resp
		req_resp = null

		req_resp_tmp.close()
		chnl.close()
	}
	const on_connected = (cb)=>{
		connected_cbs.push(cb)
		if (chnl.connected())
			cb()
	}
	const on_disconnected = (cb)=>{
		disconnected_cbs.push(cb)
		if (!chnl.connected())
			cb()
	}
	const start = ()=>{chnl.start()}

	chnl.on_msg((msg)=>{
		if (!!req_resp)
			req_resp.feed_msg(msg)
	})
	chnl.on_connected(()=>{connected_cbs.forEach((cb)=>{cb()})})
	chnl.on_disconnected(()=>{
		if (!!req_resp)
			req_resp.clear()
		disconnected_cbs.forEach((cb)=>{cb()})
	})
	if (is_req)
		return {
			open_stream: ()=>{if (!!req_resp && chnl.connected()) return req_resp.open_stream()},
			on_connected: on_connected,
			on_disconnected: on_disconnected,
			start: start,
			close: close,
		}
	else
		return {
			on_stream: (cb)=>{if (!!req_resp) req_resp.on_stream(cb)},
			on_connected: on_connected,
			on_disconnected: on_disconnected,
			start: start,
			close: close,
		}
}

module.exports.open = open

if (require.main === module) {


}
