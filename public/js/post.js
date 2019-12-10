function Post(){
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
    axios.post('/postAjax',formData,contentType)
    .then(function(res){
       if(res.data != ""){
           alert(res.data);
           var parent = document.getElementById("allPost");
           parent.insertBefore(createElementFromHTML(res.data),parent.firstElementChild);
       }
    });
}
function createElementFromHTML(htmlString) {
    var div = document.createElement('div');   
    div.innerHTML = htmlString.trim(); 
    return div.firstChild; 
}

