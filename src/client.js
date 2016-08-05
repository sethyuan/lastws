import {EventEmitter} from "events"

class Client extends EventEmitter {
  constructor(
    url,
    reconnection,
    reconnectionDelay,
    reconnectionMaxDelay,
  ) {
    super()

    this.url = url
    this.reconnection = reconnection
    this.delay = reconnectionDelay
    this.maxDelay = reconnectionMaxDelay
    this.interval = reconnectionDelay
    this.timerHandle = null

    this._connect()
  }

  send(type, body) {
    if (!this.socket || this.socket.readyState !== 1) {
      this._tryReconnect()
      throw new Error("no available socket")
    }

    this.socket.send(JSON.stringify({
      type,
      body
    }))
  }

  close(...args) {
    if (!this.socket || this.socket.readyState !== 1) {
      this._tryReconnect()
      throw new Error("no available socket")
    }

    this.socket.close(...args)
  }

  _tryReconnect() {
    if (!this.reconnection) return

    this.socket = null
    clearTimeout(this.timerHandle)
    this.timerHandle = setTimeout(() => {
      if (this.interval < this.maxDelay) {
        this.interval += this.delay
      }
      this._connect()
    }, this.interval)
  }

  _connect() {
    let socket = new WebSocket(this.url)
    this.socket = socket

    socket.onclose = (e) => {
      super.emit("close", e.code, e.reason, e.wasClean)
      // Not normal closing
      if (e.code !== 1000) {
        this._tryReconnect()
      }
    }

    socket.onerror = (err) => {
      super.emit("error", err)
      // Not open or connecting
      if (this.socket.readyState > 1) {
        this._tryReconnect()
      }
    }

    socket.onmessage = (e) => {
      const json = JSON.parse(e.data)
      super.emit(json.type, json.body)
    }

    socket.onopen = () => {
      // reset reconnection interval
      this.interval = this.delay
      super.emit("open")
    }
  }
}

export default function client(
  url,
  {
    reconnection=true,
    reconnectionDelay=1000,
    reconnectionMaxDelay=5000,
  } = {}
) {
  return new Client(url, reconnection, reconnectionDelay, reconnectionMaxDelay)
}
