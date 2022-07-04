'use strict'

const dgram = require('dgram')

const open = (port, host, resp_srv, dport, dst)=>{
	var srv//flag
	srv = dgram.createSocket('udp4')
	const close = ()=>{
		if (!!srv)
			srv.close()
		srv = null
	}
	var stream
	resp_srv.on_stream((in_stream)=>{
		console.log(`udppair dst ${dport} ${dst} stream in`)
		stream = in_stream
		stream.on_msg((buf)=>{
			if (!!srv)
				srv.send(buf, dport, dst)
		})
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

const RespPrvOpen = require('../req-resp-pub-prv/resp-prv.js').open

const dport = 6567
const dst =  '127.0.0.1'
const src_port = 7567
const src_host = '127.0.0.1'

const resp_host = '127.0.0.1:20086'
const resp_path = `ws://${resp_host}/`
const resp_prv = RespPrvOpen(resp_path)
open(src_port, src_host, resp_prv, dport, dst)
resp_prv.start()
resp_prv.on_connected(()=>{console.log(`udppair ${resp_path} connected.`)})
resp_prv.on_disconnected(()=>{console.log(`udppair ${resp_path} disconnected.`)})

}
