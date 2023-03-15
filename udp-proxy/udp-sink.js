'use strict'

const dgram = require('dgram')

const HIGH_WATER = 8*1024*1024

const open = (port, host, resp_srv)=>{
	resp_srv.on_stream((stream)=>{
		console.log(`udp sink ${port} ${host} stream opened`)
		const client = dgram.createSocket('udp4')
		client.bind()
		client.on('message', (buf)=>{
			if (HIGH_WATER < stream.buffered())
				return
			stream.send(buf)
		})
		client.on('close', ()=>{
			stream.rst()
		})
		client.on('error', (err)=>{
			console.log(`udp client error: ${err}`)
			stream.rst()
		})
		stream.on_msg((buf)=>{client.send(buf, port, host)})
		stream.on_close(()=>{
			client.close()
		})
	})
	return {
		close: ()=>{},
	}
}

module.exports.open = open

if (require.main === module) {

const RespPrvOpen = require('../req-resp-pub-prv/resp-prv.js').open

const sink_host = '127.0.0.1'
const sink_port = 69

const resp_host = '127.0.0.1:20086'
const resp_path = `ws://${resp_host}/`
const resp_prv = RespPrvOpen(resp_path)
open(sink_port, sink_host, resp_prv)
resp_prv.start()
resp_prv.on_connected(()=>{console.log(`udp sink ${resp_path} connected.`)})
resp_prv.on_disconnected(()=>{console.log(`udp sink ${resp_path} disconnected.`)})

}
