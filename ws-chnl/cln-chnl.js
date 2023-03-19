'use strict'

const Assert = require('assert')
const {WebSocket} = require('ws')

const open = (path, origin)=>{
	Assert(!!path)

	var ws = null//Flag
	var ws_chnl = null//if connected, it is ws

	var alive = true
	var t2close = null

	var msg_cb
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
		ws_tmp.close()
	}
	const close_and_restart = (err)=>{
		console.log(err)
		close()
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
	const on_connected = (cb)=>{connected_cb = cb}
	const on_disconnected = (cb)=>{disconnected_cb = cb}
	const on_error = (cb)=>{error_cb = cb}

	const start = ()=>{
		if (!!ws)
			return
		ws = new WebSocket(path, {origin: origin})
		ws.on('close', (code, reason)=>{close_and_restart(`ws-close ${code} ${reason}`)})
		ws.on('error', (err)=>{if (!!error_cb) error_cb(err); close_and_restart(`ws-error ${err}`)})
		ws.on('open', ()=>{
			ws_chnl = ws
			ws.on('message', (msg, is_bin)=>{alive = true; on_ws_message(msg, is_bin)})
			ws.on('pong', ()=>{console.log('pong.'); alive = true})
			if (!!connected_cb)
				connected_cb()
		})
		restart_timeout()
	}

	return {
		send: (buf, cb)=>{if (ws_chnl) ws_chnl.send(buf, cb)},
		start: start,
		on_msg: on_msg,
		on_connected: on_connected,
		on_disconnected: on_disconnected,
		on_error: on_error,
		connected: ()=>{return !!ws_chnl},
		close: close,
		buffered: ()=>{if (ws_chnl) return ws_chnl.bufferedAmount},
		pause: ()=>{if (ws_chnl) ws_chnl.pause()},
		resume: ()=>{if (ws_chnl) ws_chnl.resume()},
	}
}

module.exports.open = open

if (require.main === module) {

//var a = 033//Check strict mode.

}
