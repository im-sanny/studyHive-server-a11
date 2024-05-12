const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 3000;

const app = express();
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.96corz1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    const asnCollection = client.db("studyHive").collection("asnmnts");
    const takeAsnCollection = client.db("studyHive").collection("takeAsnmnts");

    //get all assignment data from db
    app.get("/asnmnts", async (req, res) => {
      const result = await asnCollection.find().toArray();
      res.send(result);
    });

    // get a single assignment data
    app.get("/asnmnt/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await asnCollection.findOne(query);
      res.send(result);
    });

    // get all assignment created by specific user
    //later
    // app.get('/asnmnts/:email', async(req, res) =>{
    //   const email = req.params.email
    //   const query = {'student.email': email}
    //   const result = await asnCollection.find(query).toArray()
    //   res.send(result)
    // })

    // save a create assignment in db
    app.post("/asnmnts", async (req, res) => {
      const asnData = req.body;
      console.log(asnData);
      const result = await asnCollection.insertOne(asnData);
      res.send(result);
    });

    // delete a assignment from assignment
    app.delete("/asnmnt/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await asnCollection.deleteOne(query);
      res.send(result);
    });

    // update a assignment in db
    app.put('/asnmnt/:id', async (req, res) =>{
      const id = req.params.id
      const asnmntData = req.body
      const query = {_id: new ObjectId(id)}
      const options = {upsert: true}
      const updateDoc={
        $set:{
          ...asnmntData,
        }
      }
      const result = await asnCollection.updateOne(query, updateDoc, options)
      res.send(result);
    })

    // save a take assignment in db
    app.post("/takeAsnmnt", async (req, res) => {
      const takeData = req.body;
      console.log(takeData);
      // return
      const result = await takeAsnCollection.insertOne(takeData);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from StudyHive server...");
});

app.listen(port, () => console.log(`Server running on port ${port}`));
