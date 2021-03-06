var express = require("express");
var app = express();

var indexController = require('./controllers/index.controllers.js');
var realtimeControllers = require('./controllers/realtime.controllers.js');
var loginController = require('./controllers/login.controllers');
var timeLineController = require('./controllers/timeLine.Controller');
var chatController = require('./controllers/chat.controllers');

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
        console.log('to', to);

        var params = {
            TableName : "Users",
            KeyConditionExpression: "UserID = :UserID and RefeID = :RefeID",
            ExpressionAttributeValues: {
                ":UserID": to,
                ":RefeID": 'Noti_' + from + '_liked'
            }
        };

        console.log('1---');
        
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
                        console.log('2---');
                        if (err) {
                            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
                        }
                    });

                    //remove like in post not implement yet

                    console.log('3---');
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
                            console.log('4---');
                            var paramsUpdate = {
                                TableName:"Users",
                                Key:{
                                    "UserID": "Post",
                                    "RefeID": ReferenceID
                                },
                                UpdateExpression: "set Info.Liked = :newlist",
                                ExpressionAttributeValues:{
                                    ":newlist": liked
                                }
                            };
                    
                            docClient.update(paramsUpdate, function(err, data) {
                                console.log('5---');
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
                                    "RefeID": ReferenceID
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

    socket.on('get-into-room',function(roomid, token) {
        jwt.verify(token,'secretkey',(err,data) => {
            if(!err) {
                // get userid + name from token
                socket.userID = data.user.userID;
                socket.name = data.user.name;

                // user join into room by roomid
                socket.join(roomid);

                // if user currently in some room, then leave it.
                if(socket.currentRoomID != null) {
                    var currentRoomID = socket.currentRoomID;
                    socket.leave(currentRoomID);
                }

                // set new roomid to socket for using later
                socket.currentRoomID = roomid;
            }
            else 
                socket.emit('err');
        });
    })

    socket.on('receive-msg-to-room-from-client',function(msg) {
        var by = socket.userID;
        var roomid = socket.currentRoomID;
        console.log(`${by} say: ${msg} into room ${roomid}`);
    })

})

app.get('/',function(req,res) {
   indexController.Index(req,res); 
})
app.post('/post',function(req,res) {
    indexController.Post(req,res);
})
app.post('/comment',function(req,res) {
    realtimeControllers.Save(req,res);
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
    console.log("sdasd");
    indexController.Post(req,res);
})
app.get('/timeLinePhoto',function (req,res) {
    timeLineController.photo(req,res)
})
app.get('/timeLineFreinds',function (req,res) {
    timeLineController.freind(req,res)
})
app.get('/timeLineVideo',function (req,res) {
    timeLineController.video(req,res)
})
app.get('/timeLineAbout',function (req,res) {
    timeLineController.about(req,res)
})
app.get('/loadMore',function (req,res) {
    console.log("HAY " + req.query.id + "|" + req.query.ref);
    var id = req.query.id;
    var ref = req.query.ref;
    timeLineController.loadMore(req,res,id,ref);
})
app.get('/loadMoreIndex',function (req,res) {
    console.log("HAY " + req.query.id + "|" + req.query.ref);
    var id = req.query.id;
    var ref = req.query.ref;
    timeLineController.loadMoreIndex(req,res,id,ref);
})
// =====9/12/2019=======
app.post('/reply',function(req,res){
    indexController.Reply(req,res);
 })
 app.post('/postAjax',function(req,res) {
    indexController.PostAjax(req,res);
})

// ===== nam anh =====
app.get('/chat',function(req,res) {
    chatController.chat(req,res);
})