const http=require("http"),fs=require("fs"),path=require("path");
const PORT=process.env.PORT||5050; let project=null, versions=new Map();
const GLOBAL_CONFIG = require("./global/config");
const GLOBAL_LANGUAGE = require("./global/language");
const GLOBAL_DESIGN = require("./global/design");

const send=(res,s,d)=>{res.writeHead(s,{"Content-Type":"application/json; charset=utf-8","Access-Control-Allow-Origin":"*"});res.end(JSON.stringify(d))};
const body=req=>new Promise((ok,no)=>{let b="";req.on("data",c=>b+=c);req.on("end",()=>{try{ok(b?JSON.parse(b):{})}catch(e){no(e)}})});
function html(v,name,note){
  const globalConfig=require("./global/config");
  const design=require("./global/design");
  const language=require("./global/language");

  const lang=globalConfig.defaultLanguage||"vi";
  const t=language[lang]||language.vi||{};
  const page=design.page||{};
  const button=design.button||{};
  const card=design.card||{};

  name=String(name||globalConfig.appName||"PHÚ AI WEBNEW").replace(/[<>&"]/g,"");
  note=String(note||globalConfig.defaultNote||"Website demo").replace(/[<>&"]/g,"");

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name} - ${v}</title>
<style>
body{
font-family:system-ui;
margin:0;
background:${page.background||"#f4f6fa"};
color:${page.text||"#166534"};
text-align:${page.align||"center"};
text-transform:${page.transform||"uppercase"};
}
.w{
max-width:1000px;
margin:auto;
padding:40px 20px;
text-align:center;
}
.c{
background:white;
border-radius:24px;
padding:48px;
box-shadow:0 12px 40px #0001;
text-align:center;
}
h1,h2,h3,p,small{
color:${page.text||"#166534"};
text-align:center;
text-transform:${page.transform||"uppercase"};
}
button{
padding:12px 18px;
border:0;
border-radius:10px;
background:${button.background||"#facc15"};
color:${button.text||"#166534"};
font-weight:800;
text-transform:uppercase;
cursor:pointer;
}
.grid{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:15px;
margin-top:20px;
}
.card{
padding:20px;
background:${card.background||"#ffffff"};
border:1px solid #e5e7eb;
border-radius:16px;
color:${card.text||"#166534"};
text-align:center;
text-transform:uppercase;
}
@media(max-width:700px){
.grid{grid-template-columns:1fr}
}
</style>
</head>
<body>
<div class="w">
<section class="c">
<small>${globalConfig.appName||"PHÚ AI WEBNEW"} · ${v}</small>
<h1>${name}</h1>
<p>${note}</p>
<button>${t.contact||"LIÊN HỆ NGAY"}</button>
</section>
<div class="grid">
<div class="card">${t.architecture||"KIẾN TRÚC"}</div>
<div class="card">${t.qa||"QA PASS"}</div>
<div class="card">${t.version||"PHIÊN BẢN"} ${v}</div>
</div>
</div>
</body>
</html>`;
}function getIndex(){
  return fs.readFileSync(
    path.join(__dirname,"..","frontend","index.html"),
    "utf8"
  );
}

function rev(){
  let n=[...versions.keys()]
    .filter(x=>x[0]=="R")
    .map(x=>+x.slice(1));

  return "R"+((n.length?Math.max(...n):0)+1);
}

http.createServer(async(req,res)=>{
  try{

    if(req.method=="GET" && req.url=="/"){
      res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});
      return res.end(getIndex());
    }

    if(req.method=="GET" && req.url=="/api/state"){
      return send(res,200,{
        project,
        versions:[...versions.values()]
      });
    }

    if(req.method=="POST" && req.url=="/api/brain/project"){

      let b=await body(req);

      let brain=b.aiBrain||b.brain||{
        businessProfile:b.businessProfile||null,
        websiteBlueprint:b.websiteBlueprint||null,
        designSystem:b.designSystem||null
      };

      if(!brain.businessProfile && !brain.websiteBlueprint && !brain.designSystem){
        return send(res,400,{error:"AI Brain payload missing"});
      }

      project={
        id:"brain-"+Date.now(),
        name:String(
          b.projectName ||
          brain.businessProfile?.brand?.name ||
          brain.websiteBlueprint?.brand?.name ||
          "PHÚ AI WEBNEW Demo"
        ),
        status:"brain_connected",
        currentVersion:"V1",
        aiBrain:{
          businessProfile:brain.businessProfile||null,
          websiteBlueprint:brain.websiteBlueprint||null,
          designSystem:brain.designSystem||null
        }
      };

      let v={
        version:"V1",
        status:"qa_passed",
        source:html(
          "V1",
          project.name,
          brain.websiteBlueprint?.pages?.[0]?.title ||
          brain.websiteBlueprint?.goal ||
          "AI Brain V1"
        )
      };

      versions.clear();
      versions.set("V1",v);

      return send(res,201,{
        project,
        version:v,
        aiBrainConnected:true
      });
    }
    if(req.method=="POST" && req.url=="/api/project"){

      let b=await body(req);

      project={
        id:"demo-"+Date.now(),
        name:b.projectName||"PHÚ AI WEBNEW Demo",
        status:"demo_ready",
        currentVersion:"V1"
      };

      let v={
        version:"V1",
        status:"qa_passed",
        source:html(
          "V1",
          project.name,
          "Bản V1 đầu tiên."
        )
      };

      versions.clear();
      versions.set("V1",v);

      return send(res,201,{
        project,
        version:v
      });
    }

    if(req.method=="POST" && req.url=="/api/revision"){

      if(!project){
        return send(res,400,{
          error:"Hãy tạo V1 trước"
        });
      }

      let b=await body(req);

      let parentVersion=project.currentVersion;
      let vname=rev();

      let v={
        version:vname,
        status:"qa_passed",
        parentVersion,
        revisionNote:String(b.note||"").trim(),
        source:html(
          vname,
          project.name,
          String(b.note||"").trim() || "Revision"
        )
      };

      versions.set(vname,v);
      project.currentVersion=vname;

      return send(res,201,{
        project,
        version:v
      });
    }

    let m=req.url.match(/^\/preview\/(V1|R\d+)$/);

    if(req.method=="GET" && m){

      let v=versions.get(m[1]);

      if(!v){
        return send(res,404,{
          error:"Version not found"
        });
      }

      res.writeHead(200,{
        "Content-Type":"text/html; charset=utf-8"
      });

      let source=String(v.source)
        .replace(/&/g,"&amp;")
        .replace(/"/g,"&quot;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/\n/g,"&#10;");

      return res.end(`<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Preview ${m[1]}</title>
<style>
body{
margin:0;
font-family:system-ui;
background:#f4f6fa;
}
.bar{
padding:12px 18px;
background:#facc15;
color:#166534;
font-size:14px;
font-weight:800;
text-align:center;
text-transform:uppercase;
}
iframe{
display:block;
width:100%;
height:calc(100vh - 44px);
border:0;
background:#fff;
}
</style>
</head>
<body>
<div class="bar">PHÚ AI WEBNEW · PREVIEW ${m[1]}</div>
<iframe
sandbox="allow-scripts allow-forms allow-modals"
srcdoc="${source}">
</iframe>
</body>
</html>`);
    }

    return send(res,404,{
      error:"Not found"
    });

  }catch(e){
    return send(res,500,{
      error:e.message
    });
  }

}).listen(
  PORT,
  ()=>console.log(
    "PHÚ AI WEBNEW: http://localhost:"+PORT
  )
);