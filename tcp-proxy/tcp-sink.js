'use strict'

const Net = require('net')

const HIGH_WATER = 8*1024*1024
const LOW_WATER = 2*1024*1024

const open = (port, host, resp_srv)=>{
	resp_srv.on_stream((stream)=>{
		const client = new Net.Socket({allowHalfOpen: true,})
		try {
			client.connect(port, host)
		} catch (e) {
			console.log(e)
			stream.rst()
			client.destroy()
			return
		}
		client.on('data', (buf)=>{
			if (HIGH_WATER < stream.buffered())
				client.pause()
			stream.send(buf, ()=>{
				if (stream.buffered() < LOW_WATER)
					client.resume()
			})
		})
		client.on('end', ()=>{stream.end()})
		client.on('close', ()=>{stream.rst()})
		client.on('error', (err)=>{stream.rst()})
		stream.on_msg((buf)=>{
			if (HIGH_WATER < client.writableLength)
				stream.pause()
			client.write(buf, ()=>{
				if (client.writableLength < LOW_WATER)
					stream.resume()
			})}
		)
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
