let running=false;


function startCollector(){

running=true;

document
.getElementById("status")
.innerHTML="🟢 فعال";


document
.getElementById("report")
.innerHTML=
"<li>سیستم آماده جمع‌آوری است</li>";

}



function stopCollector(){

running=false;


document
.getElementById("status")
.innerHTML="🔴 متوقف";


document
.getElementById("report")
.innerHTML=
"<li>جمع‌آوری متوقف شد</li>";

}