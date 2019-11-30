// 
var app = require('express')()
var cors = require('cors')
var server = require('http').createServer(app)
var io = require('socket.io')(server,{ origins: '*:*'})
port = process.env.port || 8000

users = []
connections = []
gameRoom = {name:'GAME#1234',users:[]}
timer = 5
flagTimerRunning = false
count = 0

io.on('connection',socket=>{

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

    socket.on('add message',data=>{
        console.log(data)
        if(data.message!=''){
            console.log('new message incoming',data)
            io.emit('broadcast',{...data,type:'newMessage'})
        }
    })

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


    socket.on('removePlayer',data=>{
        console.log('removing '+data+' from game room')
        gameRoom.users.splice(gameRoom.users.indexOf(data),1)
        console.log('new gameroom is',gameRoom)
        io.emit('broadcast',{type:'gameRoomUpdate',game:gameRoom})
        if(users.length<1)
            io.emit('broadcast',{type:'timer',timer:'WAITING FOR PLAYERS'}) 
    })
    // socket.off('removePlayer',()=>{})

    socket.on('change',data=>{
        console.log('changing location to',data.location,'for',data.name)
        socket.to(data.location).emit('broadcast',{channel:data.location,user:data.name, msg:data.name + ' has joined'})
    })

    socket.on('disconnect',(e)=>{
        var pos = connections.indexOf(socket)
        if(users[pos]){
            // io.emit('kickout',users[pos])
            console.log('removing user',users[pos])
            users.splice(pos,1)
            console.log('new users',users)
            connections.splice(pos,1)
        }
        // socket.removeAllListeners(); 
        console.log('Disconneted: %s sockets remaining',connections.length,e)
    })
})



server.listen(port,()=>{
    console.log('server running at ',port)
})