const express=require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const cors=require('cors');
const app = express();
const port = process.env.PORT || 5000;



app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("First Sale project is running");
});




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.jmnkad8.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
   
    try{
        const brandsCollection=client.db("first-sale").collection("brands");
        const categoryCollection=client.db("first-sale").collection("categorys");
        app.get('/brands',async(req,res)=>{
            const query={};
            const result= await brandsCollection.find(query).toArray();
            res.send(result);
         })

         app.post("/categorys", async (req, res) => {
            const category = req.body;
            console.log(category);
            const result = await categoryCollection.insertOne(category);
            res.send(result);
          });

          app.get('/categorys',async(req,res)=>{
            const query={};
            const result= await categoryCollection.find(query).toArray();
            res.send(result);
         })

          app.get('/category/:id',async(req,res)=>{
            const id =req.params.id;
            const query={
                category_id : id
            }
            console.log(id);
            const category =await categoryCollection.find(query).toArray();
             res.send(category);
        
            })

    }
    
    finally{

    }
}
run().catch(console.dir);




app.listen(port, () => {
    console.log(`first sale app listening on port${port}`);
  });
  