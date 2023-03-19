'use strict'

const Assert = require('assert')
const ReqParser = require('./msg.js').req_parser
const RespParser = require('./msg.js').resp_parser
const BitSet = require('fast-bitset')

const open = (chnl, max_streams)=>{
	Assert(!!chnl)
	Assert(max_streams > 0)

	const streams = []//Save inner interface of stream.
	const streams_bitmap = new BitSet(max_streams)

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
	const process_resp = (resp)=>{//RESP had been decode with check. So it is valid or undefined.
		const id = resp.respStreamId;
		if (id === undefined) {
			console.log('Receive resp missing id.')
			return
		}
		const stream = streams[id]
		if (stream === undefined) {
			console.log(`Receive resp unknown id: ${id}.`)
			return
		}

		const content = resp.respContent
		if (content !== undefined)//Always process content regardless type.
			stream.msg(content)

		const type = resp.respType
		if (type === RespParser.RST_TYPE)
			stream.close()
		else if (type === RespParser.END_TYPE)
			stream.peer_end()
	}
	const feed_msg = (msg)=>{
		if (!chnl)
			return
		const resp = RespParser.decode(msg)
		if (!!resp)//FIX ME. Maybe we need do sth.
			process_resp(resp)
	}
	const feed_jammed = (op, id)=>{
		const stream = streams[id]
		if (stream === undefined)
			return
		stream.jammed(op)
	}
	const open_stream = ()=>{
		if (!chnl)
			return null

		const stream_chnl = chnl
		var close_cb
		var msg_cb
		var jammed_cb
		var peer_end_cb
		var id = streams_bitmap.ffz()//Flag.
		if (id < 0)//NOTE. Maybe some LOG.
			return null

		const close = ()=>{
			if (id < 0)
				return
			const id_tmp = id
			id = -1

			streams_bitmap.unset(id_tmp)
			delete streams[id_tmp]
			if (!!close_cb)
				close_cb()
		}
		const on_close = (cb)=>{close_cb = cb}
		const on_msg = (cb)=>{msg_cb = cb}
		const on_jammed = (cb)=>{jammed_cb = cb}
		const on_peer_end = (cb)=>{peer_end_cb = cb}
		const msg = (buf)=>{if (!!msg_cb) msg_cb(buf)}
		const jammed = (op)=>{if (!!jammed_cb) jammed_cb(op)}
		const peer_end = ()=>{if (!!peer_end_cb) peer_end_cb()}
		const send = (buf, cb)=>{if (id < 0) return; stream_chnl.send(ReqParser.encode(id, buf), cb)}
		const end = (buf)=>{if (id < 0) return; stream_chnl.send(ReqParser.encode_end(id, buf))}
		const rst = (buf)=>{if (id < 0) return; stream_chnl.send(ReqParser.encode_rst(id, buf))}

		streams_bitmap.set(id)
		streams[id] = {
			close: close,
			msg: msg,
			jammed: jammed,
			peer_end: peer_end,
		}
		stream_chnl.send(ReqParser.encode_syn(id));
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
	return {
		feed_msg: feed_msg,
		feed_jammed: feed_jammed,
		clear: clear,
		close: close,
		open_stream: open_stream,
	}
}

module.exports.open = open

if (require.main === module) {



}
