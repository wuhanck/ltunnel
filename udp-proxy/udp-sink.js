'use strict'

const dgram = require('dgram')

const open = (port, host, _resp_srv)=>{
	var resp_srv = _resp_srv//Flag.
	resp_srv.on_stream((stream)=>{
		const client = dgram.createSocket('udp4')
		client.connect(port, host)
		client.on('message', (buf)=>{stream.send(buf)})
		client.on('close', ()=>{
			stream.rst()
		})
		client.on('error', (err)=>{
			console.log(`udp client error: ${err}`)
			stream.rst()
		})
		stream.on_msg((buf)=>{client.send(buf)})
		stream.on_peer_end(()=>{})
		stream.on_close(()=>{
			client.close()
		})
	})
	const close = ()=>{
		if (!!resp_srv)
			resp_srv.close()
		resp_srv = null
	}
	return {
		close: close,
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
resp_prv.on_connected(()=>{console.log(`UDP:SINK:${sink_host}:${sink_port} connected.`)})
resp_prv.on_disconnected(()=>{console.log(`UDP:SINK:${sink_host}:${sink_port} disconnected.`)})

}
