var AWS = require("aws-sdk");
var formidable = require("formidable");
var fs = require("fs");
var jwt = require('jsonwebtoken');
var multer = require("multer");
var postControllers = require("./post.controllers");
var moment = require('moment');
AWS.config.update({
    region: "us-west-2",
    endpoint: "http://localhost:8000",
    accessKeyId: "accessKeyId",
    secretAccessKey: "secretAccessKey"
});

var docClient = new AWS.DynamoDB.DocumentClient();

// Function RandomID
function RandomID() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Function Random New Feed
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
//Lỗi lúc thêm bài mới, ko add freind vào WhoCanSee
module.exports.Index = (req, res) => {
    //console.log(req.UserID);
    var userID = "";
    jwt.verify(req.cookies.token, 'secretkey', (err, data) => {
        if (err) res.sendStatus(403);
        else {
            console.log(data);
            // var paramsAllPost = {
            //     TableName: "Users",
            //     KeyConditionExpression: "UserID = :post",
            //     //ProjectionExpression: 'Info.WhoCanSee.UserID',
            //     FilterExpression: "contains(Info.WhoCanSee, :id)",
            //     ExpressionAttributeValues: {
            //         ":post": "Post",
            //         ":id": data.user.userID
            //     },
            //     Limit: 4
            // }
            var paramsAllPost = {
                TableName: "Users",
                KeyConditionExpression: "UserID = :post",
                FilterExpression:"contains(Info.WhoCanSee, :id)",
                ExpressionAttributeValues: {
                    ":post": "Post",
                    ":id": data.user.userID
                },
                Limit:4
            };
            userID = data.user.userID;
            docClient.query(paramsAllPost, function (err, data) {
                if (err) {
                    console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Query succeeded.");
                    console.log("Count: " + data.Items.length);
                    // console.log(data.Items[0].Info.Comments.length);
                    console.log(data);
                    var post = shuffle(data.Items);
                    var lastItem = data.Items[data.Items.length-1];//Việt Thêm và thêm lastPostID & lastPostRef
                    //  console.log("Random");

                    res.render("index", ({ posts: post, userID: userID, moment: moment, lastPostID: lastItem.UserID, lastPostRef: lastItem.RefeID }));
                }
            });
        }
    })
}
module.exports.Comments = (req, res) => {
    let form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var paramsSpecificPost = {
            TableName: "Users",
            KeyConditionExpression: "UserID = :userID AND RefeID = :postID",
            ProjectionExpression: 'Info.Comments',
            //FilterExpression: "contains(Info.WhoCanSee, :id)",
            ExpressionAttributeValues: {
                ":userID": fields.UserIDOwner,
                ":postID": fields.postID
            }
        }
        var cmt = {
            "CommentID": "Post" + RandomID(),
            "Content": fields.comment_content,
            "PostDate": new Date(),
            "Comments": [],
            "UserName": fields.userName
        };
        docClient.query(paramsSpecificPost, function (err, data) {
            if (err) console.log(err);
            else {
                data.Items[0].Info.Comments.push(cmt);
                var params = {
                    TableName: "Users",
                    Key: {
                        "UserID": fields.UserIDOwner,
                        "RefeID": fields.postID
                    },
                    UpdateExpression: "set Info.Comments=:cmt",
                    ExpressionAttributeValues: {
                        ":cmt": data.Items[0].Info.Comments
                    },
                    ReturnValues: "UPDATED_NEW"
                };
                docClient.update(params, function (err, data1) {
                    if (err) console.log(err);
                    else {
                        var params = {
                            TableName: "Users",
                            Key: {
                                "UserID": "Post",
                                "RefeID": fields.postID
                            },
                            UpdateExpression: "set Info.Comments=:cmt",
                            ExpressionAttributeValues: {
                                ":cmt": data.Items[0].Info.Comments
                            },
                            ReturnValues: "UPDATED_NEW"
                        };
                        docClient.update(params, function (err, data2) {
                            if (err) console.log(err);
                            else {
                                res.redirect("/");
                            }
                        })
                    }
                })
            }
        });
    })
}
module.exports.Reply = (req, res) => {
    console.log(req.body.keyPair);
    var keyPair = req.body.keyPair;
    var postID = keyPair.split(";")[0];
    var commentID = keyPair.split(";")[1];
    var paramsSpecificPost = {
        TableName: "Users",
        KeyConditionExpression: "UserID = :userID AND RefeID = :postID",
        ProjectionExpression: 'Info.Comments',
        ExpressionAttributeValues: {
            ":userID": req.body.UserIDOwner,
            ":postID": req.body.postID,
        }
    }
    var id = "CommentID_" + RandomID();
    var date = new Date();
    var cmt = {
        "CommentID": id,
        "Content": req.body.comment_content,
        "PostDate": date.toJSON(),
        "Comments": [],
        "UserName": req.body.userName,
        "UserIDOwerComment": req.body.UserIDOwerComment
    };
    docClient.query(paramsSpecificPost, function (err, data) {
        if (err) console.log(err);
        else {
            var ind;
            data.Items[0].Info.Comments.forEach(function (comment, index) {
                if (comment.CommentID == commentID) {
                    ind = index;
                    return;
                }
            });
            data.Items[0].Info.Comments[ind].Comments.push(cmt);
            var stringUpdate = "set Info.Comments[" + ind + "].Comments";
            var params = {
                TableName: "Users",
                Key: {
                    "UserID": req.body.UserIDOwner,
                    "RefeID": req.body.postID
                },
                UpdateExpression: stringUpdate + "=:cmt",
                ExpressionAttributeValues: {

                    ":cmt": data.Items[0].Info.Comments[ind].Comments
                },
                ReturnValues: "UPDATED_NEW"
            };
            docClient.update(params, function (err, data1) {
                if (err) {
                    console.log(err);
                    res.json({ "status": 500 });
                }
                else {
                    params = {
                        TableName: "Users",
                        Key: {
                            "UserID": "Post",
                            "RefeID": req.body.postID
                        },
                        UpdateExpression: stringUpdate + "=:cmt",
                        ExpressionAttributeValues: {

                            ":cmt": data.Items[0].Info.Comments[ind].Comments
                        },
                        ReturnValues: "UPDATED_NEW"
                    };
                    docClient.update(params, function (err, data2) {
                        if (err) {
                            console.log(err);
                            res.json({ "status": 500 });
                        }
                        else {
                            console.log("Updated");
                            res.render("replay", { comment: cmt, postID: req.body.postID });
                            // res.json({status : 200,userName: req.body.userName,commentID : id,postDate : date});
                        }
                    })
                }
            })
        }
    })
}
// New Post
module.exports.PostAjax = (req, res) => {
    var storage = multer.memoryStorage();
    var upload = multer({ storage: storage }).any();
    var type = " ";
    var url = " ";
    var postDate;
    var PostID = RandomID();
    var uploadPicture = postControllers.single("file");
    uploadPicture(req, res, function (err) {
        if (err) console.log(err);
        else {
            console.log(req.file);
            if (typeof (req.file) != "undefined") url = req.file.location;
            type = req.body.type;
            postDate = new Date();
            var paramsUserFriends = {
                TableName: "Users",
                KeyConditionExpression: "UserID = :userid and begins_with(RefeID, :reid)",
                //ProjectionExpression: 'UserID',
                ExpressionAttributeValues: {
                    ":reid": "Friend_",
                    ":userid": req.body.UserID
                }
            };
            docClient.query(paramsUserFriends, function (err, data) {
                if (err) {
                    console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Query List Friend Successed.");
                    console.log(data.Items);
                    var whoCanSee = [];
                    whoCanSee.push(req.body.UserID);
                    data.Items.forEach(function (Item) {
                        //whoCanSee.push(Item.UserID);
                        whoCanSee.push(Item.RefeID.split('_')[1]);
                    });
                    console.log("Who Can See ==>" + whoCanSee);
                    var paramPost = {
                        TableName: "Users",
                        Item: {
                            "UserID": "Post",
                            "RefeID": "Post" + PostID,
                            "Info": {
                                "Type": type,
                                "Description": req.body.content,
                                "URL": url,
                                "PostTime": postDate.toJSON(),
                                "Liked": [],
                                "Comments": [],
                                "WhoCanSee": whoCanSee,
                                "By": req.body.UserID
                            }
                        }
                    };
                    var paramPostUser = {
                        TableName: "Users",
                        Item: {
                            "UserID": req.body.UserID,
                            "RefeID": "Post" + PostID,
                            "Info": {
                                "Type": type,
                                "Description": req.body.content,
                                "URL": url,
                                "PostTime": postDate,
                                "Liked": [],
                                "Comments": [],
                                "WhoCanSee": whoCanSee,
                                "By": req.body.UserID,
                                "Sort": Date.now()
                            }
                        }
                    };
                    // Save Into All Post
                    docClient.put(paramPost, function (err, data2) {
                        if (err) console.log(err);
                        else {
                            //console.log("Successed");
                            //console.log(JSON.stringify(paramPostUser.Item));
                            // Save Post of User
                            docClient.put(paramPostUser, function (err, data3) {
                                if (err) console.log(err);
                                else {
                                    console.log("Successed");
                                    console.log(JSON.stringify(data3));
                                    res.render("newPost", { post: paramPostUser.Item, moment: moment });
                                }
                            })
                        }
                    })
                }
            });
        }
    })
}