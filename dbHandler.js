const db = require('./database');

const createItem = (table, data, condition, callback) => {
    const sql = `INSERT INTO ${table} ${condition}`;
    db.run(sql, data, function(err) {
        callback(err, {id: this.lastID});
    });
};

const readItems = (table, condition='', callback) => {
    const sql = `SELECT * FROM ${table} ${condition}`;
    db.all(sql, [], callback);
};

const updateItem = (table, conduction, callback) => {
    const sql = `UPDATE ${table} ${conduction}`;
    db.run(sql, [], function(err) {callback(err)});
};

const deleteItem = (id, callback) => {
    const sql = `DELETE FROM chat WHERE id = ?`;
    db.run(sql, id, callback);
};

const createChat = (name, condition, callback) => {
    const sql = `CREATE TABLE IF NOT EXISTS ${name} ${condition}`;
    db.run(sql, [], callback);
};

const checkExistItem = (table, condition, callback) => {
    const sql = `SELECT EXISTS(SELECT * FROM ${table} ${condition})`;
    db.all(sql, [], callback);
};
module.exports = {createItem, readItems, updateItem, deleteItem, createChat, checkExistItem};