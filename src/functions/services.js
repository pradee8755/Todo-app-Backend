const userRegister = require('../models/userRegister');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const db = require('../db');
const env = require('../constants');
const io = require("../../server");

module.exports.register = (options) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (options.mailId != '' && options.name != '' && options.password != '' && options.role != '') {
                let validatingUser = await userRegister.findOne({ mailId: options.mailId }).exec().then(doc => {
                    console.log("doc", doc);
                    return doc;
                }).catch(err => {
                    reject({
                        status: 500,
                        message: `Error ${err}`
                    })
                });
                if (validatingUser == null) {
                    bcrypt.hash(options.password, saltRounds).then(hash => {
                        console.log("hash", hash)
                        let hashed = hash;
                        console.log("options", options);
                        user = new userRegister({
                            _id: new mongoose.Types.ObjectId,
                            userName: options.name,
                            mailId: options.mailId,
                            role: options.role,
                            password: hashed,
                            createdDate: new Date()
                        });
                        user.save().then(doc => {
                            console.log("doc", doc);
                            return resolve({
                                status: 200,
                                message: "registation successful"
                            });
                        }).catch(err => {
                            console.log(err)
                            reject({
                                status: 500,
                                message: `Something Went Wrong Please Try Again`
                            });
                        });
                    }).catch(err => {
                        reject({
                            status: 401,
                            message: `Invalid Details`
                        })
                    });
                } else {
                    reject({
                        status: 400,
                        message: `User Exists On This Email Address`
                    })
                }
            } else {
                reject({
                    status: 400,
                    message: `Invalid Inputs`
                });
            }
        } catch (error) {
            return reject({
                status: 500,
                error: error
            })
        }
    });
};


module.exports.login = (options) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (options.mailId != '' && options.password != '') {
                console.log("getUser,", options);
                let findValue = { mailId: options.mailId };
                await userRegister.findOne(findValue).exec().then(doc => {
                    console.log("doc", doc);
                    if (doc == null) {
                        return reject({
                            status: 404,
                            message: `Invalid email`
                        })
                    }
                    bcrypt.compare(options.password, doc.password, async (err, result) => {
                        if (result) {
                            let userDetails = {
                                id: doc._id,
                                name: doc.userName,
                                mailId: doc.mailId,
                                role: doc.role,
                                todos: doc.todoCollection
                            }
                            let token = jwt.sign({
                                email: doc.emailId,
                                userId: doc._id
                            }, env.key, { expiresIn: '10h' });
                            userDetails["token"] = token;
                            if (doc.role == "admin") {
                                await userRegister.find({ role: "user" }).exec().then(users => {
                                    console.log("doc1", users);
                                    let arr = [];
                                    users.forEach((item, i) => {
                                        let obj = {};
                                        obj["userId"] = item._id;
                                        obj["userName"] = item.userName;
                                        obj["mailId"] = item.mailId;
                                        obj["todo"] = item.todoCollection;
                                        arr.push(obj);
                                    });
                                    io.userTodos(arr);
                                    console.log("arr", arr)
                                    return resolve(userDetails);
                                }).catch(err => {
                                    return reject({
                                        status: 404,
                                        message: `Users Not Found ${err}`
                                    })
                                })
                            }
                            else {
                                return resolve(userDetails);
                            }
                        } else {
                            return reject({
                                status: 401,
                                message: `Invalid Password`
                            })
                        }
                    });
                }).catch(err => {
                    console.log("not found");
                    return reject({
                        status: 404,
                        message: `Invalid user ${err}`
                    });
                });
            } else {
                return reject({
                    status: 400,
                    message: `Invalid Inputs`
                })
            }
        } catch (error) {
            return reject({
                status: 500,
                error: error
            })
        }
    });
};

module.exports.createTodo = (options) => {
    return new Promise((resolve, reject) => {
        try {
            if (options.todoDescription != '' && options.priority != '' && options.id != '' && options.mailId != '') {
                console.log("options", options);
                let todo = {};
                todo["todoId"] = new mongoose.Types.ObjectId;
                todo["todo"] = options.todoDescription;
                todo["priority"] = options.priority;
                todo["createdDate"] = new Date();
                todo["status"] = "created";
                userRegister.updateOne({ _id: options.id }, { $push: { todoCollection: todo } }).exec().then(async doc => {
                    console.log("doc", doc);
                    await userRegister.findOne({ _id: options.id }).exec().then(async details => {
                        console.log("details", details)
                        let copyObj = JSON.stringify(details.todoCollection);
                        let objt = {};
                        let obj = details.todoCollection.pop();
                        console.log("details.userName", details.userName)
                        // let todoObj = { ...obj, userName: details.userName, userId: details._id };
                        let userObj = {};
                        userObj.userName = details.userName;
                        userObj.userId = details._id;
                        objt = { todo: obj, userObj: userObj };
                        console.log("obj 2jhsagjhsdgfjsgdajfgdsjfgsjdgf", objt)
                        io.onUsrCreate(objt);
                        return resolve({
                            status: 200,
                            message: "Created Successfully",
                            todos: JSON.parse(copyObj)
                        })
                    }).catch(err => {
                        return reject({
                            status: 404,
                            message: `Not found${err}`
                        });
                    })
                }).catch(err => {
                    return reject({
                        status: 500,
                        message: `${err}`
                    });
                });
            } else {
                return reject({
                    status: 400,
                    message: `Invalid Inputs`
                })
            }
        } catch (error) {
            return reject({
                status: 500,
                error: error
            })
        }
    });
};

module.exports.completedTodo = (options) => {
    return new Promise((resolve, reject) => {
        try {
            if (options.todoId != '' && options.id != '' && options.mailId != '') {
                console.log(options);
                userRegister.updateOne({
                    $and: [{ _id: options.id }, {
                        "todoCollection.todoId": options.todoId
                    }]
                }, { $set: { "todoCollection.$.status": "completed", "todoCollection.$.completedDate": new Date() } }).exec().then(async doc => {
                    await userRegister.findOne({ _id: options.id }).exec().then(details => {
                        console.log("doc", details);
                        let obj = {};
                        console.log("details.userName", details.userName)
                        console.log("todoCollection", details.todoCollection);
                        // console.log("todoId", options.todo.todoId);
                        let value = details.todoCollection.find((item, i) => item.todoId == options.todoId);
                        console.log("value", value)
                        obj = value;
                        let userObj = {};
                        userObj.userName = details.userName;
                        userObj.userId = details._id;
                        objt = { todo: obj, userObj: userObj };
                        console.log("objt", objt)
                        console.log("obj", obj)
                        io.onUsrComplete(objt);
                        return resolve({
                            status: 200,
                            todos: details.todoCollection
                        })
                    }).catch(err => {
                        return reject({
                            status: 500,
                            message: `${err}`
                        });
                    });
                }).catch(err => {
                    return reject({
                        status: 500,
                        message: `${err}`
                    });
                });
            } else {
                return reject({
                    status: 400,
                    message: `Invalid Inputs`
                })
            }
        } catch (error) {
            return reject({
                status: 500,
                error: error
            })
        }
    });
};

module.exports.updateTodo = (options) => {
    return new Promise((resolve, reject) => {
        try {
            if (options.todo.desc != '' && options.todo.priority != '' && options.id != '' && options.todo.todoId != '' && options.todo.updatedTodo != '' && options.todo.createdDate != '' && options.todo.status != '') {
                console.log("options", options.todo.todoId);
                userRegister.updateOne({
                    $and: [{ _id: options.id }, {
                        "todoCollection.todoId": options.todo.todoId
                    }]
                }, { $push: { "todoCollection.$.oldTodos": { todo: options.todo.desc, date: options.todo.updatedDate ? options.todo.updatedDate : options.todo.createdDate, status: options.todo.status } }, $set: { "todoCollection.$.todo": options.todo.updatedTodo, "todoCollection.$.status": "updated", "todoCollection.$.lastUpdatedDate": new Date() } }).exec().then(async ele => {
                    await userRegister.findOne({ _id: options.id }).exec().then(details => {
                        console.log("doc", details);
                        let obj = {};
                        console.log("details.userName", details.userName)
                        console.log("todoCollection", details.todoCollection);
                        console.log("todoId", options.todo.todoId);
                        let value = details.todoCollection.find((item, i) => item.todoId == options.todo.todoId);
                        console.log("value", value)
                        obj = value;
                        let userObj = {};
                        userObj.userName = details.userName;
                        userObj.userId = details._id;
                        objt = { todo: obj, userObj: userObj };
                        console.log("obj 2jhsagjhsdgfjsgdajfgdsjfgsjdgf", objt)
                        console.log("obj", obj)
                        io.onUsrUpdate(objt);
                        resolve({
                            status: 200,
                            todos: details.todoCollection
                        })
                    }).catch(err => {
                        return reject({
                            status: 500,
                            message: `${err}`
                        });
                    })

                }).catch(err => {
                    return reject({
                        status: 500,
                        message: `${err}`
                    });
                });
            } else {
                return reject({
                    status: 400,
                    message: `Invalid Inputs`
                })
            }
        } catch (error) {
            return reject({
                status: 500,
                error: error
            })
        }
    });
};
