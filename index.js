const express=require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const cors=require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);



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
    jwt.verify(token, process.env.STRIPE_SECRET_KEY, function (err, decoded) {
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
        const paymentsCollection = client.db('doctorsPortal').collection('payments');
       const blogs =client.db('first-sale').collection('blogs');

        const verifyAdmin = async (req, res, next) =>{
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await userCollection.findOne(query);
      
            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }

        app.get('/blogs',async(req,res)=>{
          const currentPage= parseInt(req.query.currentPage);
          const size=parseInt(req.query.size);
          console.log(currentPage)
          console.log(size)
          const query={};
          const blogPostDatabase=await blogs.find(query).skip(currentPage*size).limit(size).toArray();
          const count = await blogs.estimatedDocumentCount()
          res.send({count,blogPostDatabase});
        })
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
                  
            app.post('/bookingproducts',async(req,res)=>{
                const bookingproduct=req.body;
                console.log(bookingproduct);
                const result=await productsBookingCollection.insertOne(bookingproduct)
                res.send(result)
            })
          app.get('/bookingproducts/:id', async (req, res) => {
                const id = req.params.id;
                const query = { _id: ObjectId(id) };
                const booking = await productsBookingCollection.findOne(query);
                res.send(booking);
            })
           app.get('/myproduct',async(req,res)=>{
                 const email =req.query.email;
                const query={email:email};
                const productBooking=await categoryCollection.find(query).toArray();
                res.send(productBooking)
            })

            app.delete('/myproduct/:id',async(req,res)=>{
              const id =req.params.id;    
              filter={_id:ObjectId(id)};
              const result=await categoryCollection.deleteOne(filter);
              res.send(result)
            })
            app.put('/myproductAdvertise/:id', async (req, res) => {
              const id = req.params.id;
              // console.log(id);
              const filter = { _id: ObjectId(id) }
              const options = { upsert: true };
              const updatedDoc = {
                $set: {
                  status: 'advertised',   
                }
              }
              const updatedResult = await categoryCollection.updateOne(filter, updatedDoc, options)
              res.send(updatedResult)
            })
            app.get('/bookingStatus',async(req,res)=>{
              const statusAdd = req.query.status;
              const query = { status: statusAdd }
              const result = await categoryCollection.find(query).toArray()
              res.send(result)
            })
            app.put('/productReport/:id', async (req, res) => {
              const id = req.params.id;
              // console.log(id);
              const filter = { _id: ObjectId(id) }
              const options = { upsert: true };
              const updatedDoc = {
                $set: {
                  report: 'reported',
                  // transactionId: payment.transactionId
                }
              }
              const updatedResult = await categoryCollection.updateOne(filter, updatedDoc, options)
              res.send(updatedResult)
            })
            app.get('/ProductReported', async (req, res) => {
              const reportAdd = req.query.report;
              const query = { report: reportAdd }
              const result = await categoryCollection.find(query).toArray()
              res.send(result)
            })
            app.get('/userEmail', async (req, res) => {
              const userEmail = req.query.email;
              const query = { email: userEmail };
              const result = await userCollection.find(query).toArray();
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

            app.post('/create-payment-intent', async (req, res) => {
              const booking = req.body;
              const price = booking.price;
              const amount = price * 100;
              const paymentIntent = await stripe.paymentIntents.create({
                  currency: 'usd',
                  amount: amount,
                  "payment_method_types": [
                      "card"
                  ]
              });
              res.send({
                  clientSecret: paymentIntent.client_secret,
              });
          });


          app.post('/payments', async (req, res) =>{
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = {_id: ObjectId(id)}
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await productsBookingCollection.updateOne(filter, updatedDoc)
            res.send(result);
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
              app.get('/dashboard/users',async(req,res)=>{
                const query={
                  accountType:"user"
                    };
                const users= await userCollection.find(query).toArray();
                res.send(users);
              })
              app.get('/dashboard/seller',async(req,res)=>{
                const query={
                  accountType:"seller"
                    };
                const users= await userCollection.find(query).toArray();
                res.send(users);
              })

              app.get('/users/admin/:email', async (req, res) => {
                const email = req.params.email;
                const query = { email }
                const user = await userCollection.findOne(query);
                res.send({ isAdmin: user?.role === 'admin' });
            })
            app.get('/users/seller/:email',async(req,res)=>{
              const email=req.params.email;
              const query={email};
              const user = await userCollection.findOne(query);
              console.log(user)
              res.send({isSeller: user?.accountType === "seller"})
            }) 
            app.delete('/user/:id',async(req,res)=>{
              const id =req.params.id;    
              filter={_id:ObjectId(id)};
              const result=await categoryCollection.deleteOne(filter);
              res.send(result)
            })

            app.post('/users',async(req,res)=>{
                const user=req.body;
                console.log(user)
                const result=await userCollection.insertOne(user);
                 res.send(result);
            })

            app.put('/users/admin/:id',verifyJWT,verifyAdmin, async(req,res)=>{
                const id=req.params.id;
                 const filter={_id: ObjectId(id)}
                 const options={upsert:true};
                 const updatedDoc={
                   $set: {
                     role: 'admin'
                   }
                 }
                   const result =await userCollection.updateOne(filter,updatedDoc,options);
                   res.send(result)
               
               })
            app.put('/dashboard/seller/:id', async(req,res)=>{
                const id=req.params.id;
                 const filter={_id: ObjectId(id)}
                 const options={upsert:true};
                 const updatedDoc={
                   $set: {
                     verifySeller: "verifyseller"
                   }
                 }
                   const result =await userCollection.updateOne(filter,updatedDoc,options);
                   res.send(result)
               
               })

    

    }
    
    finally{

    }
}
run().catch(console.dir);




app.listen(port, () => {
    console.log(`first sale app listening on port${port}`);
  });
  