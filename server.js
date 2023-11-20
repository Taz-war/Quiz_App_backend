const express = require('express')
const req = require('express/lib/request')
const res = require('express/lib/response')
const cors= require('cors')
const app = express()
const port = process.env.PORT || 3000

///midleware///
app.use(cors())
app.use(express.json())


///mongo db user name & password///
//userName : fahimtazwer
//password : ALETgHxkxEf2sl8B


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://fahimtazwer:ALETgHxkxEf2sl8B@fahim1.p8agypj.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);


///routes///
app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/blog',(req,res)=>{
    res.send('hello im from blog')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})