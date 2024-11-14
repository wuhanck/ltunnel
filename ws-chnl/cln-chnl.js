'use strict'

const Assert = require('assert')
const {WebSocket} = require('ws')

const {id2buf, buf2id} = require('./idbuf')

const pongbuf = id2buf(-1, -1)

const open = (path, origin)=>{
	Assert(!!path)

	var ws = null//Flag
	var ws_chnl = null//if connected, it is ws
	var quitting = false

	var alive = true
	var t2close = null

	var msg_cb
	var jammed_cb
	var connected_cb
	var disconnected_cb
	var error_cb

	const close = ()=>{
		if (!ws)
			return
		const ws_tmp = ws
		ws = null
		ws_chnl = null

		alive = true
		clearTimeout(t2close)
		t2close = null

		if (!!disconnected_cb)
			disconnected_cb()

		ws_tmp.removeEventListener('open')
		ws_tmp.removeEventListener('close')
		ws_tmp.removeEventListener('error')
		ws_tmp.removeEventListener('pong')
		ws_tmp.removeEventListener('message')
		ws_tmp.on('error', ()=>{})
		ws_tmp.close()
	}
	const close_quitting = ()=>{
		quitting = true
		close()
	}
	const close_and_restart = (err)=>{
		console.log(err)
		close()
		if (!quitting)
			setTimeout(start, 5000)
	}

	const restart_timeout = ()=>{
		if (!alive) {
			close_and_restart('timeout-check')
		} else {
			alive = false
			clearTimeout(t2close)
			t2close = setTimeout(restart_timeout, 3*20*1000)//3 times of default pong
		}
	}

	const on_ws_message = (msg, is_bin)=>{
		const buf = is_bin ? msg : null
		if (!buf)//something wrong
			close_and_restart('wrong-format-msg')
		else if (!!msg_cb)
			msg_cb(buf)
	}

	const on_msg = (cb)=>{msg_cb = cb}
	const on_jammed = (cb)=>{jammed_cb = cb}
	const on_connected = (cb)=>{connected_cb = cb}
	const on_disconnected = (cb)=>{disconnected_cb = cb}
	const on_error = (cb)=>{error_cb = cb}

	const start = ()=>{
		if ((!!ws) || quitting)
			return
		try {
			ws = new WebSocket(path, {origin: origin})
		} catch (e) {
			console.log(e)
			close_and_restart(`new WebSocket ${path} failed`)
			return
		}
		ws.on('close', (code, reason)=>{close_and_restart(`ws-close ${code} ${reason}`)})
		ws.on('error', (err)=>{if (!!error_cb) error_cb(err); close_and_restart(`ws-error ${err}`)})
		ws.on('open', ()=>{
			ws_chnl = ws
			ws.on('message', (msg, is_bin)=>{alive = true; on_ws_message(msg, is_bin)})
			ws.on('pong', (buf)=>{
				alive = true
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
					ws.pong(pongbuf)
					return
				}
				if (!!jammed_cb)
					jammed_cb(op, id)
			})
			if (!!connected_cb)
				connected_cb()
		})
		restart_timeout()
	}

	return {
		send: (buf, cb)=>{if (ws_chnl) ws_chnl.send(buf, cb)},
		jammed: (op, id)=>{if (ws_chnl) ws_chnl.pong(id2buf(op, id))},
		start: start,
		on_msg: on_msg,
		on_jammed: on_jammed,
		on_connected: on_connected,
		on_disconnected: on_disconnected,
		on_error: on_error,
		connected: ()=>{return !!ws_chnl},
		close: close_quitting,
		buffered: ()=>{if (ws_chnl) return ws_chnl.bufferedAmount},
	}
}

module.exports.open = open

if (require.main === module) {

//var a = 033//Check strict mode.

}
