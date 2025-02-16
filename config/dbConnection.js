const mongoose=require("mongoose");

const connectDb = async()=>{
   
    try{
        const connect= await mongoose.connect(process.env.CONNECTION_STRING)
        console.log("Database connected:", connect.connection.host,connect.connection.name);//name of the host and connection name    
    }
    catch(err){
        mongoose.set('debug', true);

        console.log(err);
        process.exit(1);
    }
}

module.exports=connectDb