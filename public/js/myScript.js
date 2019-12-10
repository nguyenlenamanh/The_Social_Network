
$(document).ready(function(){
	$(".input-content").keydown(function(event) {
		var comment = $(this).val();
		if (event.which == 13) {
			//alert(comment);
			var id = this.getAttribute("data-id");
			var userName = $("#userName" + id).val();       
			var UserIDOwner = $("#UserIDOwner"+ id).val();      
			var comment_content =  comment;
			if(comment.trim() == "") return;
			if(comment.includes(listN[0]) == false) {
				listR = [];
				listN = [];
			}		    
			var postID = $("#postID"+ id).val();      
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
				"comment_content" : comment_content,
				"postID" : postID,
				"keyPair" : keyPair,
			},function(data){
				if(JSON.stringify(data.status) == 200){
									
									//var list = document.getElementById(postID);
									var list;
									if(listR.length == 0) {
										list = document.getElementById(postID);
									}
									else {
										list = document.getElementById(keyPair.split(";")[1]);
									}
									
									var newItem = document.createElement("LI");
									newItem.setAttribute("id",data.commentID);
									var div = document.createElement('div');
									div.setAttribute("class","comet-avatar");
									var img = document.createElement('img');
									img.setAttribute("src","images/resources/comet-1.jpg");
									div.appendChild(img);
									newItem.appendChild(div);
									var div2 = document.createElement('div');
									div2.setAttribute("class","we-comment");
									var divHead = document.createElement('div');
									divHead.setAttribute("class","coment-head");
									var h5 = document.createElement('h5');
									var a = document.createElement('a');
									var userName = document.createTextNode(data.userName);
									a.setAttribute('href',"time-line.html");
									a.setAttribute("id","un_" + postID + data.commentID);
									a.appendChild(userName);
									var span = document.createElement('span');
									var time = document.createTextNode(JSON.stringify(data.postDate));
									span.appendChild(time);
									var a2 = document.createElement('a');
									a2.setAttribute('style',"color: #088dcd;cursor: pointer;");
									a2.setAttribute('class','we-reply');
									a2.setAttribute('title','Reply');
									//a2.setAttribute("id","un_" + );
									var i = document.createElement('i');
									i.setAttribute('class','fa fa-reply reply_comment');
									i.setAttribute("id", postID + ";" + data.commentID);
									//alert(postID);
									var p = document.createElement('p');
									var content = document.createTextNode(comment_content);
									p.append(content);
									h5.appendChild(a);
									a2.appendChild(i);
									divHead.appendChild(h5);
									divHead.appendChild(span);
									divHead.appendChild(a2);
									div2.append(divHead);
									div2.append(p)
									newItem.appendChild(div2);
									var ul;
									if(listR.length > 0) {
										ul = document.createElement("UL");
										ul.setAttribute("id","ul_" + postID);
										ul.appendChild(newItem);
										list.insertBefore(ul,list.lastChild);
										$("#comment_content"+ id).val("");	
										listR = [];
										return;
									}
									document.getElementById("myFunction").removeChild(document.getElementById("handle"));
									var scriptElement = document.createElement( "script" );
									scriptElement.setAttribute("id","handle");
									scriptElement.src = "js/myScript.js";
									
									document.getElementById("myFunction").appendChild(scriptElement);		
									//$("#myFunction")		
									list.insertBefore(newItem,list.lastElementChild);
									$("#comment_content"+ id).val("");									
				}            		
        })
		}
	});
	var listR = [];
	var listN = [];
	$(".reply_comment").click(function(){
		listR = [];
		listN = [];
		var postID = $(this)[0].getAttribute("id").split(";")[0];
		var keyPair = $(this)[0].getAttribute("id");
		listR.push(keyPair);
		//alert(list[0]);
		var reply_value =  "@" + $("#un_" + keyPair.split(";")[0] + keyPair.split(";")[1]).text() + " ";		
		listN.push(reply_value);
		$("#comment_content" + postID).val(reply_value);
	})
})

