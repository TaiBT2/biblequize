var fs=require("fs");
var c = fs.readFileSync("d:/code/biblequize/_home_content.txt","utf8");
fs.writeFileSync("d:/code/biblequize/apps/web/src/pages/Home.tsx",c,"utf8");
console.log("done");
