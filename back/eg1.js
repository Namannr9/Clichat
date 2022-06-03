var fs=require("fs")
var userJSONString=fs.readFileSync("users.data","utf-8");
console.log(userJSONString);
var users=JSON.parse(userJSONString).users;

users.forEach(function(user){
    console.log(user)
})