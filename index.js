const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

// ...
const users = {};

// ...
io.on('connection', (socket) => {
  console.log('a user connected');

  socket.emit('user list', Object.keys(users));

  socket.on('set username', (username) => {
    socket.username = username;
    users[username] = socket.id; // Mapeia o nome de usuário ao ID do socket
    console.log(`User ${socket.username} connected`);
    io.emit('user connected', socket.username); // Emite evento para notificar os clientes sobre a conexão do usuário
  
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.username} disconnected`);
    delete users[socket.username]; // Remove o nome de usuário do mapeamento quando o usuário se desconecta
    io.emit('user disconnected', socket.username); // Emite evento para notificar os clientes sobre a desconexão do usuário
  

  });

  socket.on('chat message', (msg) => {
    if (msg.startsWith('/')) {
      // Verifica se a mensagem começa com '/'
      const recipient = msg.split(' ')[0].substr(1); // Extrai o nome de usuário do destinatário da mensagem
      const privateMessage = msg.substr(msg.indexOf(' ') + 1); // Extrai a mensagem privada
      const recipientSocketId = users[recipient]; // Obtém o ID do socket do destinatário

      if (recipientSocketId) {
        // Se o destinatário existe, envia a mensagem privada apenas para ele e para o remetente
        socket.to(recipientSocketId).emit('private message', {
          from: socket.username || 'Anonymous',
          message: privateMessage,
        });
        socket.emit('private message', {
          from: socket.username || 'Anonymous',
          message: privateMessage,
        });
      } else {
        // Se o destinatário não existe, informa ao remetente que o destinatário é inválido
        socket.emit('private message', {
          from: 'System',
          message: `User "${recipient}" does not exist or is currently offline.`,
        });
      }
    } else {
      // Se não for uma mensagem privada, envia a mensagem para todos os clientes
      
      io.emit('chat message', { from: socket.username || 'Anonymous', message: msg });
    }
  });

  socket.on('set recipient', (recipient) => {
    socket.recipient = recipient;
    console.log(`Recipient set for ${socket.username}: ${recipient}`);
  });
});

// ...

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('set username', (username) => {
    socket.username = username; // Salva o nome de usuário no objeto de socket
    console.log(`User ${socket.username} connected`);
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.username} disconnected`);
  });

  socket.on('chat message', (msg) => {
    const messageWithUsername = `${socket.username}: ${msg}`;
   // io.emit('chat message', messageWithUsername);
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});