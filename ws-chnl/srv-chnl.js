'use strict'

const Assert = require('assert')
const WebSocketServer = require('websocket').server
const Http = require('http')

//port, host should present service which is entrance for many srv-chnls.
//We just simplified for test.

const open = (port, host, valid)=>{
	Assert(!!port)

	var http_srv = Http.createServer()//Flag.
	var ws_srv
	var ws//Flag used for connection.
	var ws_chnl//Used for send. Most time, equal to ws.
	var msg_cb
	var connected_cb
	var disconnected_cb
	var error_cb

	const close = ()=>{
		if (!http_srv)
			return
		var http_srv_tmp = http_srv
		http_srv = null

		close_ws(true, false)
		if (!!ws_srv)
			ws_srv.shutDown()
		http_srv_tmp.close()
	}
	const close_ws = (do_close, do_drop)=>{
		if (!ws)
			return
		var ws_tmp = ws
		ws = null

		if (!!disconnected_cb)
			disconnected_cb()

		if (do_close)
			ws_tmp.close()
		if (do_drop)
			ws_tmp.drop()
	}
	const on_ws_close = ()=>{
		close_ws(false, false)
	}
	const on_ws_message = (msg)=>{
		var buf = !msg.binaryData ? null : msg.binaryData
		if (!buf)//Something wrong. Drop websocket.
			close_ws(false, true)
		else if (!!msg_cb)
			msg_cb(buf)
	}
	const on_msg = (cb)=>{msg_cb = cb}
	const on_connected = (cb)=>{connected_cb = cb}
	const on_disconnected = (cb)=>{disconnected_cb = cb}
	const on_error = (cb)=>{error_cb = cb}
	const start = ()=>{
		if (!http_srv)
			return
		http_srv.listen(port, host, ()=>{
			ws_srv = new WebSocketServer({httpServer: http_srv, autoAcceptConnections: false,})
			ws_srv.on('close', (in_ws)=>{if (in_ws === ws) on_ws_close()})
			ws_srv.on('request', (request)=>{
				if (!valid(request.origin)) {
					request.reject()
					return
				}
				const in_ws = request.accept()
				close_ws(false, true)//Now, just drop the old ws.
				if (!http_srv) {//Any event may happens after closed.
					in_ws.drop()
					return
				}
				ws_chnl = in_ws
				ws = in_ws//As we only maintain one ws. So we don't use ws close event since ws will change.
				ws.on('error', (err)=>{if (!!error_cb) error_cb(err)})//Socket-error. It will emitted close soon.
				ws.on('message', on_ws_message)
				if (!!connected_cb)
					connected_cb()
			})
		})
	}

	return {
		send: (buf)=>{ws_chnl.send(buf)},
		start: start,//NOTE. We may add flags.
		on_msg: on_msg,
		on_connected: on_connected,
		on_disconnected: on_disconnected,
		on_error: on_error,
		connected: ()=>{return !!ws},
		close: close
	}
}

module.exports.open = open

if (require.main === module) {

//var a = 033//Check strict mode.

}
