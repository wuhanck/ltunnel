'use strict'

const Net = require('net')

const open = (port, host, resp_srv)=>{
	resp_srv.on_stream((stream)=>{
		const client = new Net.Socket({allowHalfOpen: true,})
		client.connect(port, host)
		client.on('data', (buf)=>{stream.send(buf)})
		client.on('end', ()=>{stream.end()})
		client.on('close', ()=>{stream.rst()})
		client.on('error', (err)=>{stream.rst()})
		stream.on_msg((buf)=>{client.write(buf)})
		stream.on_peer_end(()=>{client.end()})
		stream.on_close(()=>{client.destroy()})
	})
	return {
		close: ()=>{},
	}
}

module.exports.open = open

if (require.main === module) {

const RespPrvOpen = require('../req-resp-pub-prv/resp-prv.js').open

const sink_host = '127.0.0.1'
const sink_port = 22
const resp_host = '127.0.0.1:20086'
const resp_path = `ws://${resp_host}/`
const resp_prv = RespPrvOpen(resp_path)
open(sink_port, sink_host, resp_prv)
resp_prv.start()
resp_prv.on_connected(()=>{console.log(`TCP:SINK:${sink_host}:${sink_port} connected`)})
resp_prv.on_disconnected(()=>{console.log(`TCP:SINK:${sink_host}:${sink_port} disconnected`)})

}
