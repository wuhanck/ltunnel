'use strict'

const Assert = require('assert')
const {WebSocketServer} = require('ws')

const {id2buf, buf2id} = require('./idbuf')

const pongbuf = id2buf(-1, -1)

const open = (port, host, valid)=>{
	Assert(!!port)

	var ws_srv = null
	var ws = null//used for send

	var alive = 0//alive or heartbeat timeout or not ack
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

		alive = 0
		clearTimeout(t2pong)
		t2pong = null

		if (!!disconnected_cb)
			disconnected_cb()

		ws_tmp.removeAllListeners('close')
		ws_tmp.removeAllListeners('error')
		ws_tmp.removeAllListeners('message')
		ws_tmp.removeAllListeners('pong')
		ws_tmp.on('error', ()=>{})
		ws_tmp.close()
	}

	const restart_timeout = ()=>{
		if (alive > 3) {
			close_ws('alive timeout')
			return
		}

		if (alive != 0)
			ws.pong(pongbuf)

		alive += 1
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
			ws.on('message', (msg, is_bin)=>{alive = 0; on_ws_message(msg, is_bin)})
			ws.on('pong', (buf)=>{
				alive = 0
				if (!buf) {
					console.log('check! null pong')
					return
				}
				if (buf.length !== 8) {
					console.log('check! malform pong')
					return
				}
				const [op, id] = buf2id(buf)
				if (id === -1) {
					console.log('heart-beat pong')//heart-beat
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
		send: (buf, cb)=>{if (ws) ws.send(buf, cb)},
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
