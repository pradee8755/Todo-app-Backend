const express = require('express');
const router = express.Router();
const services = require('../functions/services');
const checkAuth = require("../middle-ware/jwt");

//User Registation
router.post('/register', (req, res, next) => {
    console.log("signup1", req.body);
    services.register(req.body).then((result) => {
        console.log(result);
        res.status(result.status || 200).send(result)
    }).catch((error) => {
        res.status(error.status).send(error);
    });
});
//User Login
router.post('/login', (req, res, next) => {
    console.log(req.body);
    services.login(req.body).then((result) => {
        console.log("getting Final", result);
        res.status(result.status || 200).send(result)
    }).catch((error) => {
        res.status(error.status).send(error);
    });
});
//Create Todo
router.post('/createTodo', checkAuth, (req, res, next) => {
    console.log("createProduct", req.userData);
    console.log(req.header);
    services.createTodo(req.body).then((result) => {
        // console.log(result);
        res.status(result.status || 200).send(result)
    }).catch((error) => {
        res.status(error.status).send(error);
    });
});

//Set Todo status as complete
router.put('/completedTodo', checkAuth, (req, res, next) => {
    console.log("createProduct");
    console.log(req.file);
    services.completedTodo(req.body).then((result) => {
        console.log(result);
        res.status(result.status || 200).send(result)
    }).catch((error) => {
        res.status(error.status).send(error);
    });
});

//Edit Todo 
router.put('/updateTodo', checkAuth, (req, res, next) => {
    console.log("createProduct");
    console.log(req.file);
    services.updateTodo(req.body).then((result) => {
        console.log(result);
        res.status(result.status || 200).send(result)
    }).catch((error) => {
        res.status(error.status).send(error);
    });
});

module.exports = router;