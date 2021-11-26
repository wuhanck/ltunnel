'use strict'

const ProtoBuf = require('protobufjs')
const path = require('path')
const msg_path = path.join(__dirname, '../req-resp-proto/msg.proto')
const MsgFactory = ProtoBuf.loadSync(msg_path)
const ReqMsg = MsgFactory.lookup('ReqMsg')
const RespMsg = MsgFactory.lookup('RespMsg')

const REQ_SYN = 1//open the stream
const REQ_END = 2
const REQ_RST = 3
const encode_req = (stream_id, msg)=>{
	return ReqMsg.encode({reqStreamId: stream_id, reqContent: msg}).finish()
}
const encode_req_syn = (stream_id, msg)=>{
	return ReqMsg.encode({reqType: REQ_SYN, reqStreamId: stream_id, reqContent: msg}).finish()
}
const encode_req_end = (stream_id, msg)=>{
	return ReqMsg.encode({reqType: REQ_END, reqStreamId: stream_id, reqContent: msg}).finish()
}
const encode_req_rst = (stream_id, msg)=>{
	return ReqMsg.encode({reqType: REQ_RST, reqStreamId: stream_id, reqContent: msg}).finish()
}
const decode_req = (buf)=>{
	try {
		var msg = ReqMsg.decode(buf)
	} catch (e) {//let it be
		return
	}
	return ReqMsg.toObject(msg)
}

const RESP_END = 1
const RESP_RST = 2
const encode_resp = (stream_id, msg)=>{
	return RespMsg.encode({respStreamId: stream_id, respContent: msg}).finish()
}
const encode_resp_end = (stream_id, msg)=>{
	return RespMsg.encode({respType: RESP_END, respStreamId: stream_id, respContent: msg}).finish()
}
const encode_resp_rst = (stream_id, msg)=>{
	return RespMsg.encode({respType: RESP_RST, respStreamId: stream_id, respContent: msg}).finish()
}
const decode_resp = (buf)=>{
	try {
		var msg = RespMsg.decode(buf)
	} catch (e) {//let it be
		return
	}
	return RespMsg.toObject(msg)
}

module.exports.req_parser = {
	encode: encode_req,
	encode_syn: encode_req_syn,
	encode_end: encode_req_end,
	encode_rst: encode_req_rst,
	decode: decode_req,
	SYN_TYPE: REQ_SYN,
	END_TYPE: REQ_END,
	RST_TYPE: REQ_RST,
}

module.exports.resp_parser = {
	encode: encode_resp,
	encode_end: encode_resp_end,
	encode_rst: encode_resp_rst,
	decode: decode_resp,
	END_TYPE: RESP_END,
	RST_TYPE: RESP_RST,
}

if (require.main === module) {
//change msg.proto's bytes to string before run unit-test.
var parser = module.exports.req_parser

var buf = parser.encode(1, 'hello.')
console.log(buf)

var msg = parser.decode(buf)
console.log(msg)

var buf = parser.encode(2)
console.log(buf)

var msg = parser.decode(buf)
console.log(msg)

var buf = parser.encode_end(3, 'hello.')
console.log(buf)

var msg = parser.decode(buf)
console.log(msg)

var buf = parser.encode_end(4)
console.log(buf)

var msg = parser.decode(buf)
console.log(msg)

var buf = parser.encode_rst(5, 'hello.')
console.log(buf)

var msg = parser.decode(buf)
console.log(msg)

var buf = parser.encode_rst(6)
console.log(buf)

var msg = parser.decode(buf)
console.log(msg)

var parser = module.exports.resp_parser

var buf = parser.encode(1, 'hello.')
console.log(buf)

var msg = parser.decode(buf);
console.log(msg)

var buf = parser.encode(2)
console.log(buf)

var msg = parser.decode(buf)
console.log(msg)

var buf = parser.encode_end(3, 'hello.')
console.log(buf)

var msg = parser.decode(buf)
console.log(msg)

var buf = parser.encode_end(4)
console.log(buf)

var msg = parser.decode(buf)
console.log(msg)

var buf = parser.encode_rst(5, 'hello.')
console.log(buf)

var msg = parser.decode(buf)
console.log(msg)

var buf = parser.encode_rst(6)
console.log(buf)

var msg = parser.decode(buf)
console.log(msg)

}
