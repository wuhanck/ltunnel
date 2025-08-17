'use strict'

const dgram = require('dgram')
const avl = require('avl').AVLTree
const enCollator = new Intl.Collator('en')

const rinfo_compare = (ra, rb)=>{
	const ret = enCollator.compare(ra.address, rb.address)
	if (ret !== 0)
		return ret
	else
		return ra.port - rb.port
}

const VCON_TIMEOUT = 240*1000
const HIGH_WATER = 256*1024

const gen_vcon = (vcons, s, rinfo, msg_cb)=>{
	var close_cb
	var alive = true
	var timeout = null
	const in_con = {
		on_close: (cb)=>{close_cb = cb},
		write: (buf)=>{
			alive = true
			if (s) s.send(buf, rinfo.port, rinfo.address)
		},
		close: ()=>{
			if (!s)
				return
			s = null

			alive = true
			clearTimeout(timeout)
			timeout = null

			vcons.remove(rinfo)
			if (!!close_cb)
				close_cb()
		},
		inj_msg: (msg)=>{
			alive = true
			msg_cb(msg)
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
	var srv = dgram.createSocket('udp4')
	const vcons = new avl(rinfo_compare, true)
	const close = ()=>{
		if (!srv)
			return
		const srv_tmp = srv
		srv = null

		srv_tmp.close()
	}
	srv.on('message', (msg, rinfo)=>{
		const vc = vcons.find(rinfo)
		var in_con
		if (vc === null) {
			const stream = req_srv.open_stream()
			if (!stream) {
				console.log('open-stream failed')
				return
			}
			in_con = gen_vcon(vcons, srv, rinfo, (buf)=>{
				if (HIGH_WATER < stream.buffered())
					return
				stream.send(buf)
			})
			in_con.on_close(()=>{stream.rst()})

			stream.on_msg((buf)=>{in_con.write(buf)})
			stream.on_close(()=>{in_con.close()})
		} else {
			in_con = vc.data
		}
		in_con.inj_msg(msg)

	})
	console.log(`udp src binding ${port} ${host}`)
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
