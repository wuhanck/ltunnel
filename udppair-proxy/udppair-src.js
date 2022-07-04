'use strict'

const dgram = require('dgram')

const open = (port, host, req_srv, dport, dst)=>{
	var srv//flag.
	srv = dgram.createSocket('udp4')
	const close = ()=>{
		if (!!srv)
			srv.close()
		srv = null
	}
	var stream
	req_srv.on_connected(()=>{
		console.log(`udppair dest ${dport} ${dst} connected`)
		stream = req_srv.open_stream()
		stream.on_msg((buf)=>{
			if (!!src)
				src.send(buf, dport, dst)
		})
	})
	req_srv.on_disconnected(()=>{
		console.log(`udppair dest ${dport} ${dst} disconnected`)
		stream = null
	})
	srv.on('message', (msg)=>{
		if (!!stream)
			stream.write(msg)
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
