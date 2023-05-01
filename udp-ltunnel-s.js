'use strict'

const open = require('./udp-proxy/udp-src.js').open
const ReqPubOpen = require('./req-resp-pub-prv/req-pub.js').open

console.log(process.argv)

const src_port = parseInt(process.argv[2])
const src_host = '0.0.0.0'

const s_origin = process.argv[3]
const valid = origin=>origin == s_origin

const req_port = src_port + 10000
const req_host = '0.0.0.0'
const MAX_STREAMS = 8192

const req_srv = ReqPubOpen(req_port, req_host, MAX_STREAMS, valid)
open(src_port, src_host, req_srv)

req_srv.start()
