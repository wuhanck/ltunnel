'use strict'

const Assert = require('assert')
const ReqParser = require('./msg.js').req_parser
const RespParser = require('./msg.js').resp_parser

var open = (chnl)=>{
	Assert(!!chnl)

	const streams = []//Save inner interface of stream.
	var stream_cb

	const close = ()=>{
		if (!chnl)
			return
		chnl = null
		streams.forEach((stream)=>{stream.close()})
	}
	const clear = ()=>{
		if (!chnl)
			return
		streams.forEach((stream)=>{stream.close()})
	}
	const process_req = (req)=>{//REQ had been decode with check. So it is valid or undefined.
		const id = req.reqStreamId;
		if (id === undefined) {
			console.log('Receive req missing id.')
			return
		}
		var stream = streams[id]
		const type = req.reqType
		if (stream === undefined) {//We may need open new stream.
			if (type === ReqParser.SYN_TYPE) {
				stream = open_stream(id)//NOTE. We may add some fitler when alloc_stream...
				if (!stream) {
					console.log(`Open stream id: ${id} failed.`)
					chnl.send(RespParser.encode_rst(id))//NOTE. Be careful about sent RST.
					return
				}
				if (!stream_cb) {//No stream_cb just close it.
					streams[id].close()//Change to inner interface.
					return
				} else {
					stream_cb(stream)
					stream = streams[id]//Change to inner interface.
				}
			} else//In design Req may contain deleted stream in Resp. Resp not contain deleted stream in Req.
				return
		}

		const content = req.reqContent
		if (content !== undefined)//Always process content regardless type.
			stream.msg(content)

		if (type === ReqParser.RST_TYPE)
			stream.close()
		else if (type === ReqParser.END_TYPE)
			stream.peer_end()
	}
	const feed_msg = (msg)=>{
		if (!chnl)
			return
		const req = ReqParser.decode(msg)
		if (!!req)//FIX ME. Maybe we should exception or do sth if unknown msg arrived.
			process_req(req)
	}
	const feed_jammed = (op, id)=>{
		const stream = streams[id]
		if (stream === undefined)
			return
		stream.jammed(op)
	}
	const open_stream = (id)=>{//On resp-side, it always called by inner, which assure chnl.
		Assert(id >= 0)

		const stream_chnl = chnl
		var close_cb
		var msg_cb
		var jammed_cb
		var peer_end_cb
		var req_end = false
		var resp_end = false

		const close = ()=>{
			if (id < 0)
				return
			const id_tmp = id
			id = -1;

			delete streams[id_tmp]
			stream_chnl.send(RespParser.encode_rst(id_tmp))
			if (!!close_cb)
				close_cb()
		}
		const check_end = ()=>{
			if (req_end && resp_end)
				close()
		}
		const on_close = (cb)=>{close_cb = cb}
		const on_msg = (cb)=>{msg_cb = cb}
		const on_jammed = (cb)=>{jammed_cb = cb}
		const on_peer_end = (cb)=>{peer_end_cb = cb}
		const msg = (buf)=>{if (!!msg_cb) msg_cb(buf)}
		const jammed = (op)=>{if (!!jammed_cb) jammed_cb(op)}
		const peer_end = ()=>{req_end = true; if (!!peer_end_cb) peer_end_cb(); check_end()}
		const send = (buf, cb)=>{if (id < 0) return; stream_chnl.send(RespParser.encode(id, buf), cb)}//If closed, usage-error, exception.
		const end = (buf)=>{
			if (id < 0)
				return
			resp_end = true
			stream_chnl.send(RespParser.encode_end(id, buf))
			check_end()
		}
		const rst = (buf)=>{
			if (id < 0)
				return
			stream_chnl.send(RespParser.encode(id, buf))//Close will send RST.
			close()
		}

		streams[id] = {
			close: close,
			msg: msg,
			jammed: jammed,
			peer_end: peer_end,
		}
		return {
			send: send,
			jammed: (op)=>{if (id < 0) return; stream_chnl.jammed(op, id)},//info remote
			end: end,
			rst: rst,
			on_close: on_close,
			on_msg: on_msg,
			on_jammed: on_jammed,
			on_peer_end: on_peer_end,
			buffered: stream_chnl.buffered,
		}
	}
	const on_stream = (cb)=>{stream_cb = cb}
	return {
		feed_msg: feed_msg,
		feed_jammed: feed_jammed,
		clear: clear,
		close: close,
		on_stream: on_stream,
	}
}

module.exports.open = open

if (require.main === module) {



}
