const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const colors = require("colors");
const morgan = require("morgan");
const socketIo = require('socket.io');
const connectDB = require("./config/db");
const WebSocket = require('ws');
const { WebSocketServer } = require('ws');
const http = require('http');
const bodyParser = require('body-parser');


dotenv.config();

connectDB();
//REST OBJECT
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

//middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/v1/auth", require("./routes/userRoutes"));
app.get("/",(res,req)=>{
  res.statusCode(200).send({
    "success":true,
    "message":"node server Run"
  })
})






const wss = new WebSocketServer({port:'3000',path:'/ds'});


const PORT = process.env.PORT|| 8080;
app.listen(PORT, () => {
    console.log(`Server Runnning ${PORT}`.bgGreen.white);
  });
  io.on('connection', (socket) => {
    console.log('New client connected');
    wss.on("connection",(ws)=>{
      ws.on("message",(data)=>{
        console.log(data.toString());
        let data1=data.toString()
        const values = data1.split(',');
        let voltage=values[0];
        let current=values[1];
        let power=values[2];

        
       
    const sendRandomData = () => {
        const randomData = {
            value1: voltage ,
            value2: current,
            value3: power
        };
        socket.emit('randomData', randomData);
    };

    // Send random data every second
    const intervalId = setInterval(sendRandomData, 3000);

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        clearInterval(intervalId);
    });
    ws.send("hello world");
  })
})
});

server.listen(3001, () => {
    console.log(`Server is running on port ${PORT}`);
});







//   const server = http.createServer(app);
// const wss = new WebSocket.Server({ noServer: true });

// server.on('upgrade', (request, socket, head) => {
//     const pathname = request.url;

//     if (pathname === '/ds') {
//         wss.handleUpgrade(request, socket, head, (ws) => {
//             wss.emit('connection', ws, request);
//         });
//     } else {
//         socket.destroy();
//     }
// });

// wss.on('connection', (ws) => {
//     console.log('Client connected');

//     ws.on('message', (message) => {
//         console.log(`Received message: ${message}`);
//         // Forward the message to all connected clients
//         wss.clients.forEach((client) => {
//             if (client.readyState === WebSocket.OPEN) {
//                 client.send(message);
//             }
//         });
//     });

//     ws.on('close', () => {
//         console.log('Client disconnected');
//     });
// });

// server.listen(3000, () => {
//     console.log('Server started on port 3000');
// });