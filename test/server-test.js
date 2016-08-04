const server = require("http").createServer(httpHandler)
const ws = require("../lib/index").ws(server)
const w3 = require("websocket").w3cwebsocket

function httpHandler(req, res) {
  res.writeHead(200)
  res.end("OK")
}

server.listen(8001)

let s

ws.on("connect", function(socket) {
  console.log("new connection")
  s = socket

  socket.on("speak", function(content) {
    console.log(content)
  })

  socket.emit("hello", {name: "Seth"})
})

ws.on("close", function(socket, reason, description) {
  console.log(socket === s)
  console.log("a connection is closed because of "  + reason)
})

const client = new w3("ws://localhost:8001")

client.onopen = function() {
  console.log("connected")
  client.send(JSON.stringify({
    type: "speak",
    body: "Hello World!"
  }))
}

client.onmessage = function(e) {
  const json = JSON.parse(e.data)
  console.log(json.type)
  console.log(json.body.name)
}

setTimeout(function() {
  client.close()
}, 1000)
