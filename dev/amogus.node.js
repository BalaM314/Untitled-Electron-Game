process.chdir("..");

var http = require('http');
var fs = require('fs');
const tsc = require("child_process").exec("tsc --watch");


function serverMain(req, res){
	console.log(req.url);
  switch(req.method){
    case "GET":
			if(req.url.match(/\.\./gi)){
				res.writeHead(403, {"Content-Type": "application/json"});
				res.write(`{"message":"no"}`);
			}
			fs.readFile('C:/coding/Electron/Untitled-Electron-Game' + req.url, function(err, data){
				if(!data){
					res.writeHead(200);
					res.write(JSON.stringify({"error": "404 Not Found"}));
					return res.end();
				}
				let headers = {"Content-Type": ""}
				if(req.url.split(".")[1] == "js"){
					headers = {"Content-Type": "application/javascript"};
				} else if(req.url.split(".")[1] == "html"){
					headers = {"Content-Type": "text/html"};
				}
				res.writeHead(200, headers);
				res.write(data);
				return res.end();
			});
    break;
		default:
			res.writeHead(405);
			res.end();
	}
};


http.createServer(serverMain).listen(80);
console.log("Server running at 127.0.0.1:80");
