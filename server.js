const express = require('express')
const app = express();
const cors = require('cors');
app.use(cors());
app.disable('x-powered-by')

app.use(express.static('public'));
const port = 3000;
const path = require('path');

const favicon = require('serve-favicon');
app.use(favicon(__dirname + '/public/assets/favicon.ico'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//db stuff
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync');
const { send } = require('process');
const adapter = new FileSync('./db/stickers.json')
const db = low(adapter)
const users = db.get('users')
const packs = db.get('packs')


//pages
app.get("/sticker-widget"+__dirname, (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.get("/sticker-uploader"+__dirname, (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.get('/sticker-editor'+__dirname, (req,res)=>{
    res.sendFile(__dirname + '/index.html');
});



const getUserData=(user,type)=>{
    if(type=="index") return users.find({id:user}).get(type).value()
    if(type=="packs"){
       let userpacks = users.find({id:user}).get('index').get('packs').value()
       return packs.filter(e=>userpacks.includes(e.id))
    }
    return {"error":"invalid type"}
}
const getUserPack=(user,packname)=>{
    //check userpacks for pack
    let userpacks = users.find({id:user}).get('index').get('packs').value()
    //search packs for pack
    if(userpacks!==undefined) return packs.find(e=>e.id===packname)
    else return {"error":"no pack"}    
}



//test if user exists for post, else create
const tryUser =(user)=>{
    let userValid = (users.find({id:user}).value()== null) ? false : true
    //user isnt in db
    if(userValid==false){
        console.log(`adding user: ${user}`)
        users.push({"id":user,"index":{"packs":[],"homeserver_url":"https://matrix.org"}}).write() 
    }
}
const tryData=(user,pack)=>{
    let userpacks = users.find({id:user}).get('index').get('packs').value()
   if(!userpacks.length){//if pack empty, just add
    packs.push(pack).write()
    users.find({id:user}).get('index').get('packs').push(pack.id).write()
    return {"success":`added ${pack.title}`}
   }
   else{//else check if pack already exists
       let packid = userpacks.find(e=>e.id===pack.id)
       if(packid===undefined){
           packs.push(pack).write()
           users.find({id:user}).get('index').get('packs').push(pack.id).write()
           return {"success":`added ${pack.title}`}
        }
        else return {"error":"pack already exists"}
   }
}







//editing stickers
const editStickers=(user)=>{
    if(!user || user == 'null' ) return {"error":"provide user to edit aka /?user=@bob:matrix.org"}
    else if(users.find({id:user}).value()===undefined) return {"error":"this user has no stickers"}
    else{
        return packs
    }
}
app.get('/editstickers',(req,res)=>{
    const user = req.query.user;
    res.send(editStickers(user))
})



//update user stickerpacks
const updateStickers=(user,data)=>{
    users.find({id:user}).get('index').get('packs').remove(e=>e).write()//clear all
    for(let e of data) users.find({id:user}).get('index').get('packs').push(e).write()//add received data to index
    return {"success":"updated packs"}
}
app.post('/updatestickers',(req,res)=>{
    const data = req.body
    res.send(updateStickers(data.user,data.stickers))
})




app.get('/stickers',(req,res)=>{
    const user = req.query.user;
    const type = req.query.type;
    if('pack' in req.query) res.send(getUserPack(user,req.query.pack))
    else res.send(getUserData(user,type))
})

//posting
app.post('/stickers',(req,res)=>{
    const data = req.body
    tryUser(data.user)//creates user
    res.send(tryData(data.user,data.pack))//add stickerpack data
})



app.listen(port, () => {
    console.log(`Server listening at ${port}`);
});