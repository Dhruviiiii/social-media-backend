const express=require("express");
const app=express();
const cookieParser=require("cookie-parser");    

if(process.env.NODE_ENV!=='PRODUCTION'){
    require('dotenv').config({path:"backend/config/config.env"});
}
//middlewares
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());


const post=require("./routes/post"); 
const user=require("./routes/user");   

app.use(post);
app.use(user);


module.exports=app;