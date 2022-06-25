'use strict'

const dgram = require('dgram')
const avl = require('avl').default

const rinfo_compare = (ra, rb)=>{
	if (ra.address < rb.address)
		return -1
	else if (ra.address > rb.address)
		return 1
	else
		return ra.port - rb.port
}

const VCON_TIMEOUT = 30*1000

const gen_vcon = (vcons, s, rinfo)=>{
	var msg_cb_
	var close_cb_
	var timeout
	var alive = true
	const in_con = {
		on_msg: (msg_cb)=>{msg_cb_ = msg_cb},
		on_close: (close_cb)=>{close_cb_ = close_cb},
		write: (buf)=>{
			if (!!s) {
				alive = true
				s.send(buf, rinfo.port, rinfo.address)
			}
		},
		close: ()=>{
			if (!s)
				return
			s = null
			clearTimeout(timeout)
			vcons.remove(rinfo)
			if (!!close_cb_)
				close_cb_()
		},
		inj_msg: (msg)=>{
			if (!!msg_cb_) {
				alive = true
				msg_cb_(msg)
			}
		},
	}
	const timeout_cb = ()=>{
		if (!alive) {
			console.log('vcon timeout closing')
			in_con.close()
		} else {
			alive = false
			clearTimeout(timeout)
			timeout = setTimeout(timeout_cb, VCON_TIMEOUT)
		}
	}
	vcons.insert(rinfo, in_con)
	timeout_cb()
	return in_con
}

const open = (port, host, req_srv)=>{
	var srv//Flag.
	const vcons = new avl(rinfo_compare, true)
	srv = dgram.createSocket('udp4')
	const close = ()=>{
		if (!!srv)
			srv.close()
		srv = null
	}
	srv.on('message', (msg, rinfo)=>{
		const vc = vcons.find(rinfo)
		var in_con
		if (vc === null) {
			in_con = gen_vcon(vcons, srv, rinfo)
			const stream = req_srv.open_stream()
			if (!stream) {
				console.log('open-stream failed')
				in_con.close()
				return
			}
			in_con.on_msg((buf)=>{stream.send(buf)})
			in_con.on_close(()=>{stream.rst()})
			stream.on_msg((buf)=>{in_con.write(buf)})
			stream.on_peer_end(()=>{})
			stream.on_close(()=>{in_con.close()})
		} else {
			in_con = vc.data
		}
		in_con.inj_msg(msg)

	})
	console.log(`udp binding ${port}, ${host}`)
	srv.bind(port, host)
	return {
		close: close,
	}
}

module.exports.open = open

if (require.main === module) {

const ReqPubOpen = require('../req-resp-pub-prv/req-pub.js').open

const valid = origin=>true

const src_host = '127.0.0.1'
const src_port = 10086
const req_host = '127.0.0.1'
const req_port = 20086
const MAX_STREAMS = 4096
const req_srv = ReqPubOpen(req_port, req_host, MAX_STREAMS, valid)
open(src_port, src_host, req_srv)
req_srv.start()

}
