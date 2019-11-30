// 
var app = require('express')()
var server = require('http').createServer(app)
var io = require('socket.io').listen(server)
port = process.env.port || 8000

users = []
connections = []
gameRoom = {}


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
        
        console.log('Disconneted: %s sockets remaining',connections.length)
    })

    socket.on('add user',data=>{
        connections.push(socket) 
        console.log('adding new user',data)
        connections[connections.indexOf(socket)].name = data
        users.push(data)
        console.log('connected: %s sockets connected',connections.length)
        io.emit('broadcast',{users:users,type:'newUser'})
    })

    socket.on('add message',data=>{
        console.log(data)
        if(data.message!=''){
            console.log('new message incoming',data)
            io.emit('broadcast',{...data,type:'newMessage'})
        }
    })

    socket.on('add gameroom',data=>{
        console.log('adding game room by user',data.user)
        gr = 'game#'+data.user
        gameRoom[user]={name:gr, users:[data.user]}
        io.emit('broadcast',{type:'gameRoomUpdate',game:gameRoom})
    })

    socket.on('player add to gameroom',data=>{
        console.log('adding '+data.user+' to game room',data.grname)
        gameRoom[user].users.push(data.user)
        io.emit('broadcast',{type:'gameRoomUpdate',game:gameRoom}) 
    })

    socket.on('player remove from gameroom',data=>{
        console.log('removing '+data.user+' from game room',data.grname)
        pos = gameRoom[user].users.indexOf(data.user) 
        gameRoom[user].users.slice(pos,1)
        io.emit('broadcast',{type:'gameRoomUpdate',game:gameRoom}) 
    })

    socket.on('remove gameroom',data=>{
        console.log('removing game room by user',data.user)
        delete gameRoom[user]
        io.emit('broadcast',{type:'gameRoomUpdate',game:gameRoom}) 
    })

})



server.listen(port,()=>{
    console.log('server running at ',port)
})