const express = require('express');
const { connect } = require('http2');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
//const NodeRSA = require('node-rsa');

const {createItem, readItems, updateItem, deleteItem, createChat, checkExistItem} = require('./dbHandler');
app.use(express.json());
 
server.listen(3000);

app.use(express.static(__dirname));

app.get('/', function(request, respons) {
    respons.sendFile(__dirname + '/src/index.html');
});
 
connections = {}; // id-> login 
logins = {}; // login -> id
//userKeys = {}; // id -> pub/priv keys

/*
function decodeRequest(id, hash){
    let keyPrivate = new NodeRSA(userKeys[id].privateKey);

    let tmp = new NodeRSA(userKeys[id].publicKey);
    let h1 = tmp.encrypt('Hello', 'base64');
    let h2 = tmp.encrypt('Hello', 'base64');

    console.log(keyPrivate.decrypt(h1, 'utf8'));
    console.log(keyPrivate.decrypt(h2, 'utf8'));

    console.log(hash);

    console.log(keyPrivate.decrypt(hash, 'utf8'));
    return keyPrivate.decrypt(hash, 'utf8');//can't decode
}*/

io.sockets.on('connection', function(newSocket){
    console.log(`-----User ${newSocket.id} connected`); 
    connections[newSocket.id] = ''; // login

    console.log('connections:', connections);
    console.log('logins:', logins);

    // diconnect
    newSocket.on('disconnect', function(data){
        if(connections[newSocket.id] != '') delete logins[connections[newSocket.id]];
        delete connections[newSocket.id];
        console.log(`User ${newSocket.id} disconnected`);
    });

    /*
    newSocket.on('getKey', function() {
        const keys = new NodeRSA({b: 1024});
        const publicKey = keys.exportKey('public');
        const privateKey = keys.exportKey('private');

        userKeys[newSocket.id] = {publicKey: publicKey, privateKey: privateKey};

        io.sockets.to(newSocket.id).emit('key', {publicKey: publicKey});
    });*/

    // prints 
    
    readItems('users', '', (err, items) => {
        if(err) console.error(err.message);
        else {
            console.log('users: ', items);
            readItems('chats', '', (err, items) => {
                if(err)console.error(err.message);
                else console.log('chats: ', items);
            }); 
        }
    }); 

    // logIn / signIn
    newSocket.on('login', function(data){
        if(data.type == 0){
            readItems('users', `WHERE login = "${data.login}"`, (err, items) => {
                console.log('LogIn: ', data);
                if(err){
                    console.error(err.message);
                    io.sockets.to(newSocket.id).emit('error', {type: 'login', message: 'Server error! Please, try later'});
                }else{
                    if(items.length === 1){
                        console.log('User found');
                        if(items[0].password != data.password){
                            console.log('Wrong password');
                            io.sockets.to(newSocket.id).emit('error', {type: 'login', message: 'Wrong password'});
                        }else {
                            updateItem('users', `SET currentChatID = ${data.chatID} WHERE login = "${data.login}"`, (err) => {
                                if(err){
                                    console.log(err.message);
                                    io.sockets.to(newSocket.id).emit('error', {type: 'login', message: 'Server error! Try later'});
                                }else {
                                    io.sockets.to(newSocket.id).emit('veryfication', {name: data.login});

                                    if(connections[newSocket.id] != '') delete logins[connections[newSocket.id]];
                                    connections[newSocket.id] = data.login;
                                    logins[data.login] = newSocket.id;
                                }
                            });
                        }
                    }else{
                        console.log('Founded users: ', items);
                        io.sockets.to(newSocket.id).emit('error', {type: 'login', message: 'User not found'});
                    }       
                }
            }); 
        }else if(data.type == 1){
            readItems('users', `WHERE login = "${data.login}"`, (err, items) => {
                console.log('LogIn: ', data);
                if(err){
                    console.error(err.message);
                    io.sockets.to(newSocket.id).emit('error', {type: 'login', message: 'Server error, please, try later'});
                }else{
                    if(items.length !== 0){
                        console.log('User already exist');
                        io.sockets.to(newSocket.id).emit('error', {type: 'login', message: 'User is already exist'});
                    }else{
                        createItem('users', [data.login, data.password, 1], `(login, password, currentChatID) VALUES (?, ?, ?)`, (err) => {
                            if(err){
                                console.error(err.message);
                                io.sockets.to(newSocket.id).emit('error', {type: 'login', message: 'Server error! Can\'t create this user'});
                            }else{
                                console.log(`User ${data.login} authorized`);

                                if(connections[newSocket.id] != '') delete login[connections[newSocket.id]];
                                connections[newSocket.id] = data.login;
                                logins[data.login] = newSocket.id;

                                io.sockets.to(newSocket.id).emit('veryfication', {name: data.login});
                            }
                        });
                    }       
                }
            }); 
        } 
    });  

    // last messages and all chats from global chat
    newSocket.on('get userData', function(data) {
        if(data.login != ""){
            if(connections[newSocket.id] != '') delete logins[connections[newSocket.id]];
            connections[newSocket.id] = data.login;
            logins[data.login] = newSocket.id;

            readItems('users', `WHERE login = "${data.login}"`, (err, user) => {
                if(err) {
                    console.log(err.message);
                    io.sockets.to(newSocket.id).emit('error', {type: 'get userData', message: 'Server error! Try laterr'});
                }else{
                    let chatID = (user) ? 1 : user[0].currentChatID;
                    readItems('chatMsgs', `WHERE chatID = ${chatID} ORDER BY id DESC LIMIT ${10}`, (err, items) => {
                        if(err) {
                            console.error(err.message);
                            io.sockets.to(newSocket.id).emit('error', {type: 'get userData', message: 'Server error! Can\t read last messages'});
                        }
                        else{
                            io.sockets.to(newSocket.id).emit('last messages', {chatID: 1, chatName: 'Global', messages: items.reverse()});
                            // all user chats
                            readItems('usersChat', `WHERE login = "${data.login}"`, (err, items) => {
                                if(err) {
                                    console.log(err.message);
                                    io.sockets.to(newSocket.id).emit('error', {type: 'get userData', message: 'Server error! Can\t get your chats'});
                                }
                                else {
                                    items.push({chatID: 1, chatPassword: '', chatName: 'global'});
                                    io.sockets.to(newSocket.id).emit('all chats', items);
                                }
                            });
                        }
                    }); 
                }
            });
        }else{// stupid but work
            if(connections[newSocket.id] != '') delete logins[connections[newSocket.id]];
            connections[newSocket.id] = '';

            readItems('chatMsgs', `WHERE chatID = 1 ORDER BY id DESC LIMIT ${10}`, (err, items) => {
                if(err) {
                    console.error(err.message);
                    io.sockets.to(newSocket.id).emit('error', {type: 'get userData', message: 'Server error! Can\t read last messages'});
                }
                else{
                    io.sockets.to(newSocket.id).emit('last messages', {chatID: 1, chatName: 'Global', messages: items.reverse()});
                    // all user chats
                    readItems('usersChat', `WHERE login = "${data.login}"`, (err, items) => {
                        if(err) {
                            console.log(err.message);
                            io.sockets.to(newSocket.id).emit('error', {type: 'get userData', message: 'Server error! Can\t get your chats'});
                        }
                        else {
                            items.push({chatID: 1, chatPassword: '', chatName: 'global'});
                            io.sockets.to(newSocket.id).emit('all chats', items);
                        }
                    });
                }
            }); 
        }
    });

    // send message
    newSocket.on('send message', function(data){
        //const data = JSON.parse( decodeRequest(newSocket.id, hashData.hash) );
        createItem(`chatMsgs`, [data.chatID, data.login, data.message, data.time], `(chatID, name, message, time) VALUES (?, ?, ?, ?)`, (err) => {
            if(err) {
                console.error(err.message);
                io.sockets.to(newSocket.id).emit('error', {type: 'send message', message: 'Server error! Can\t send your message'});
            }
            else{
                console.log(`Message '${data.message}' added to chatMsgs chat: #${data.chatID}`);
                //io.sockets.emit('add message', data);
                readItems('users', `WHERE currentChatID = ${data.chatID}`, (err, users) => {
                    if(err || users == null){
                        console.log(err.message);
                        io.sockets.to(newSocket.id).emit('error', {type: 'send message', message: 'Server error! Can\t send your message to other users'});
                    }else{
                        console.log(users);
                        console.log(logins);
                        for(let i = 0; i < users.length; i++){
                            io.sockets.to( logins[users[i].login] ).emit('add message', data);
                        }
                    }
                });
            } 
        });
    });

    // enter to chat
    newSocket.on('add chat', function(data){
        readItems('chats', `WHERE id = ${data.chatID}`, (err, items) => {
            if(err) console.error(err.message);
            else{
                if (items.length == 0) {
                    console.log('Chat not found');
                    io.sockets.to(newSocket.id).emit('error', {type: 'add chat', message: 'Chat not found'});
                }
                else if(data.chatID != 1 && items[0].password != data.password) {
                    console.log(`Wrong password! Access denied! ${data.id}`);
                    io.sockets.to(newSocket.id).emit('error', {type: 'add chat', message: 'Wrong password'});
                }
                else{
                    checkExistItem('usersChat', `WHERE login = "${data.login}" AND chatID = ${data.chatID}`, (err, isExist) => {
                        if(err) {
                            console.log(err.message);
                            io.sockets.to(newSocket.id).emit('error', {type: 'add chat', message: 'Server error! Try later'});
                        }
                        else{
                            if(Object.values(isExist[0])[0] == 0){
                                createItem(`usersChat`, [data.login, data.chatID, items[0].name, data.password], `(login, chatID, chatName, chatPassword) VALUES (?, ?, ?, ?)`, (err) => {
                                    if(err) {
                                        console.error(err.message);
                                        io.sockets.to(newSocket.id).emit('error', {type: 'add chat', message: 'Server error! Can\'t connect to the chat! Try later'});
                                        return;
                                    }
                                    else console.log(`User: ${data.login} added to chat: ${items[0].name}#${data.chatID}`);
                                });
                            }

                            updateItem('users', `SET currentChatID = ${data.chatID} WHERE login = "${data.login}"`, (err) => {
                                if(err){
                                    console.log(err.message);
                                    io.sockets.to(newSocket.id).emit('error', {type: 'add chat', message: 'Server error! Try later'});
                                }else{
                                    readItems(`chatMsgs`, `WHERE chatID = ${data.chatID} ORDER BY id DESC LIMIT ${10}`, (err, messages) => {
                                        if(err) {
                                            console.error(err.message);
                                            io.sockets.to(newSocket.id).emit('error', {type: 'add chat', message: 'Server error! Can\'t read last messages'});
                                        }
                                        else io.sockets.to(newSocket.id).emit('last messages', {chatID: data.chatID, chatName: items[0].name, chatPassword: data.password, messages: messages.reverse()});
                                    }); 
                                }
                            });
                        }
                    });

                }
            }
        });
    });

    // create a new chat
    newSocket.on('create chat', function(data){ // TODO replace [user to login] in send.js
        checkExistItem('chats', `WHERE name = "${data.name}" AND password = "${data.password}"`, (err, isExist) => {
            if(err){
                console.log(err.message);
                io.sockets.to(newSocket.id).emit('error', {type: 'create chat', message: 'Server error! Try later'});
            }
            else{
                if(Object.values(isExist[0])[0] != 0) {
                    console.log(`Chat ${data.name} with password ${data.password} is already exist`);
                    io.sockets.to(newSocket.id).emit('error', {type: 'create chat', message: 'This chat is already exist'});
                }
                else{
                    createItem('chats', [data.name, data.password], `(name, password) VALUES (?, ?)`, (err, chatID) => {
                        if(err) {
                            console.error(err.message);
                            io.sockets.to(newSocket.id).emit('error', {type: 'create chat', message: 'Server error! Try later'});
                        }
                        else{
                            createItem(`usersChat`, [data.login, chatID.id, data.name, data.password], '(login, chatID, chatName, chatPassword) VALUES (?, ?, ?, ?)', (err) => {
                                if(err) {
                                    console.log(err.message);
                                    io.sockets.to(newSocket.id).emit('error', {type: 'create chat', message: 'Server error! Can\'t create a new chat'});
                                }
                                else {
                                    console.log(`chat: ${data.name}#${chatID.id} connected to user: ${data.login}`);
                                    
                                    createItem(`chatMsgs`, [chatID.id, 'admin', `user ${data.login} started a new chat`, data.time], '(chatID, name, message, time) VALUES (?, ?, ?, ?)', (err) => {
                                        if(err) {
                                            console.log(err.message);
                                            io.sockets.to(newSocket.id).emit('error', {type: 'create chat', message: 'Server error! Can\'t add new message to the chat'});
                                        }
                                        else { 
                                            console.log(`Welcome msg added to chat: ${data.name}#${chatID.id}`);

                                            updateItem('users', `SET currentChatID = ${chatID.id} WHERE login = "${data.login}"`, (err) => {
                                                if(err){
                                                    console.log(err.message);
                                                    io.sockets.to(newSocket.id).emit('error', {type: 'add chat', message: 'Server error! Try later'});
                                                }else{
                                                    readItems(`chatMsgs`, `WHERE chatID = ${chatID.id} ORDER BY id DESC LIMIT ${10}`, (err, items) => {
                                                        if(err){
                                                            console.log(err.message);
                                                            io.sockets.to(newSocket.id).emit('error', {type: 'create chat', message: 'Server error! Can\'t read last messages'});
                                                        }
                                                        else io.sockets.to(newSocket.id).emit('last messages', {chatID: chatID.id, chatName: data.name, chatPassword: data.password, messages: items.reverse()});
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }  
            }
        });
    });
});