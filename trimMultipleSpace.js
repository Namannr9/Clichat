var a="send       ramesh "
if(a.startsWith("send"))
{
    // remove white space from both the end
    var b=a.trim();          
    while(true)
    {
        if(b.indexOf("  ")==-1) break;
        b=b.replace("  "," ");                     // find two space and replace with one space
    }

    console.log(b);
    var c=b.split(" ");
    console.log(c.length);
    for(var i=0;i<c.length;i++)
    {
        console.log(c[i]);
    }
}