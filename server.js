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
  console.log('🎉 有新朋友連線進來了！');

  // 1. 聽取前端發送的「加入房間」請求
  socket.on('join_room', (roomId) => {
    // 讓這個玩家加入 Socket.io 的專屬房間
    socket.join(roomId);
    
    // 把房間名稱「貼」在這個玩家的身上，這樣他等一下畫畫我們才知道他在哪一間
    socket.roomId = roomId;

    // 如果這個房間是第一次有人進來（還沒有資料），就發給他一張新的 40 格白紙
    if (!roomsData[roomId]) {
      roomsData[roomId] = new Array(40).fill('white');
    }

    // 只把「這個房間」的畫布狀態，傳給剛進來的這個人
    socket.emit('init_board', roomsData[roomId]);
    console.log(`有人加入了房間：${roomId}`);
  });

  // 2. 聽取塗色事件
  socket.on('change_color', (data) => {
    const roomId = socket.roomId; // 看看這個玩家在哪個房間
    if (!roomId) return; // 如果他還沒進房間，就不理他

    // 更新伺服器裡「這個房間」的記憶
    roomsData[roomId][data.index] = data.color; 
    
    // 💡 【關鍵廣播】只廣播給「同一個房間 (roomId)」裡的所有人！
    io.to(roomId).emit('update_color', data);
  });

  // 3. 聽取清空事件
  socket.on('clear_board', () => {
    const roomId = socket.roomId;
    if (!roomId) return;

    // 洗白「這個房間」的記憶
    roomsData[roomId] = new Array(40).fill('white');
    
    // 💡 廣播給「這個房間」裡的所有人：「大家把畫面清空囉！」
    io.to(roomId).emit('clear_board');
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