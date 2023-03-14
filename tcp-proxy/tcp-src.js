'use strict'

const Net = require('net')

const HIGH_WATER = 8*1024*1024
const LOW_WATER = 2*1024*1024

const open = (port, host, req_srv)=>{
	var srv = Net.createServer({allowHalfOpen: true}, (in_con)=>{
		const stream = req_srv.open_stream()
		if (!stream) {
			in_con.destroy()
			return
		}
		in_con.on('data', (buf)=>{
			if (HIGH_WATER < stream.buffered())
				in_con.pause()
			stream.send(buf, ()=>{
				if (stream.buffered() < LOW_WATER)
					in_con.resume()
			})
		})
		in_con.on('end', ()=>{stream.end()})
		in_con.on('close', ()=>{stream.rst()})
		in_con.on('error', ()=>{stream.rst()})
		stream.on_msg((buf)=>{
			if (HIGH_WATER < in_con.writableLength)
				stream.pause()
			in_con.write(buf, ()=>{
				if (in_con.writableLength < LOW_WATER)
					stream.resume()
			})
		})
		stream.on_peer_end(()=>{in_con.end()})
		stream.on_close(()=>{in_con.destroy()})
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
