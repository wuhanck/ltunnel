'use strict'

const Assert = require('assert')
const WebSocketClient = require('websocket').client
//FIX ME!!!
//PATH should present service which is entrance for many cln-chnls.
//We just simplified for test.
//Future will be (path, tunnel-id?)

const open = (path, origin)=>{
	Assert(!!path)

	var ws_cln = new WebSocketClient()//Flag.
	var ws//Flag used connection.
	var ws_chnl//Used for send. Most time, equal to ws.
	var alive = true
	var t2close = null//FIX ME. Wait for websocketclient's impl of timeout.
	var msg_cb
	var connected_cb
	var disconnected_cb
	var error_cb

	const close = ()=>{
		if (!ws_cln)
			return
		var ws_cln_tmp = ws_cln
		ws_cln = null

		ws_cln_tmp.abort()//Only effective when connecting.
		close_ws(true, false)
	}
	const close_ws = (do_close, do_drop)=>{//Don't check ws_cln for it may be called by close.
		if (!ws)
			return
		var ws_tmp = ws
		ws = null

		alive = true
		clearTimeout(t2close)
		t2close = null
		if (!!disconnected_cb)
			disconnected_cb()

		if (do_close)
			ws_tmp.close()//may cause on-close-event of ws.
		if (do_drop)
			ws_tmp.drop()
	}
	const on_ws_close = ()=>{
		console.log('on-ws-close.')
		close_ws(false, false)

		//NOTE. This is the place when ws closed.
		restart()
	}
	const on_ws_message = (msg)=>{
		var buf = !msg.binaryData ? null : msg.binaryData
		if (!buf)//Something wrong. Drop websocket.
			close_ws(false, true)
		else if (!!msg_cb)
			msg_cb(buf)
	}
	const on_timeout_close = ()=>{
		console.log('on-timeout-close.')
		close_ws(false, true)
	}
	const on_msg = (cb)=>{msg_cb = cb}
	const on_connected = (cb)=>{connected_cb = cb}
	const on_disconnected = (cb)=>{disconnected_cb = cb}
	const on_error = (cb)=>{error_cb = cb}
	const start = ()=>{
		if (!ws_cln)
			return
		ws_cln.connect(path, undefined, origin)
	}
	const restart = ()=>{
		if (!ws_cln)
			return
		setTimeout(start, 5000)
	}
	const restart_timeout = ()=>{
		if (!alive) {
			on_timeout_close()
		} else {
			alive = false
			clearTimeout(t2close)
			t2close = setTimeout(restart_timeout, 2*20*1000)//2 times of default ping interv
		}
	}

	ws_cln.on('connectFailed', (err)=>{if (!!error_cb) error_cb(err); restart()})
	ws_cln.on('connect', (in_ws)=>{
		Assert(!ws)
		ws_chnl = in_ws
		ws = in_ws
		restart_timeout()
		ws.on('close', ()=>{console.log('close.'); on_ws_close()})//WebSocketClient at most have one ws. So it is safe.
		ws.on('error', (err)=>{console.log('error.'); if (!!error_cb) error_cb(err)})//Socket-error. It may emitted close soon.
		ws.on('message', (msg)=>{alive = true; on_ws_message(msg)})
		ws.on('ping', ()=>{console.log('ping.'); alive = true})
		if (!!connected_cb)
			connected_cb()
	})
	return {
		send: (buf)=>{ws_chnl.send(buf)},
		start: start,//NOTE. We may add flags.
		on_msg: on_msg,
		on_connected: on_connected,
		on_disconnected: on_disconnected,
		on_error: on_error,
		connected: ()=>{return !!ws},
		close: close,
	}
}

module.exports.open = open

if (require.main === module) {

//var a = 033//Check strict mode.

}
