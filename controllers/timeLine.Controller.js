
var AWS = require("aws-sdk");
var formidable = require("formidable");
var fs = require("fs");
var jwt = require('jsonwebtoken');
var moment = require('moment');

AWS.config.update({
    region: "us-west-2",
    endpoint: "http://localhost:8000",
    accessKeyId: "accessKeyId",
    secretAccessKey: "secretAccessKey"
});

var docClient = new AWS.DynamoDB.DocumentClient();
// Function RandomID
//Lỗi ko đăng nhập được
//nguyenlenamanh.2016@outlook.com - 123456
function RandomID(){
    return '_' + Math.random().toString(36).substr(2, 9);
}
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

module.exports.timeLine = (req,res) => {
    //console.log(req.UserID);

    jwt.verify(req.cookies.token,'secretkey',(err,data) => {
        if(err) res.sendStatus(403);
        else {
            console.log(data);
            var paramsUserPosts = {
                TableName : "Users",
                KeyConditionExpression: "UserID = :userid and begins_with(RefeID, :reid)",
                ExpressionAttributeValues: {
                    ":reid": "Post_",
                    ":userid": data.user.userID
                },
                Limit: 4
            };
            userID = data.user.userID;
            docClient.query(paramsUserPosts, function(err, data) {
                if (err) {
                    console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                } else {
                    console.log(data);
                    var post = shuffle(data.Items);
                    res.render("timeLine",({posts: post,userID : userID,moment : moment}));
                }
            });
        }
    })
}

module.exports.photo = (req,res) => {
    jwt.verify(req.cookies.token,'secretkey',(err,data) => {
        if(err) res.sendStatus(403);
        else {
            console.log(data);
            var paramsUserPosts = {
                TableName : "Users",
                KeyConditionExpression: "UserID = :userid and begins_with(RefeID, :reid)",
                ExpressionAttributeValues: {
                    ":reid": "Post_",
                    ":userid": data.user.userID
                }
            };
            docClient.query(paramsUserPosts, function(err, data) {
                if (err) {
                    console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                } else {
                    console.log(data);
                    var post = shuffle(data.Items);
                    res.render("timeLinePhoto",({posts: post}));
                }
            });
        }
    })
}

module.exports.video = (req,res) => {
    //console.log(req.UserID);

    jwt.verify(req.cookies.token,'secretkey',(err,data) => {
        if(err) res.sendStatus(403);
        else {
            console.log(data);
            var paramsUserPosts = {
                TableName : "Users",
                KeyConditionExpression: "UserID = :userid and begins_with(RefeID, :reid)",
                ExpressionAttributeValues: {
                    ":reid": "Post_",
                    ":userid": data.user.userID
                }
            };
            docClient.query(paramsUserPosts, function(err, data) {
                if (err) {
                    console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                } else {
                    console.log(data);
                    var post = shuffle(data.Items);
                    res.render("timeLineVideo",({posts: post}));
                }
            });
        }
    })
}

module.exports.about = (req,res) => {
    //console.log(req.UserID);
    jwt.verify(req.cookies.token,'secretkey', async (err, data) => {
        if (err) res.sendStatus(403);
        else {
            var user = await GetUserByID(data.user.userID);
            console.log(user);
            res.render("timeLineAbout", ({user: user}));
        }
    })
}


module.exports.freind = (req,res) => {
    //console.log(req.UserID);
    jwt.verify(req.cookies.token,'secretkey',(err,data) => {
        if(err) res.sendStatus(403);
        else {
            var paramsUserFriends = {
                TableName : "Users",
                KeyConditionExpression: "UserID = :userid and begins_with(RefeID, :reid)",
                ExpressionAttributeValues: {
                    ":reid": "Friend_",
                    ":userid": data.user.userID
                }
            };
            docClient.query(paramsUserFriends, async function (err, data) {
                if (err) {
                    console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                } else {
                    let ls = [];
                    for (var i = 0; i < data.Count; i++) {
                        var t = await GetUserByID(data.Items[i].RefeID.split('_')[1]);
                        ls.push(t);
                    }
                    console.log(JSON.stringify(ls,null,'\t'));
                    // var post = shuffle(data.Items);
                    res.render("timeLineFreinds", ({posts: ls}));
                }
            });
        }
    })
}

function GetUserByID (userID) {
    return new Promise((resolve,reject) => {
        var paramsUserInfo = {
            TableName : "Users",
            KeyConditionExpression: "UserID = :userid and RefeID = :reid",
            ExpressionAttributeValues: {
                ":reid": userID,
                ":userid": userID
            }
        };

        docClient.query(paramsUserInfo, function(err, data) {
            if (err) {
                return resolve(false);
            } else {
                return resolve(data.Items[0]);
            }
        });
    });
}

module.exports.loadMore = (req,res,count) => {
    //console.log(req.UserID);
    jwt.verify(req.cookies.token,'secretkey', async (err, data) => {
        var num = 4 +count;
        //console.log("----------------------" + num);
        var paramsUserPosts = {
            TableName : "Users",
            KeyConditionExpression: "UserID = :userid and begins_with(RefeID, :reid)",
            ExpressionAttributeValues: {
                ":reid": "Post_",
                ":userid": data.user.userID
            },
            Limit: num
        };

        //console.log(req.get("UserID"));
        docClient.query(paramsUserPosts, function(err, data) {
            if (err) {
                return resolve(false);
            } else {
                let ls = [];
                for(var i = count;i<data.Items.length;i++){
                    //console.log(i + "=" + data.Items.length);
                    ls.push(data.Items[i]);
                }
                //console.log("Danh sach" + JSON.stringify(ls));
                res.render("PostLoad",{posts : ls,moment : moment});
            }
        });
    })
}