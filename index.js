// 
var app = require('express')()
var server = require('http').createServer(app)
var io = require('socket.io').listen(server)
port = process.env.port || 8000

users = []
connections = []
gameRoom = {name:'GAME#1234',users:[]}
timer = 5
flagTimerRunning = false

io.on('connection',(socket)=>{

    socket.on('disconnect',()=>{
        var pos = connections.indexOf(socket)
        if(users[pos]){
            io.emit('kickout',users[pos])
            console.log('removing user',users[pos])
            users.splice(pos,1)
            console.log('new users',users)
            connections.splice(pos,1)
        }
        socket.removeAllListeners(); 
        console.log('Disconneted: %s sockets remaining',connections.length)
    })
    socket.off('disconnect',()=>{})

    socket.on('add user',data=>{
        if(users.indexOf(data)>=0){
            console.log('user exists')
            io.emit('error',{err:250,message:'user already exists'})
            return
        }
        connections.push(socket) 
        console.log('adding new user',data)
        connections[connections.indexOf(socket)].name = data
        users.push(data)
        console.log('connected: %s sockets connected',connections.length)
        io.emit('broadcast',{users:users,type:'newUser',game:gameRoom})
        
    })
    socket.off('add user',()=>{})

    socket.on('add message',data=>{
        console.log(data)
        if(data.message!=''){
            console.log('new message incoming',data)
            io.emit('broadcast',{...data,type:'newMessage'})
        }
    })
    socket.off('add message',()=>{})

    socket.on('addPlayer',data=>{
        console.log('adding '+data+' to game room')
        gameRoom.users = [...gameRoom.users, data]
        console.log('new gameroom is',gameRoom)
        io.emit('broadcast',{type:'gameRoomUpdate',game:gameRoom}) 
        
        if(!flagTimerRunning){
        if(users.length>1){
            var x = setInterval(()=>{
                if(users.length<=1 || timer==0){
                    clearInterval(x)
                    io.emit('broadcast',{type:'timer',timer:'GAME STARTING'})  
                    timer = 5
                    flagTimerRunning = false
                    return
                }
                timer = timer -1
                io.emit('broadcast',{type:'timer', timer})
            },1000)
            flagTimerRunning = true
        }
        else
            io.emit('broadcast',{type:'timer',timer:'WAITING FOR PLAYERS'})
    } 
    })
    socket.off('addPlayer',()=>{})

    socket.on('removePlayer',data=>{
        console.log('removing '+data+' from game room')
        gameRoom.users.splice(gameRoom.users.indexOf(data),1)
        console.log('new gameroom is',gameRoom)
        io.emit('broadcast',{type:'gameRoomUpdate',game:gameRoom})
        if(users.length<1)
            io.emit('broadcast',{type:'timer',timer:'WAITING FOR PLAYERS'}) 
    })
    socket.off('removePlayer',()=>{})

})



server.listen(port,()=>{
    console.log('server running at ',port)
})