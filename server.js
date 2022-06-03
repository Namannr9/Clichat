const net=require("net");
const fs=require("fs");

class Response
{
    constructor()
    {
        this.action="";
        this.success=false;
        this.error=null;
        this.result=null;
    }
}

class DataModel
{
    constructor()
    {
        this.users=[];
        this.userId=0; // counter variable for alloting id to logged in user
    }

    getUserByUsername(username)
    {
        var user=this.users.find(function(user){
            return user.username==username;
        });
        return user;
    }

    getUserById(id)
    {
        var user=this.users.find(function(user){
            return user.id==id;
        })
        return user;
    }

    getLoggedInUsers()
    {
        var loggedInUsers=[];
        for(var e=0;e<this.users.length;e++)
        {
            if(this.users[e].loggedIn)
            {
                loggedInUsers.push(this.users[e].username);
            }
        }
        return loggedInUsers;
    }
}

var model=new DataModel();

function populateDataStructure()
{
    var usersJSONString=fs.readFileSync("users.data","utf-8");
    var users=JSON.parse(usersJSONString).users;
    users.forEach(function(user){
        user.loggedIn=false; // adding loggedIn property to user
        user.id=0; // adding id to user;
        user.monitorSocket=null;
        model.users.push(user);
    });
}

function processRequest(requestObject)
{
    if(requestObject.action=="send")
    {
        let message=requestObject.message;
        let fromUser=requestObject.fromUser;
        let toUser=requestObject.toUser;
        let user=model.getUserByUsername(fromUser);
        if(user && user.loggedIn && user.monitorSocket)
        {
            var response=new Response();
            response.action=requestObject.action;
            response.message=message;
            response.fromUser=fromUser;
            user.monitorSocket.write(JSON.stringify(response));
        }
        user=model.getUserByUsername(toUser);
        if(user && user.loggedIn && user.monitorSocket)
        {
            var response = new Response();
            response.action = requestObject.action;
            response.message = message;
            response.fromUser = fromUser;
            user.monitorSocket.write(JSON.stringify(response));
        }
    }

    if(requestObject.action=="broadcast")
    {
        let message=requestObject.message;
        let fromUser=requestObject.fromUser;
        console.log("Message come from "+fromUser);
        console.log("Message "+message);
        model.users.forEach(function(user){
            if(user.loggedIn && user.monitorSocket)
            {
                console.log("we send message to"+user.username)
                var response=new Response();
                response.action=requestObject.action;
                response.message=message;
                response.fromUser=fromUser;
                user.monitorSocket.write(JSON.stringify(response));
            }
        })
    }
    if(requestObject.action=="createMonitor")
    {
        let userId=requestObject.userId;
        let user=model.getUserById(userId);
        var response=new Response();
        response.action=requestObject.action;
        if(user)
        {
            user.monitorSocket=requestObject.socket;
            response.result=user.username;
        }
        else
        {
            response.result="";
        }
        requestObject.socket.write(JSON.stringify(response));
    }

    if(requestObject.action=="login")  // if user login
    {
        let username=requestObject.username;
        let password=requestObject.password;
        let user=model.getUserByUsername(username);
        let success=false;
        if(user)
        {
            if(password==user.password) success=true;
        }
        let response=new Response();
        response.action=requestObject.action;
        response.success=success;
        if(success)
        {
            response.error="";
            model.userId++;
            requestObject.socket.userId=model.userId;
            user.id=model.userId;
            user.loggedIn=true;
            response.result={
                "username" : user.username,
                "id" : user.id  
            };
        }
        else  // we not found user in our ds
        {
            response.error="Invalid username / password";
            response.result="";
        }
        requestObject.socket.write(JSON.stringify(response)); 
        // send back response

        if(success)
        {
            let username=user.username;
            let notificationMessage=username+" has logged in";
            var e=0;
            while(e<model.users.length)
            {
                user=model.users[e];
                console.log(username+","+user.username);
                if(user.username!=username && user.loggedIn && user.monitorSocket)
                {
                    console.log("Sending notification");
                    response=new Response();
                    response.action="notification";
                    response.notificationMessage=notificationMessage;
                    user.monitorSocket.write(JSON.stringify(response));
                }
                e++;
            }
        }

    }// login part ends;

    if(requestObject.action=="logout")
    {
         let userId=requestObject.userId;
         let user=model.getUserById(userId);
         if(user && user.monitorSocket)
         {
             var response=new Response();
             response.action=requestObject.action;
             user.monitorSocket.write(JSON.stringify(response));
         }
         user.loggedIn=false;
         user.id=0;
         user.monitorSocket=null;

         let username=user.username;
         let notificationMessage=username+" has logged out";
         var e=0;
         while(e<model.users.length)
         {
             user=model.users[e];
             console.log(username+","+user.username);
             if(user.username!=username && user.loggedIn && user.monitorSocket)
             {
                console.log("Sending notification");
                response=new Response();
                response.action="notification";
                response.notificationMessage=notificationMessage;
                user.monitorSocket.write(JSON.stringify(response));
             }
             e++;
         }
    }// logout parts ends here

    if(requestObject.action=="getUsers")
    {
        console.log("Get users called form client side ")
        
        let userId=requestObject.userId;
        console.log("User id is "+userId);
        let user=model.getUserById(userId);
        if(user && user.monitorSocket)
        {
            var response=new Response();
            response.action=requestObject.action;
            response.result=model.getLoggedInUsers();
            user.monitorSocket.write(JSON.stringify(response));
        }
    }// get user part ends here

}

populateDataStructure();

var server=net.createServer(function(socket){
    socket.on('data',function(data){
        var requestObject=JSON.parse(data); // some more programmin will be done in future;
        requestObject.socket=socket;
        try
        {
            processRequest(requestObject);
        }catch(e) 
        {
            console.log(e);
        }
    });

    socket.on('end',function(){
        console.log('Client closed connection'); 
    })

    socket.on('error',function(){
        console.log("Some problem at client side");
    })
})

server.listen(5500,"localhost");
console.log("Chat server is ready to accept request on port 5500")

