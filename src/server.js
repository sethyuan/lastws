import {server as WebSocketServer} from "websocket"
import {EventEmitter} from "events"

class Server extends EventEmitter {
  constructor(httpServer) {
    super()

    const server = new WebSocketServer({
      httpServer,
      autoAcceptConnections: true,
    })
    this.server = server
    const sockets = new Map()
    this.sockets = sockets

    server.on("connect", (socket) => {
      const connection = new Connection(socket)
      sockets.set(socket, connection)
      super.emit("connect", connection)
    })

    server.on("close", (socket, reasonCode, description) => {
      const connection = sockets.get(socket)
      sockets.delete(socket)
      super.emit("close", connection, reasonCode, description)
    })
  }

  closeAllConnections() {
    this.server.closeAllConnections()
  }

  shutdown() {
    this.server.shutdown()
  }

  broadcast(type, body) {
    this.sockets.values().forEach((conn) => conn.send(type, body))
  }
}

class Connection extends EventEmitter {
  constructor(socket) {
    super()

    this.socket = socket

    socket.on("message", (msg) => {
      const json = JSON.parse(msg.utf8Data)
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
    this.socket.sendUTF(JSON.stringify({
      type,
      body
    }))
  }

  close(...args) {
    this.socket.close(...args)
  }

  drop(...args) {
    this.socket.drop(...args)
  }
}

export default function server(httpServer) {
  return new Server(httpServer)
}
