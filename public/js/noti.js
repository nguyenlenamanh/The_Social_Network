$(document).ready(function() {
    var token = readCookie('token');
    var userid;
    var name;
    console.log(token);

    if(token) {
        var socket = io('http://localhost:3000');

        socket.emit('register',token);

        socket.on('setuser',function(data,ucname) {
            userid = data;
            name = ucname;
            alert(name);
        })

        socket.on('receive-noti',function(data) {
            $("#CountNoti").text(parseInt($("#CountNoti").text())+1);
            $("#notiPanel").prepend("<li><a href=\"notifications.html\" title=\"\"><img src=\"images/resources/thumb-1.jpg\" alt=\"\"><div class=\"mesg-meta\"><h6>sarah Loren</h6><span>" + data + "</span></div></a><span class=\"tag green\">New</span></li>")
            alert(data);
        })
    }

    $('.like').click(function() {
        var userID = this.id.split(';')[0];
        var postID = this.id.split(';')[1];

        console.log(userID);
        console.log(postID);

        var from = userid;
        var to = userID;
        socket.emit('send-noti-message',from,to,"like",postID);

        var likebutton = document.getElementById(this.id);
        var childStatus = likebutton.children[0];
        var likeCout = likebutton.children[1];
        var text = likebutton.innerHTML.trim();
        if(text.includes('ti-heart-broken')) {
            childStatus.classList.remove("ti-heart-broken");
            childStatus.classList.add("ti-heart");
            likebutton.setAttribute('style','color:green');
            likeCout.innerHTML = (parseInt(likeCout.innerHTML)+1) + "";
            console.log("Like");
            likebutton.setAttribute('data-original-title','like');
        }
        else {
            likeCout.innerHTML = (parseInt(likeCout.innerHTML)-1) + "";
            childStatus.classList.remove("ti-heart");
            childStatus.classList.add("ti-heart-broken");
            likebutton.setAttribute('style','color:red');
            console.log("unlike");
            likebutton.setAttribute('data-original-title','unlike');
        }
    });
})

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}