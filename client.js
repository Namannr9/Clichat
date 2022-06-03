const net=require("net");
const readLine=require("readline");
const events=require("events");



function acceptInput(q,ioInterface)
{
    var promise=new Promise(function(resolve,reject){
        ioInterface.question(q,function(answer){
            resolve(answer);
        })
    })
    return promise;
}

class DataModel
{
    constructor()
    {
        this.user=null;
    }
}

class Request
{
    constructor()
    {
        this.action="";
    }
}

var model=new DataModel();
var eventEmitter=new events.EventEmitter();
var client=null;

function processSpaces(command)
{
    command=command.trim();
    while(true)
    {
        console.log(command);
        var i=command.indexOf("  "); // two space
        if(i==-1) break;
        command=command.replace("  "," "); // remove two space and put one space
    }
    
    return command;
    
}

function isValidCommand(command)
{
    if(command=="logout") return true;
    if(command=="getUsers") return true;
    if(command.startsWith("send "))
    {
        var pcs=command.split(" "); // one space
        if(pcs.length>=3) return true;
    } 

    if(command.startsWith("broadcast "))
    {
        while(true)
        {
            var i=command.indexOf("  "); // two space
            if(i==-1) break;
            command=command.replace("  "," ") 
        }
        var pcs=command.split(" "); // one space
        if(pcs.length>=2) return true;
    }
    return false;
}

function processAction(action)
{
    if(action=='login') processLoginAction();
    else if(action=='logout') processLogoutAction();
    else if (action == 'acceptCommand') processAcceptCommandAction();
    
}

async function processLoginAction()
{
    let ioInterface=readLine.createInterface({
        "input" : process.stdin,
        "output" : process.stdout
    })

    let username=await acceptInput("Username : ",ioInterface);
    let password=await acceptInput("Password : ",ioInterface);
    ioInterface.close();

    let request=new Request();
    request.action="login";
    request.username=username;
    request.password=password;
    client.write(JSON.stringify(request));
}

function processLoginActionResponse(response)
{
    
    if(response.success==false)
    {
        console.log(response.error);
        processAction('login');
    }
    else
    {
        model.user=response.result;
        eventEmitter.emit('loggedIn');
    }
}



async function processAcceptCommandAction()
{
    let ioInterface = readLine.createInterface({
        "input": process.stdin,
        "output": process.stdout
    })  
    
    while(true)
    {
        let command = await acceptInput(`${model.user.username}(${model.user.id})>`, ioInterface);

        command=processSpaces(command);
        console.log("After processing "+command);
        if(isValidCommand(command)==false)
        {
            console.log("Invalid command / syntax")
            continue;
        }
        let request=new Request();

        if(command.startsWith("send "))
        {
            var spc1=command.indexOf(" ");
            var spc2=command.indexOf(" ",spc1+1);
            var message=command.substring(spc2+1);
            var toUser=command.substring(spc1+1,spc2);
            request.action="send";
            request.toUser=toUser;
            request.message=message;
            request.fromUser=model.user.username;
            client.write(JSON.stringify(request));
        }

        if(command.startsWith("broadcast "))
        {
            console.log("if me fs gya");
            request.action="broadcast";

            request.fromUser=model.user.username;
            request.message=command.substring(10);
            console.log("we want to broadcast"+request.fromUser+request.message);
            client.write(JSON.stringify(request));
        }
        else
        {
            console.log("if me fsa nhi")
        }

        if(command=="getUsers" || command=="logout")
        {
            request.action=command; // this will change later on
            console.log("User we send on server side is "+model.user.id);
            request.userId=model.user.id;
            client.write(JSON.stringify(request));
        }

        if(command=='logout') break;
        
        // request.action=command; // this will change late on
        // request.userId=model.user.id;
        // client.write(JSON.stringify(request));
        // if(command=='logout') break;
    }
    ioInterface.close(); 
    processAction('login');
}

// event
function loggedIn()
{
    console.log(`Welcome ${model.user.username}`);
    processAction('acceptCommand');
}


// setting up events
eventEmitter.on('loggedIn',loggedIn);


client=new net.Socket();
client.connect(5500,"localhost",function(){
    console.log("Connected to char server");
    processAction('login')
})

client.on('data',function(data){
    var response=JSON.parse(data);
    if(response.action=="login")
    {
         processLoginActionResponse(response);
    }
})

client.on('end',function(){})
client.on('error',function(){})