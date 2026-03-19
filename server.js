const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// 💡 【大改變】把單一陣列變成一個物件，用來裝所有房間的資料
// 格式會像這樣： { 'room-123': ['white', 'red'...], 'room-456': [...] }
const roomsData = {};

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  // 💡 取得真實 IP 的小撇步：先看有沒有雲端代理轉發的真實 IP，沒有的話再抓本機 IP
  const rawIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
  
  // 有時候 x-forwarded-for 會是一串包含多個 IP 的字串，我們取第一個就好
  const clientIp = rawIp.split(',')[0].trim();

  console.log(`🎉 有新朋友連線進來了！來自 IP: ${clientIp}`);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId;

    if (!roomsData[roomId]) {
      roomsData[roomId] = new Array(40).fill('white');
    }

    socket.emit('init_board', roomsData[roomId]);
    // 在日誌裡加上 IP，追蹤誰進了哪個房間
    console.log(`[${clientIp}] 加入了房間：${roomId}`);
  });

  socket.on('change_color', (data) => {
    const roomId = socket.roomId; 
    if (!roomId) return; 

    roomsData[roomId][data.index] = data.color; 
    io.to(roomId).emit('update_color', data);
  });

  socket.on('clear_board', () => {
    const roomId = socket.roomId;
    if (!roomId) return;

    roomsData[roomId] = new Array(40).fill('white');
    io.to(roomId).emit('clear_board');
    // 可選：記錄是哪個 IP 清空了房間
    console.log(`🧹 [${clientIp}] 清空了房間：${roomId}`);
  });

  socket.on('disconnect', () => {
    // 離開時也印出 IP
    console.log(`👋 [${clientIp}] 離開了`);
  });
});

// 讓雲端決定 Port，如果是在本機測試才用 3000
const PORT = process.env.PORT || 3000; 

http.listen(PORT, () => {
  console.log(`伺服器已啟動，正在監聽 Port ${PORT} 🚀`);
});