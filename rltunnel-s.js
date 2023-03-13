'use strict'

const open = require('./tcp-proxy/tcp-sink').open
const RespPubOpen = require('./req-resp-pub-prv/resp-pub.js').open

console.log(process.argv)

const sink_port = parseInt(process.argv[3])
const sink_host = process.argv[5] === undefined ? '127.0.0.1' : process.argv[5]

const s_origin = process.argv[4]
const valid = origin=>origin == s_origin

const resp_port = parseInt(process.argv[2]) + 10000
const resp_host = '0.0.0.0'

const resp_srv = RespPubOpen(resp_port, resp_host, valid)
open(sink_port, sink_host, resp_srv)

resp_srv.start()
resp_srv.on_connected(()=>{console.log(`TCP:SINK:${sink_host}:${sink_port} connected.`)})
resp_srv.on_disconnected(()=>{console.log(`TCP:SINK:${sink_host}:${sink_port} disconnected.`)})
