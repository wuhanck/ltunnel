'use strict'

const dgram = require('dgram')

const HIGH_WATER = 8*1024*1024

const open = (port, host, req_srv, dport, dst)=>{
	var srv = dgram.createSocket('udp4')
	const close = ()=>{
		if (!srv)
			return
		const srv_tmp = srv
		srv = null

		srv_tmp.close()
	}
	req_srv.on_connected(()=>{
		console.log(`udppair dst ${dport} ${dst} stream opened`)

		const stream = req_srv.open_stream()
		stream.on_msg((buf)=>{if (srv) srv.send(buf, dport, dst)})

		srv.removeAllListeners()
		srv.on('message', (msg)=>{
			if (HIGH_WATER < stream.buffered())
				return
			stream.send(msg)
		})
	})
	req_srv.on_disconnected(()=>{
		console.log(`udppair dst ${dport} ${dst} stream closed`)
	})
	console.log(`udppair host udp binding ${port} ${host}`)
	srv.bind(port, host)
	return {
		close: close,
	}
}

module.exports.open = open

if (require.main === module) {

const ReqPubOpen = require('../req-resp-pub-prv/req-pub.js').open

const dport = 4567
const dst = '127.0.0.1'
const src_port = 5567
const src_host = '127.0.0.1'

const valid = origin=>true
const req_host = '127.0.0.1'
const req_port = 20086
const MAX_STREAMS = 4096
const req_srv = ReqPubOpen(req_port, req_host, MAX_STREAMS, valid)
open(src_port, src_host, req_srv, dport, dst)
req_srv.start()

}
