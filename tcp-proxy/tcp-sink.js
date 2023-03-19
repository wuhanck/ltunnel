'use strict'

const Net = require('net')

const STREAM_HIGH_WATER = 256*1024

const CLIENT_HIGH_WATER = 64*1024
const CLIENT_LOW_WATER = 16*1024

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
			const do_pause = (STREAM_HIGH_WATER < stream.buffered())
			if (do_pause)
				client.pause()

			stream.send(buf, ()=>{
				if (do_pause)
					client.resume()
			})
		})
		client.on('end', ()=>{stream.end()})
		client.on('close', ()=>{stream.rst()})
		client.on('error', (err)=>{stream.rst()})
		stream.on_msg((buf)=>{
			if (CLIENT_HIGH_WATER < client.writableLength)
				stream.jammed(1)

			client.write(buf, ()=>{
				if (client.writableLength < CLIENT_LOW_WATER)
					stream.jammed(0)
			})}
		)
		stream.on_peer_end(()=>{client.end()})
		stream.on_close(()=>{client.destroy()})
		stream.on_jammed((op)=>{
			if (op === 1)
				client.pause()
			else if (op === 0)
				client.resume()
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
const sink_port = 22
const resp_host = '127.0.0.1:20086'
const resp_path = `ws://${resp_host}/`
const resp_prv = RespPrvOpen(resp_path)
open(sink_port, sink_host, resp_prv)
resp_prv.start()
resp_prv.on_connected(()=>{console.log(`TCP:SINK:${sink_host}:${sink_port} connected`)})
resp_prv.on_disconnected(()=>{console.log(`TCP:SINK:${sink_host}:${sink_port} disconnected`)})

}
