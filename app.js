var express = require("express");
var app = express();
var indexController = require('./controllers/index.controllers.js');
var realtimeControllers = require('./controllers/realtime.controllers.js');
var loginController = require('./controllers/login.controllers');
var timeLineController = require('./controllers/timeLine.Controller');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var AWS = require("aws-sdk");
const shortid = require('shortid');

app.use(express.static('public'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
AWS.config.update({
    region: "us-west-2",
    endpoint: "http://localhost:8000",
    accessKeyId: "accessKeyId",
    secretAccessKey: "secretAccessKey"
});


app.set('view engine','ejs');
app.set('views','./views');

var docClient = new AWS.DynamoDB.DocumentClient();
var server = require('http').Server(app);
var io = require('socket.io')(server);
server.listen(3000);

var connectedUsers = {};

io.on('connection',function(socket) {
    //console.log(socket.id + ' connected');

    socket.on('save-comment',function(data) {       
        var result = realtimeControllers.Save(data);
        io.sockets.emit('display-comment',data);
    })

    socket.on('register',function(data) {
        jwt.verify(data,'secretkey',(err,data) => {
            console.log('---data test---');
            console.log(data);

            socket.userID = data.user.userID;
            socket.name = data.user.name;

            if(connectedUsers.hasOwnProperty(data.user.userID)) {
                connectedUsers[data.user.userID].push(socket.id);
            }else {
                connectedUsers[data.user.userID] = [socket.id];
            }


            socket.emit('setuser',socket.userID,socket.name);
            console.log("---connected users---")

            console.log(connectedUsers);
        })
    })

    socket.on('disconnect', function() {
        if(socket.userID && connectedUsers.hasOwnProperty(socket.userID) && connectedUsers[socket.userID].length > 0)
            connectedUsers[socket.userID].splice(connectedUsers[socket.userID].indexOf(socket.id),1);
        if(socket.userID && connectedUsers.hasOwnProperty(socket.userID) && connectedUsers[socket.userID].length <= 0){
            delete connectedUsers[socket.userID];
            console.log("---connected users---")

            console.log(connectedUsers);
        } 
    });

    socket.on('send-noti-message',function(from,to,action,ReferenceID) {
        var params = {
            TableName : "Users",
            KeyConditionExpression: "UserID = :UserID and RefeID = :RefeID",
            ExpressionAttributeValues: {
                ":UserID": to,
                ":RefeID": 'Noti_' + from + '_liked'
            }
        };
        
        docClient.query(params, function(err, data) {
            if (err) {
            } else {
                // if liked then when clicked it means delete
                if(data.Items.length > 0) {
                    var params = {
                        TableName: "Users",
                        Key:{
                            "UserID": to,
                            "RefeID": 'Noti_' + from + '_liked'
                        }
                    };
                    docClient.delete(params, function(err, data) {
                        if (err) {
                            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
                        }
                    });

                    //remove like in post not implement yet

                    var paramsSpecificPost = {
                        TableName : "Users",
                        KeyConditionExpression: "UserID = :post and RefeID = :RefeID",
                        ExpressionAttributeValues: {
                            ":post": "Post",
                            ":RefeID": ReferenceID
                        }
                    }
                    
                    docClient.query(paramsSpecificPost, function(err, data) {
                        if (err) {
                            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            var liked = data.Items[0].Info.Liked;
                            liked.splice(liked.indexOf(from),1);
                            console.log(liked);
                    
                            var paramsUpdate = {
                                TableName:"Users",
                                Key:{
                                    "UserID": "Post",
                                    "RefeID": "Post_TestDemo01"
                                },
                                UpdateExpression: "set Info.Liked = :newlist",
                                ExpressionAttributeValues:{
                                    ":newlist": liked
                                }
                            };
                    
                            docClient.update(paramsUpdate, function(err, data) {
                                if (err) {
                                    console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                                } else {
                                    console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                                }
                            });
                        }
                    });

                    var paramsSpecificPost1 = {
                        TableName : "Users",
                        KeyConditionExpression: "UserID = :post and RefeID = :RefeID",
                        ExpressionAttributeValues: {
                            ":post": to,
                            ":RefeID": ReferenceID
                        }
                    }
                    
                    docClient.query(paramsSpecificPost1, function(err, data) {
                        if (err) {
                            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            var liked = data.Items[0].Info.Liked;
                            liked.splice(liked.indexOf(from),1);
                            console.log(liked);
                    
                            var paramsUpdate = {
                                TableName:"Users",
                                Key:{
                                    "UserID": to,
                                    "RefeID": "Post_TestDemo01"
                                },
                                UpdateExpression: "set Info.Liked = :newlist",
                                ExpressionAttributeValues:{
                                    ":newlist": liked
                                }
                            };
                    
                            docClient.update(paramsUpdate, function(err, data) {
                                if (err) {
                                    console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                                } else {
                                    console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                                }
                            });
                        }
                    });

                }else {
                    //set like in post implemented

                    console.log('---starting here---');
                    console.log(from);
                    console.log(to);
                    console.log(action);
                    console.log(ReferenceID);

                    var paramsUpdateLikeOnUserPost = {
                        TableName: "Users",
                        Key:{
                            "UserID": to,
                            "RefeID": ReferenceID
                        },
                        UpdateExpression: "set Info.Liked = list_append(Info.Liked,:userid)",
                        ExpressionAttributeValues:{
                            ":userid": [from]
                        }
                    };

                    docClient.update(paramsUpdateLikeOnUserPost, function(err, data) {
                        if (err) {
                            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                        }
                    });

                    var paramsUpdateLikeOnPost = {
                        TableName: "Users",
                        Key:{
                            "UserID": 'Post',
                            "RefeID": ReferenceID
                        },
                        UpdateExpression: "set Info.Liked = list_append(Info.Liked,:userid)",
                        ExpressionAttributeValues:{
                            ":userid": [from]
                        }
                    };

                    docClient.update(paramsUpdateLikeOnPost, function(err, data) {
                        if (err) {
                            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                        }
                    });

                            
                    if(from !== to) {
                        var params = {
                            TableName: "Users",
                            Item:{
                                "UserID": to,
                                "RefeID": 'Noti_' + from + '_liked',
                                "Info":{
                                    "Content": `${socket.name} đã ${action} bài viết của bạn.`,
                                    "Type": action,
                                    "ReferenceID": ReferenceID,
                                    "DateTime": new Date().toISOString(),
                                    "Read": false
                                }
                            }
                        };
                
                        docClient.put(params,function(err,data) {
                            if(err) socket.emit('err');
                            else {
                                if(connectedUsers.hasOwnProperty(to)) {
                                    connectedUsers[to].forEach((socketid) => {
                                        io.to(socketid).emit('receive-noti',`${socket.name} đã ${action} bài viết của bạn.`);
                                    })
                                }
                            }
                        })
                    }
                }
            }
        });
    })

})

app.get('/',function(req,res) {
   indexController.Index(req,res); 
})
app.post('/post',function(req,res) {
    indexController.Post(req,res);
})
app.post('/comment',function(req,res) {
    indexController.Comments(req,res);
})
app.get('/login',function(req,res) {
    loginController.login(req,res);
})
app.post('/login',function(req,res) {
    loginController.loginPost(req,res);
})

//=======================================================================Viet
app.get('/timeLine',function (req,res) {
    timeLineController.timeLine(req,res)
})

app.post('/timeLine',function (req,res) {
    timeLineController.post(req,res)
})
app.get('/timeLinePhoto',function (req,res) {
    timeLineController.photo(req,res)
})
app.get('/timeLineFreinds',function (req,res) {
    timeLineController.freind(req,res)
})

app.get('/timeLineAbout',function (req,res) {

    timeLineController.about(req,res)
})