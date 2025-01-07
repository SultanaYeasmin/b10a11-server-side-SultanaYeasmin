const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.db_username}:${process.env.db_password}@cluster0.g4p4k.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    // Get the database and collection on which to run the operation
    const database = client.db("syAneDB");
    const queryCollection = database.collection("queries");
    const recommendationCollection = database.collection("recommendations");
    
    //post a query
    app.post('/add-query', async(req, res)=>{
      const queryData = req.body;
      const result = await queryCollection.insertOne(queryData);
      console.log(result)
      res.send(result)
    })

   





    
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', async(req, res)=>{
    res.send("assignment-11")
})

app.listen(port,()=>{
    console.log("port is running on port#", port)
})