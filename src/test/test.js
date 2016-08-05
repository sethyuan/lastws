require("source-map-support").install()

global.WebSocket = require("websocket").w3cwebsocket
const server = require("http").createServer(httpHandler)
const ws = require("../server").default(server)
const w3 = require("../client").default

function httpHandler(req, res) {
  res.writeHead(200)
  res.end("OK")
}

server.listen(8001)

let s

ws.on("connect", (socket) => {
  console.log("new connection")
  s = socket

  socket.on("speak", (content) => {
    console.log(content)
  })

  socket.send("hello", {name: "Seth"})
})

ws.on("close", (socket, reason, description) => {
  console.log(socket === s)
  console.log("a connection is closed because of "  + reason)
})

const client = new w3("ws://localhost:8001")

client.on("open", () => {
  console.log("connected")
  client.send("speak", "Hello World!")
})

client.on("hello", ({name}) => {
  console.log(`I got hello from ${name}`)
})

client.on("close", (code, reason) => {
  console.log(`closed because of ${code}`)
})

setTimeout(() => {
  client.close()
}, 1000)
