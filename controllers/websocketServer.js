const WebSocket = require('ws');

// Create a function to set up the WebSocket server
function setupWebSocketServer(server) {
  const wss = new WebSocket.Server({ server,path:'/rens' });

  wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      console.log(`Received message: ${data}`);
      ws.send('hello world');
    });
  });

  console.log('WebSocket server is running');
}

module.exports = setupWebSocketServer;
