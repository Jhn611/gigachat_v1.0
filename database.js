const sqlite = require('sqlite3').verbose();
const dbName = 'database.db';
let db = new sqlite.Database(dbName, (err) => {
    if(err){
        console.error(err.message);
    }else{
        console.log("DB connected");
        db.run('CREATE TABLE IF NOT EXISTS usersChat (id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT, chatID INTEGER, chatName TEXT, chatPassword TEXT)', (err) => {
            if(err){
                console.error(err.message);
            }else{
                console.log("Table userChats created or existed");
            }
        });
        db.run('CREATE TABLE IF NOT EXISTS chatMsgs (id INTEGER PRIMARY KEY AUTOINCREMENT, chatID INTEGER, name TEXT, message TEXT, time TEXT)', (err) => {
            if(err){
                console.error(err.message);
            }else{
                console.log("Table chatMsgs created or existed");
            }
        });
        db.run('CREATE TABLE IF NOT EXISTS chats (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, password TEXT)', (err) => {
            if(err){
                console.error(err.message);
            }else{
                console.log("Table chats created or existed");
                db.all('SELECT * FROM chats WHERE id = 1', [], (err, items) => {
                    if(err) console.log(err.message);
                    else {
                        if(items.length === 0){
                            db.run('INSERT INTO chats (name) VALUES (?)', ['Global'], (err) => {
                                if(err) console.error(err.message);
                                else console.log('Global chat inserted into chats');
                            });
                        }else console.log('Global chat is already exists');
                    }
                });
                
            }
        });
        db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT, password TEXT, currentChatID INTEGER)', (err) => {
            if(err){
                console.error(err.message);
            }else{
                console.log("Table users created or existed");
            }
        });
    }
});

module.exports = db;