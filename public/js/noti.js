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
        var text = likebutton.innerHTML.trim();
        if(text.includes('ti-heart-broken')) {
            likebutton.innerHTML = '<i class="ti-heart"></i><ins>2.2k</ins>';
            likebutton.setAttribute('data-original-title','like');
        }
        else {
            likebutton.innerHTML = '<i class="ti-heart-broken" style="color: red;"></i><ins style="color: red;">2.2k</ins>';
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