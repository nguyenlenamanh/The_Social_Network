var listR = [];
var listN = [];
function Post(){
    console.log("Chay post");
    var formData = new FormData();
    var content = document.getElementById("post_content");
    var UserID = document.getElementById("UserID").value;
    var music = document.getElementById("music").files;
    var video = document.getElementById("video").files;
    var picture = document.getElementById("picture").files;
    var type = " ";
    formData.append("content",content.value);
    formData.append("UserID",UserID);
    if(typeof(music[0]) != "undefined"){
        formData.append("file",music[0]);
        type = "Music";
    }  
    else if(typeof(video[0]) != "undefined"){
        formData.append("file",video[0]);
        type = "Video";
    }           
    else if(typeof(picture[0]) != "undefined"){
        formData.append("file",picture[0]);
        type = "Photo";
    }  
    formData.append("type",type);
    var contentType = {
        headers : {
            "content-type" : "multipart/form-data"
        }
    };
    console.log(JSON.stringify(formData));
    axios.post('/postAjax',formData,contentType)
    .then(function(res){
       if(res.data != ""){
           //alert(res.data);
           var parent = document.getElementById("allPost");
           var form = document.querySelector('#showInfo');
           var textarea = document.querySelector('#post_content');
            form.innerHTML = "";
            textarea.value = "";
           parent.insertBefore(createElementFromHTML(res.data),parent.firstElementChild);
       }
    });
}

function LoadMore(count){
    var formData = new FormData();
    console.log(JSON.stringify(formData.get("UserID")));
    var contentType = {
        headers : {
            "content-type" : "multipart/form-data"
        }
    };
    axios.get('/loadMore?id=' + count,formData,contentType)
    .then(function(res){
        var parent = document.getElementById("allPost");
        parent.innerHTML += res.data;
    });
}

function PostComment(event,obj){
    var comment = obj.value;
    if(event.which == 13){
        //alert(obj.value);
        if(comment.includes(listN[0]) == false) {
            listR = [];
            listN = [];
        }
        if(comment.trim() == "") return;
        var id = obj.getAttribute("data-id");
        var userName = document.getElementById("userName" + id).value; 
        var UserIDOwner = document.getElementById("UserIDOwner"+ id).value; 
        var comment_content =  comment;
        var UserIDOwnerComment = document.getElementById("UserIDOwnerComment"+ id).value; 
        var postID =  document.getElementById("postID"+ id).value;  
        var url = "";
        var keyPair = "";
        if(listR.length == 0) url = "/comment";
        else {
            url = "/reply";
            keyPair = listR[0];
        }
        $.post(url,{
            "userName" : userName,
            "UserIDOwner" : UserIDOwner,
            "UserIDOwnerComment" : UserIDOwnerComment,
 			"comment_content" : comment_content,
 			"postID" : postID,
 			"keyPair" : keyPair,
        },function(data){
            if(data != ""){
                if(keyPair == ""){
                    var parent = document.getElementById(postID);
                    parent.insertBefore(createElementFromHTML(data),parent.lastElementChild);
                    document.getElementById("comment_content" + postID).value = "";
                }
                else {
                    //alert(keyPair.split(";")[1]);
                    var commentID = keyPair.split(";")[1];
                    var parent = document.getElementById("ul_" + commentID);
                    parent.insertBefore(createElementFromHTML(data),parent.lastChild);
                    document.getElementById("comment_content" + postID).value = "";
                }
            }          
        })
    }	

}

function Replay(obj){
    listR = [];
    listN = [];
    //alert(obj.getAttribute("id"));
    var postID = obj.getAttribute("id").split(";")[0];
    var keyPair = obj.getAttribute("id");
    listR.push(keyPair);
    var reply_value =  "@" + document.getElementById("un_" + keyPair.split(";")[0] + keyPair.split(";")[1]).innerText + " ";		
    listN.push(reply_value);
	document.getElementById("comment_content" + postID).value = reply_value;
}
function createElementFromHTML(htmlString) {
    var div = document.createElement('div');   
    div.innerHTML = htmlString.trim(); 
    return div.firstChild; 
}


