const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;

const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');



require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',

  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  console.log('inside verify token middleware', req.cookies);

  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' });
    }
    req.user = decoded;

    next();
  })
}
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

    //Auth related APIs
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '365d' });
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: false,

        })
        .send({ success: true })
    })

    app.post('/logout', async (req, res) => {
      res
        .clearCookie('token', { httpOnly: true, secure: false })
        .send({ success: true })
    })


    //post a query
    app.post('/add-query', verifyToken, async (req, res) => {
      const queryData = req.body;
      const result = await queryCollection.insertOne(queryData);
      console.log(result)
      res.send(result)
    })

    //read all queries in descending order
    app.get('/queries', async (req, res) => {
      let search = req.query.search;
      let query = {}
      if (search) {
        query = {
          product_name: {
            $regex: search,
            $options: 'i',
          },
        }

      }

      const options = {
        sort: { query_date: -1 },
      };
      const result = await queryCollection.find(query, options).toArray();
      // console.log(result)
      res.send(result);
    })
    //read all queries in descending order only 6
    app.get('/queries-six', async (req, res) => {
      const query = {};
      const options = {
        sort: { query_date: -1 },
      };
      const result = await queryCollection.find(query, options).limit(6).toArray();

      res.send(result);
    })

    //read my query
    app.get('/queries/:email', verifyToken, async (req, res) => {
      const emailAddress = req.params.email;
      const query = { user_email: emailAddress };

      //token email !== query email
      if (req.user.email !== emailAddress) {
        console.log(req.user.email, emailAddress)
        return res.status(403).send({ message: "forbidden access" })
      }
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

    app.put('/update-query/:id',verifyToken, async (req, res) => {

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
    app.post('/add-recommendation',  async (req, res) => {
      const recommendation = req.body;
      const result = await recommendationCollection.insertOne(recommendation);
      console.log(result)
      //
      const id = recommendation.queryId;
      const query = { _id: new ObjectId(id) };

      const query1 = await queryCollection.findOne(query);

     
      //update recommendationCount
      const filter = { _id: new ObjectId(id) };
      // const options = { upsert: true };
      const updateDoc = {
        $inc: {
          recommendationCount: 1
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

    app.get('/recommendations', verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { recommenderEmail: email };
      // console.log(query);
      //token email !== query email
      if (req.user.email !== email) {
        console.log(req.user.email, email)
        return res.status(403).send({ message: "forbidden access" })
      }

      const result = await recommendationCollection.find(query).toArray();
      res.send(result);
    })


    app.get('/recommendations-for-me/:email', verifyToken , async (req, res) => {
      const email = req.params.email;
      const query = { userEmailQuery: email };
      // console.log(query);
       //token email !== query email
       if (req.user.email !== email) {
        console.log(req.user.email, email)
        return res.status(403).send({ message: "forbidden access" })
      }
      const result = await recommendationCollection.find(query).toArray();

      res.send(result);
    })

    //delete single recommendation with specific id
    app.delete('/myRecommendations/:id', async (req, res) => {

      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const recommendation1 = await recommendationCollection.findOne(query);
      const queryId = recommendation1.queryId;
      const result = await recommendationCollection.deleteOne(query);
    
            
            //update recommendationCount
      const filter = { _id: new ObjectId(queryId) };
      // const options = { upsert: true };
      const updateDoc = {
        $inc: {
          recommendationCount: -1
        },
      };

      const updatedResult = await queryCollection.updateOne(filter, updateDoc);

      res.send(result)
      
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