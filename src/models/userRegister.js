const mongoose = require('mongoose');

const userRegister = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userName: { type: String, required: true },
    role: { type: String, required: true },
    mailId: { type: String, required: true },
    password: { type: String, required: true },
    createdDate: Date,
    todoCollection: [{
        todoId: mongoose.Schema.Types.ObjectId,
        todo: String,
        oldTodos: [{
            todo: String,
            date: Date,
            status: String
        }],
        priority: String,
        createdDate: Date,
        lastUpdatedDate: Date,
        completedDate: Date,
        status: String
    }]
});

module.exports = mongoose.model("userRegister", userRegister);
