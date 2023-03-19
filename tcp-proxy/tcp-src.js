'use strict'

const Net = require('net')

const STREAM_HIGH_WATER = 256*1024

const CLIENT_HIGH_WATER = 64*1024
const CLIENT_LOW_WATER = 16*1024

const open = (port, host, req_srv)=>{
	var srv = Net.createServer({allowHalfOpen: true}, (in_con)=>{
		const stream = req_srv.open_stream()
		if (!stream) {
			in_con.destroy()
			return
		}
		in_con.on('data', (buf)=>{
			const do_pause = (STREAM_HIGH_WATER < stream.buffered())
			if (do_pause)
				in_con.pause()

			stream.send(buf, ()=>{
				if (do_pause)
					in_con.resume()
			})
		})
		in_con.on('end', ()=>{stream.end()})
		in_con.on('close', ()=>{stream.rst()})
		in_con.on('error', ()=>{stream.rst()})
		stream.on_msg((buf)=>{
			if (CLIENT_HIGH_WATER < in_con.writableLength)
				stream.jammed(1)

			in_con.write(buf, ()=>{
				if (in_con.writableLength < CLIENT_LOW_WATER)
					stream.jammed(0)
			})
		})
		stream.on_peer_end(()=>{in_con.end()})
		stream.on_close(()=>{in_con.destroy()})
		stream.on_jammed((op)=>{
			if (op === 1)
				client.pause()
			else if (op === 0)
				client.resume()
		})
	})
	const close = ()=>{
		if (!srv)
			return
		const srv_tmp = srv
		srv = null

		srv_tmp.close()
	}
	srv.listen(port, host, ()=>{
		console.log(`SRC:TCP:${port}:${host} listened`)
	})
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
