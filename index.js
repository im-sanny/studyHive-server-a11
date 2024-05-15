const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const port = process.env.PORT || 3000;

const app = express();
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://b9a11-a9c79.web.app",
    "https://b9a11-a9c79.firebaseapp.com",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// verify jwt middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).send({message: 'unauthorized access'})
  console.log(token);
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.log(err);
        return res.status(401).send({message: 'unauthorized access'})
      }
      console.log(decoded);
      req.user = decoded
      next();
    });
  }
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.96corz1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" ? true : false,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

async function run() {
  try {
    const asnCollection = client.db("studyHive").collection("asnmnts");
    const takeAsnCollection = client.db("studyHive").collection("takeAsnmnts");

    // jwt generate
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "365d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // clear token on logout
    app.get("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          maxAge: 0,
        })
        .send({ success: true });
    });

    //get all assignment data from db
    app.get("/asnmnts", async (req, res) => {
      const result = await asnCollection.find().toArray();
      res.send(result);
    });

    // get a single assignment data
    app.get("/asnmnt/:id",verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await asnCollection.findOne(query);
      res.send(result);
    });

    // save a create assignment in db
    app.post("/asnmnts",verifyToken, async (req, res) => {
      const asnData = req.body;
      console.log(asnData);
      const result = await asnCollection.insertOne(asnData);
      res.send(result);
    });

    // delete a assignment from assignment
    app.delete("/asnmnt/:id",verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await asnCollection.deleteOne(query);
      res.send(result);
    });

    // update a assignment in db
    app.put("/asnmnt/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const asnmntData = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...asnmntData,
        },
      };
      const result = await asnCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // save a take assignment in db
    app.post("/takeAsnmnt", verifyToken, async (req, res) => {
      const takeData = req.body;
      console.log(takeData);
      // return
      const result = await takeAsnCollection.insertOne(takeData);
      res.send(result);
    });

    // all assignments which are submitted by the specific user.
    app.get("/my-submit/:email", verifyToken, async (req, res) => {
      const tokenEmail = req.user.email
      const email = req.params.email;
      if (tokenEmail !== email) {
        return res.status(403).send({message: 'forbidden access'})
      }
      const query = { email };
      const result = await takeAsnCollection.find(query).toArray();
      res.send(result);
    });

    // get all pending assignment
    app.get("/pending", verifyToken, async (req, res) => {
      const query = { status: "Pending" };
      const result = await takeAsnCollection.find(query).toArray();
      res.send(result);
    });

    // update assignment status
    app.patch("/takeAsnmnt/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: status,
      };
      const result = await takeAsnCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    //get all pending or complete assignment data from db
    app.get("/allSubmitted", verifyToken, async (req, res) => {
      const result = await takeAsnCollection.find().toArray();
      res.send(result);
    });

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
