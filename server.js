const express = require("express");
const req = require("express/lib/request");
const res = require("express/lib/response");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

///midleware///
app.use(cors());
app.use(express.json());

///mongo db user name & password///
//userName : fahimtazwer
//password : ALETgHxkxEf2sl8B

const uri =
  "mongodb+srv://fahimtazwer:ALETgHxkxEf2sl8B@fahim1.p8agypj.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("QuizDB");
    const QuestionCollection = database.collection("Questions");
    const StudentCollection = database.collection("StudentCollection");
    ///get request///
    app.get("/questionSet", async (req, res) => {
      const cursor = QuestionCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/EditQuiz/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await QuestionCollection.findOne(query);
      res.send(result);
    });

    ///post request////
    app.post("/questionSet", async (req, res) => {
      const question = req.body;
      console.log("new question created");
      const result = await QuestionCollection.insertOne(question);
      res.send(result);
    });

    ///update request///
    app.put("/EditQuiz/:id", async (req, res) => {
      const id = req.params.id;
      const Quiz = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      console.log("heelol ami tazwer", id);
      const updatedQuiz = {
        $set: {
          date: Quiz.date,
          questionSetTitle: Quiz.questionSetTitle,
          questions: Quiz.questions,
        },
      };
      const result = await QuestionCollection.updateOne(
        filter,
        updatedQuiz,
        options
      );
      res.send(result);
    });

    ///delete post///
    app.delete("/questionset/:id", async (req, res) => {
      const id = req.params.id;
      const ids = id.split(",");
      const idsToDelete = ids.map((id) => new ObjectId(id));
      const result = await QuestionCollection.deleteMany({
        _id: {
          $in: idsToDelete,
        },
      });
      res.send(result);
      // console.log(result);
    });

    ///launch quiz////
    app.get("/questionSet/:id", async (req, res) => {
      const id = req.params.id;
      const d =req.body
      var result = "";
      var characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      var charactersLength = characters.length;

      for (var i = 0; i < 6; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }
      // if (Object.keys(d).length === 0) {
        res.send(result)
      // }
      console.log(Object.keys(d).length === 0)
    // // Insert the document into the other collection
      const insertResult = await StudentCollection.insertOne({_id: new ObjectId(id),roomName:result});
      console.log(insertResult)
      // await studentRun(id)
    });

    ///student quiz entry///
    app.get("/student/:room",async(req,res)=>{
      logInRoom=req.params.room
      const query = {roomName: logInRoom}; 
      // console.log(query)
      // const projection = { roomName: 1, _id: 1 };
      const data = await StudentCollection.findOne(query);
      console.log(data)
      // res.send(data)
      if (JSON.stringify(query.roomName) === JSON.stringify(data.roomName)) {
        res.send({...data,result:true})
        console.log('room name is correct')
      }else{
        res.send({ data:null, result: false })
      }
    })

    app.put('student/loginInfo/:id',async (req,res)=>{
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

///routes///
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/blog", (req, res) => {
  res.send("hello im from blog");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
