const RealtimePort = require('../ports/realtime.port');

class WebsocketAdapter extends RealtimePort {
  constructor() {
    super();
    this.clients = new Set();
  }
  start(_server) {}
  broadcast(_channel, _payload) {}
}

module.exports = WebsocketAdapter;
