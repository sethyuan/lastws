import {Server as WebSocketServer} from "uws"
import {EventEmitter2} from "eventemitter2"

class Connection extends EventEmitter2 {
  constructor(socket) {
    super()

    this.socket = socket

    socket.on("message", (msg) => {
      const json = JSON.parse(msg)
      super.emit(json.type, json.body)
    })

    socket.on("close", (reasonCode, description) => {
      super.emit("close", reasonCode, description)
    })

    socket.on("error", (err) => {
      super.emit("error", err)
    })
  }

  send(type, body) {
    this.socket.send(JSON.stringify({
      type,
      body
    }), {binary: false})
  }

  terminate() {
    this.socket.close()
  }
}

class Server extends EventEmitter2 {
  constructor(httpServer) {
    super()

    const wss = new WebSocketServer({
      server: httpServer,
    })
    this.server = wss
    const sockets = new Map()
    this.sockets = sockets

    wss.on("connection", (socket) => {
      const connection = new Connection(socket)
      sockets.set(socket, connection)
      connection.on("close", () => {
        sockets.delete(socket)
      })
      super.emit("connection", connection)
    })
  }

  close(callback) {
    this.server.close(callback)
  }

  broadcast(type, body) {
    this.sockets.values().forEach((conn) => conn.send(type, body))
  }
}

export default function server(httpServer) {
  return new Server(httpServer)
}
