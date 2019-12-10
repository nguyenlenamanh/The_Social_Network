var AWS = require("aws-sdk");
var multer = require("multer");
var multerS3 = require("multer-s3");

AWS.config.update({ 
    accessKeyId: "AKIAI3HV5FAGTHP5RCWA",
    secretAccessKey: "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",
    region: "us-west-2",
    endpoint: "https://s3.amazonaws.com"
});

var s3 = new AWS.S3();
var upload = multer({
    storage: multerS3({
        s3:s3,
        bucket: "concac12345",
        acl : "public-read",
        metadata: function(req,file,cb){
            cb(null,{fieldName:'Upload'});
        },
        key: function(req,file,cb){
            cb(null,Date.now().toString());
        }
    })
});
module.exports = upload;
    