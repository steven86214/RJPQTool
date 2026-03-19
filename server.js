const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// 伺服器記憶畫布狀態
let boardState = new Array(40).fill('white');

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('🎉 有新朋友連線進來了！');

  // 給新朋友目前的狀態
  socket.emit('init_board', boardState);

  // 聽取單格塗色事件
  socket.on('change_color', (data) => {
    boardState[data.index] = data.color; 
    io.emit('update_color', data);
  });

  // 👇 【新增這段】聽取「全部清空」事件
  socket.on('clear_board', () => {
    // 1. 把伺服器的記憶重新洗白
    boardState = new Array(40).fill('white');
    // 2. 廣播給所有人：「大家把畫面清空囉！」
    io.emit('clear_board');
  });

  socket.on('disconnect', () => {
    console.log('👋 有人離開了');
  });
});

// 讓雲端決定 Port，如果是在本機測試才用 3000
const PORT = process.env.PORT || 3000; 

http.listen(PORT, () => {
  console.log(`伺服器已啟動，正在監聽 Port ${PORT} 🚀`);
});
