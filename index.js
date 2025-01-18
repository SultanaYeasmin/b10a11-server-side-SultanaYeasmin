const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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
    app.post('/add-query', async (req, res) => {
      const queryData = req.body;
      const result = await queryCollection.insertOne(queryData);
      console.log(result)
      res.send(result)
    })

    //read all queries in descending order
    app.get('/queries', async (req, res) => {
      const query = {};
      const options = {
        sort: { query_date: -1 },
      };
      const result = await queryCollection.find(query, options).toArray();
      console.log(result)
      res.send(result);
    })

    //read my query
    app.get('/queries/:email', async (req, res) => {
      const emailAddress = req.params.email;
      const query = { user_email: emailAddress }
      const options = {

        sort: { query_date: -1 },

      };
      const result = await queryCollection.find(query, options).toArray();
      res.send(result);
    })

    //get single query as per specific id
    app.get('/query/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await queryCollection.findOne(query);
      res.send(result);
    })

    app.put('/update-query/:id', async (req, res) => {

      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updatedQueryData = req.body;
      const updateDoc = {
        $set: updatedQueryData
      };
      const result = await queryCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    })

    //delete single query with specific id
    app.delete('/query/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await queryCollection.deleteOne(query);
      res.send(result);
    })

    //post a Recommendation
    app.post('/add-recommendation', async (req, res) => {
      const recommendation = req.body;
      const result = await recommendationCollection.insertOne(recommendation);
console.log(result)
      //
      const id = recommendation.queryId;
      const query = { _id: new ObjectId(id) };

      const query1 = await queryCollection.findOne(query);

      let newCount = 0;
      if (query1.recommendationCount) {
        newCount = query1.recommendationCount + 1;
      }
      else {
        newCount = 1
      }

      //update recommendationCount
      const filter = { _id: new ObjectId(id) };
      // const options = { upsert: true };
      const updateDoc = {
        $set: {
          recommendationCount: newCount
        },
      };

      const updatedResult = await queryCollection.updateOne(filter, updateDoc);

      res.send(result)
    })

    // read all Recommendations for specific id
    app.get('/recommendations/:queryId', async (req, res) => {
      const queryId = req.params.queryId;
      const query = { queryId: queryId };
      // console.log(query)
      const result = await recommendationCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/recommendations', async (req, res) => {
      const email = req.query.email;
      const query = {recommenderEmail: email };
      // console.log(query);
      const result = await recommendationCollection.find(query).toArray();
      res.send(result);
    })
    app.get('/recommendations-for-me/:email', async (req, res) => {
      const email = req.params.email;
      const query = { userEmailQuery: email };
      // console.log(query);
      const result = await recommendationCollection.find(query).toArray();

      res.send(result);
    })

     //delete single recommendation with specific id
     app.delete('/myRecommendations/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await recommendationCollection.deleteOne(query);
      res.send(result);
    })

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', async (req, res) => {
  res.send("assignment-11")
})

app.listen(port, () => {
  console.log("port is running on port#", port)
})