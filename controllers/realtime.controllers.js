var AWS = require("aws-sdk");
var formidable = require("formidable");

var fs = require("fs");
AWS.config.update({
    region: "us-west-2",
    endpoint: "http://localhost:8000",
    accessKeyId: "accessKeyId",
    secretAccessKey: "secretAccessKey"
  });
function RandomID(){
    return '_' + Math.random().toString(36).substr(2, 9);
}
var docClient = new AWS.DynamoDB.DocumentClient();
module.exports =  {   Save(req,res){
    console.log(req.body);
    var paramsSpecificPost = {
        TableName : "Users",
        KeyConditionExpression: "UserID = :userID AND RefeID = :postID",
        ProjectionExpression: 'Info.Comments',
        //FilterExpression: "contains(Info.WhoCanSee, :id)",
        ExpressionAttributeValues: {
            ":userID": req.body.UserIDOwner,        
            ":postID" : req.body.postID
        }
    }
    var id = "CommentID_" + RandomID();
    var date = new Date();
    var cmt = {
        "CommentID" : id,
        "Content" : req.body.comment_content,
        "PostDate" : date,
        "Comments" : [],
        "UserName" : req.body.userName
    };  
    
    docClient.query(paramsSpecificPost,function(err,data){
        if(err) console.log(err);
        else {
            data.Items[0].Info.Comments.push(cmt);
            var params = {
                TableName: "Users",
                Key:{
                    "UserID": req.body.UserIDOwner,
                    "RefeID": req.body.postID
                },
                UpdateExpression: "set Info.Comments=:cmt",
                ExpressionAttributeValues:{
                    ":cmt" : data.Items[0].Info.Comments
                },
                ReturnValues:"UPDATED_NEW"
            };
            docClient.update(params,function(err,data1){
                if(err) {
                    console.log(err);
                    res.json({status : 500});
                }
                else {
                    var params = {
                        TableName: "Users",
                        Key:{
                            "UserID": "Post",
                            "RefeID": req.body.postID
                        },
                        UpdateExpression: "set Info.Comments=:cmt",
                        ExpressionAttributeValues:{
                            ":cmt" : data.Items[0].Info.Comments
                        },
                        ReturnValues:"UPDATED_NEW"
                    };
                    docClient.update(params,function(err,data2){
                        if(err) {
                            console.log(err);
                            res.json({status : 500});
                        }
                        else {
                            res.json({status : 200,userName: req.body.userName,commentID : id,postDate : date});
                        }
                    })
                }
            })          
        }     
    });
}}