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
module.exports =  {   Save(data_pass){
    var paramsSpecificPost = {
        TableName : "Users",
        KeyConditionExpression: "UserID = :userID AND RefeID = :postID",
        ProjectionExpression: 'Info.Comments',
        //FilterExpression: "contains(Info.WhoCanSee, :id)",
        ExpressionAttributeValues: {
            ":userID": data_pass.UserIDOwner,        
            ":postID" : data_pass.postID
        }
    }
    var cmt = {
        "CommentID" : "Post" + RandomID(),
        "Content" : data_pass.comment_content,
        "PostDate" : new Date(),
        "Comments" : [],
        "UserName" : data_pass.userName
    };  
    
    docClient.query(paramsSpecificPost,function(err,data){
        if(err) console.log(err);
        else {
            data.Items[0].Info.Comments.push(cmt);
            var params = {
                TableName: "Users",
                Key:{
                    "UserID": data_pass.UserIDOwner,
                    "RefeID": data_pass.postID
                },
                UpdateExpression: "set Info.Comments=:cmt",
                ExpressionAttributeValues:{
                    ":cmt" : data.Items[0].Info.Comments
                },
                ReturnValues:"UPDATED_NEW"
            };
            docClient.update(params,function(err,data1){
                if(err) console.log(err);
                else {
                    var params = {
                        TableName: "Users",
                        Key:{
                            "UserID": "Post",
                            "RefeID": data_pass.postID
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
                            return;
                        }
                    })
                }
            })          
        }     
    });
    data_pass.status = "200";
    data_pass.postDate = cmt.PostDate;
    data_pass.CommentID = cmt.CommentID;
    return data_pass;
}}