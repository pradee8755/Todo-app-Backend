const mongoose = require('mongoose');
const env = require('./constants');
let dbConnection = () => {
    console.log("test", env.userName);
    mongoose.connect(`mongodb+srv://${env.userName}:${env.pass}@mycluster-al81u.mongodb.net/todo?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true }).then(result => {
        console.log("connection established");
    }).catch(err => {
        console.log(`database error${err}`)
    });
}
let dbDisconnect = () => {
    mongoose.connection.close();
    console.log("connection closed")
}
module.exports = {
    connection: dbConnection,
    disconnect: dbDisconnect
}