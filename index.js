const express=require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const cors=require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;



app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("First Sale project is running");
 
});




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.jmnkad8.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req,res,next){
  
    const authHerader= req.headers.authorization;
    if(!authHerader){
      return res.status(401).send('unauthorized acccess');
    }
    const token=authHerader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
      if (err) {
          return res.status(403).send({ message: 'forbidden access' })
      }
      req.decoded = decoded;
      next();
  })
  }


async function run(){
   
    try{
        const brandsCollection=client.db("first-sale").collection("brands");
        const categoryCollection=client.db("first-sale").collection("categorys");
        const productsBookingCollection=client.db('first-sale').collection('productsBooking');
        const userCollection = client.db("first-sale").collection("user");
        app.get('/brands',async(req,res)=>{
            const query={};
            const result= await brandsCollection.find(query).toArray();
            res.send(result);
         })

         app.post("/categorys", async (req, res) => {
            const category = req.body;
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
            const category =await categoryCollection.find(query).toArray();
             res.send(category);
        
            })
            app.put('/laptop/:id',async(req,res)=>{
                const id =req.params.id;
                const filter={_id:ObjectId(id)};
                const options={upsert: true};

                const updateDoc={
                    $set:{
                        status: 'booked',
                    }
                }
                const updatedResult =await categoryCollection.updateOne(filter,updateDoc,options);
                res.send(updatedResult)
            })
            app.post('/bookingproducts',async(req,res)=>{
                const bookingproduct=req.body;
                console.log(bookingproduct);
                const result=await productsBookingCollection.insertOne(bookingproduct)
                res.send(result)
            })
            app.get('/bookingproducts',verifyJWT,async(req,res)=>{
                const email =req.query.email;
                console.log('axccessToken',req.headers.authorization);
                const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }

                const query={email:email};
                const productBooking=await productsBookingCollection.find(query).toArray();
                res.send(productBooking)
            })

            app.get('/jwt', async(req,res)=>{
                const email=req.query.email;
                const query={email: email}
                const user= await userCollection.findOne(query);
                if(user){
                  const token=jwt.sign({email}, process.env.STRIPE_SECRET_KEY, {expiresIn: '1h'});
                 
                  return res.send({accessToken: token})
                }

                res.status(403).send({accessToken:''}) 

          
              })

            app.post('/users',async(req,res)=>{
                const user=req.body;
                console.log(user)
                const result=await userCollection.insertOne(user);
                 res.send(result);
            })

    }
    
    finally{

    }
}
run().catch(console.dir);




app.listen(port, () => {
    console.log(`first sale app listening on port${port}`);
  });
  