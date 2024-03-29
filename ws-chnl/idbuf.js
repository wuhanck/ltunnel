'use strict'

const id2buf = (op, id)=>{
	const buf = Buffer.allocUnsafe(8)
	buf.writeInt32LE(op)
	buf.writeInt32LE(id, 4)
	return buf
}
const buf2id = (buf)=>{
	const op = buf.readInt32LE()
	const id = buf.readInt32LE(4)
	return [op, id]
}

module.exports.id2buf = id2buf
module.exports.buf2id = buf2id
