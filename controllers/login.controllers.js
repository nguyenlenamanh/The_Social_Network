var AWS = require("aws-sdk");
var jwt = require('jsonwebtoken');

AWS.config.update({
    region: "us-west-2",
    endpoint: "http://localhost:8000",
    accessKeyId: "accessKeyId",
    secretAccessKey: "secretAccessKey"
});

var docClient = new AWS.DynamoDB.DocumentClient();

//Lỗi ko đăng nhập được
//nguyenlenamanh.2016@outlook.com - 123456
module.exports.login = function(req,res) {
    res.render('login');
}

module.exports.loginPost = function(req,res) {
    var email = req.body.email;
    var password = req.body.password;

    if(email && password) {

        var paramsLogin = {
            TableName : "Users",
            IndexName: "Email_Index",
            KeyConditionExpression: "Email = :email",
            ExpressionAttributeValues: {
                ":email": email
            }
        };

        docClient.query(paramsLogin, function(err, data) {
            if (err) {
                res.render('login');
            } else {
                var firstUser = data.Items[0];
                
                if(firstUser.Info.Password === password) {

                    console.log(firstUser);
                    var user = {
                        userID: firstUser.UserID,
                        name: firstUser.Info.Name
                    }

                    jwt.sign({user},"secretkey",(err,token) => {
                        if(err) {
                            res.sendStatus(403);
                        }
                        else {
                            res.cookie('token',token);
                            res.redirect('/');
                        }
                    })
                }
                else {
                    res.render('login');
                }
            }
        });
    }
    else {
        res.render('login');
    }

}