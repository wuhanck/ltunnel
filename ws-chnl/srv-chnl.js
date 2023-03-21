'use strict'

const Assert = require('assert')
const {WebSocketServer} = require('ws')

const {id2buf, buf2id} = require('./idbuf')

const open = (port, host, valid)=>{
	Assert(!!port)

	var ws_srv = null
	var ws = null//used for send

	const pongbuf = id2buf(-1, -1)
	var alive = true
	var t2pong = null

	var msg_cb
	var jammed_cb
	var connected_cb
	var disconnected_cb
	var error_cb

	const close = ()=>{
		if (!ws_srv)
			return
		const ws_srv_tmp = ws_srv
		ws_srv = null

		close_ws('ws-srv-close')

		ws_srv_tmp.close()
	}
	const close_ws = (err)=>{
		console.log(err)
		if (!ws)
			return
		const ws_tmp = ws
		ws = null

		alive = true
		clearTimeout(t2pong)
		t2pong = null

		if (!!disconnected_cb)
			disconnected_cb()

		ws_tmp.removeEventListener('close')
		ws_tmp.removeEventListener('error')
		ws_tmp.removeEventListener('message')
		ws_tmp.removeEventListener('pong')
		ws_tmp.close()
	}

	const restart_timeout = ()=>{
		if (!alive) {
			ws.pong(pongbuf)
			ws.ping()//for old version. FIX ME
		}

		alive = false
		clearTimeout(t2pong)
		t2pong = setTimeout(restart_timeout, 1*20*1000)
	}

	const on_ws_message = (msg, is_bin)=>{
		const buf = is_bin ? msg : null
		if (!buf)//something wrong
			close_ws('wrong-format-msg')
		else if (!!msg_cb)
			msg_cb(buf)
	}

	const on_msg = (cb)=>{msg_cb = cb}
	const on_jammed = (cb)=>{jammed_cb = cb}
	const on_connected = (cb)=>{connected_cb = cb}
	const on_disconnected = (cb)=>{disconnected_cb = cb}
	const on_error = (cb)=>{error_cb = cb}

	const start = ()=>{
		if (!!ws_srv)
			return
		ws_srv = new WebSocketServer({port: port, host: host, verifyClient: info=>valid(info.origin)})
		ws_srv.on('connection', (in_ws, request)=>{
			close_ws('new-ws')//drop the old ws
			ws = in_ws
			restart_timeout()
			ws.on('close', (code, reason)=>{close_ws(`ws-close ${code} ${reason}`)})
			ws.on('error', (err)=>{if (!!error_cb) error_cb(err); close_ws(`ws-error ${err}`)})
			ws.on('message', on_ws_message)
			ws.on('pong', (buf)=>{
				if (!buf)
					return
				if (buf.length !== 8)
					return
				const [op, id] = buf2id(buf)
				if (id === -1) {
					console.log('pong')//heart-beat
					return
				}
				if (!!jammed_cb)
					jammed_cb(op, id)
			})
			if (!!connected_cb)
				connected_cb()
		})
	}

	return {
		send: (buf, cb)=>{if (ws) {alive = true; ws.send(buf, cb)}},
		jammed: (op, id)=>{if (ws) ws.pong(id2buf(op, id))},
		start: start,
		on_msg: on_msg,
		on_jammed: on_jammed,
		on_connected: on_connected,
		on_disconnected: on_disconnected,
		on_error: on_error,
		connected: ()=>{return !!ws},
		close: close,
		buffered: ()=>{if (ws) return ws.bufferedAmount},
	}
}

module.exports.open = open

if (require.main === module) {

//var a = 033//Check strict mode.

}
