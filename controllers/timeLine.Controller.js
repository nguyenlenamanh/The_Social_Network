var AWS = require("aws-sdk");
var formidable = require("formidable");
var fs = require("fs");
var jwt = require('jsonwebtoken');

AWS.config.update({
    region: "us-west-2",
    endpoint: "http://localhost:8000",
    accessKeyId: "accessKeyId",
    secretAccessKey: "secretAccessKey"
});

var docClient = new AWS.DynamoDB.DocumentClient();
// Function RandomID
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
                }
            };
            docClient.query(paramsUserPosts, function(err, data) {
                if (err) {
                    console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                } else {
                    console.log(data);
                    var post = shuffle(data.Items);
                    res.render("timeLine",({posts: post}));
                }
            });
        }
    })
}

module.exports.post = (req, res) => {
    console.log("Post");
    var type = "";
    var url = "";
    let form = new formidable.IncomingForm();
    form.uploadPicture = "public/images/"
    form.uploadVideo = "public/video/"
    form.uploadMusic = "public/music/"
    form.uploadFile = "public/file/"

    form.parse(req, function (err, fields, files) {
        var picture = files.picture.name;
        var video = files.video.name;
        var music = files.music.name;
        var file_document = files.file_document.name;
        // Save File and set type, url
        if (picture != "") {
            let tmpPath = files.picture.path;
            let newPath = form.uploadPicture + files.picture.name;
            fs.rename(tmpPath, newPath, (err) => {
                if (err) console.log(err);
                else {
                    fs.readFile(newPath, (err, fileUploaded) => {
                        if (err) console.log(err);
                        console.log("Saved Picture");
                    });
                }
            });
            type = "Photo";
            url = "/images/" + picture;
            console.log("url ========== " + url);
        } else if (music != "") {
            let tmpPath = files.music.path;
            let newPath = form.uploadMusic + files.music.name;
            fs.rename(tmpPath, newPath, (err) => {
                if (err) console.log(err);
                else {
                    fs.readFile(newPath, (err, fileUploaded) => {
                        if (err) console.log(err);
                        console.log("Saved Music");
                    });
                }
            });
            type = "Music";
            url = "/music/" + music;
        } else if (video != "") {
            let tmpPath = files.video.path;
            let newPath = form.uploadVideo + files.video.name;
            fs.rename(tmpPath, newPath, (err) => {
                if (err) console.log(err);
                else {
                    fs.readFile(newPath, (err, fileUploaded) => {
                        if (err) console.log(err);
                        console.log("Saved Video");
                    });
                }
            });
            type = "Video";
            url = "/video/" + video;
        } else if (file_document != "") {
            let tmpPath = files.file_document.path;
            let newPath = form.uploadFile + files.file_document.name;
            fs.rename(tmpPath, newPath, (err) => {
                if (err) console.log(err);
                else {
                    fs.readFile(newPath, (err, fileUploaded) => {
                        if (err) console.log(err);
                        console.log("Saved File");
                    });
                }
            });
            type = "Text";
            url = "/file/" + file_document;
        }
        // Set Post Time
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0');
        var yyyy = today.getFullYear();
        var postDate = mm + "/" + dd + "/" + yyyy;
        // Set PostID
        var PostID = RandomID();
        // Set UserId
        var UserID = fields.UserID;
        // Set Description
        var description = fields.post_content;
        console.log(PostID);
        // Set Who Can See
        var whoCanSee = [];
        whoCanSee.push(fields.UserID);
        var paramsUserFriends = {
            TableName: "Users",
            KeyConditionExpression: "UserID = :userid and begins_with(RefeID, :reid)",
            ProjectionExpression: 'UserID',
            ExpressionAttributeValues: {
                ":reid": "Friend_",
                ":userid": "123456"
            }
        };
        docClient.query(paramsUserFriends, function (err, data) {
            if (err) {
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            } else {
                console.log("Query List Friend Successed.");
                console.log(data.Items);
                var whoCanSee = [];
                data.Items.forEach(function (Item) {
                    whoCanSee.push(Item.UserID);
                });
                console.log(whoCanSee);
                var paramPost = {
                    TableName: "Users",
                    Item: {
                        "UserID": "Post",
                        "RefeID": "Post" + PostID,
                        "Info": {
                            "Type": type,
                            "Description": description,
                            "URL": url,
                            "PostTime": postDate,
                            "Liked": [],
                            "Comments": [],
                            "WhoCanSee": whoCanSee,
                        }
                    }
                };
                var paramPostUser = {
                    TableName: "Users",
                    Item: {
                        "UserID": UserID,
                        "RefeID": "Post" + PostID,
                        "Info": {
                            "Type": type,
                            "Description": description,
                            "URL": url,
                            "PostTime": postDate,
                            "Liked": [],
                            "Comments": [],
                            "WhoCanSee": whoCanSee,
                            "Sort": Date.now()
                        }
                    }
                };
                // Save Into All Post
                docClient.put(paramPost, function (err, data2) {
                    if (err) console.log(err);
                    else {
                        console.log("Successed");
                        // Save Post of User
                        docClient.put(paramPostUser, function (err, data3) {
                            if (err) console.log(err);
                            else {
                                console.log("Successed");
                                res.redirect('/');
                            }
                        })
                    }
                })
            }
        });
    })
}

module.exports.photo = (req,res) => {
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
                    res.render("timeLinePhoto",({posts: post}));
                }
            });
        }
    })
}