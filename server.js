const express = require("express");
const req = require("express/lib/request");
const res = require("express/lib/response");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const http = require("http");
const socket = require("socket.io");
const port = process.env.PORT || 5000;

///midleware///
app.use(cors({ origin: "http://localhost:4000" }));
app.use(express.json());
const server = http.createServer(app);
// const io = socketIo(server);
var io = socket(server, {
  cors: {
    origin: "http://localhost:4000",
    // methods: ["GET", "POST"]
  },
});

var room_name = "C7h9EM";
// io.on("connection", (socket) => {
//   console.log("New client connected");

//   // Joining a room

//   socket.join(room_name);
//   io.sockets.in(room_name).emit("connectedRoom", "you r connected to " + room_name)
//   socket.on('questionComplete',(data)=>{
//     // console.log('i dont know',data)
//     io.sockets.in(room_name).emit("questionCompleted", data)
//   })

//   socket.on('totalQuestions',(data=>{
//     io.sockets.in(room_name).emit("steps", data)
//   }))
//     // let roomSize = io.sockets.adapter.rooms.get(room_name).size - 1;
//     // io.sockets.in(room_name).emit("roomSize", roomSize + "user joined this room");
//   // socket.on("joinRoom", (room) => {
//   //   socket.join(room);
//   //   io.sockets.in(room).emit("connectedRoom", "you r connected to " + room);
//   //   let roomSize = io.sockets.adapter.rooms.get(room).size - 1;
//   //   io.sockets.in(room).emit("roomSize", roomSize + "user joined this room");
//   //   console.log(`A user joined room: ${room}`);
//   // });

//   // Receiving a message and broadcasting it to the room
//   socket.on("sendMessage", ({ room, message }) => {
//     io.to(room).emit("message", message);
//   });

//   socket.on("disconnect", () => {
//     console.log("Client disconnected");
//   });
// });

// ... previous imports and setup

io.on("connection", (socket) => {
  // Assuming user data is sent during connection
  socket.on("joinRoom", (room, userData, steps, questionCompleted) => {
    socket.join(room);
    // Store user data in the room's context (can be an array or object)
    addUserToRoom(room, userData);
    const tempData = {
      id: userData.id,
      studentName: userData.name,
      questionCompleted: questionCompleted,
    };
    console.log(tempData);
    // Notify the admin module

    io.to("admin").emit("userJoined", tempData, steps);
  });
  socket.on("joinAdminRoom", (adminRoomName) => {
    socket.join(adminRoomName);
  });

  socket.on("disconnect", () => {
    // Update room data and notify admin
    const userData = removeUserFromRoom(socket.id);
    io.to("admin").emit("userLeft", userData.room, userData);
  });
});

// Dummy functions to manage room data
function addUserToRoom(room, userData) {
  // Implement adding user to room logic
}

function removeUserFromRoom(socketId) {
  // Implement removing user from room logic
  return { room: "exampleRoom", userData: {} }; // Return user data
}

server.listen(port, () => {
  console.log("Server listening on port 5000");
});

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
      const d = req.body;
      var result = "";
      var characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      var charactersLength = characters.length;

      for (var i = 0; i < 6; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }
      room_name = result;
      res.send(result);
      const query = { _id: new ObjectId(id) };
      const data = await StudentCollection.findOne(query);
      console.log(data);
      if (data == null) {
        // Insert the document into the other collection
        const insertResult = await StudentCollection.insertOne({
          _id: new ObjectId(id),
          roomName: result,
        });
         console.log(insertResult);
      } else {
        const filter = { _id:new ObjectId(id) };
        const options = { upsert: true };
        const updatedQuiz = {
          $set: {
            roomName: result,
          },
        };
        const data = await StudentCollection.updateOne(
          filter,
          updatedQuiz,
          options
        );
        console.log(data)
      }
     
      // await studentRun(id)
    });

    ///student quiz entry///
    app.get("/student/:room", async (req, res) => {
      logInRoom = req.params.room;
      const query = { roomName: logInRoom };
      // console.log(query)
      // const projection = { roomName: 1, _id: 1 };
      const data = await StudentCollection.findOne(query);
      // console.log(data);
      // res.send(data)
      if (data != null) {
        res.send({ ...data, result: true });
        console.log("room name is correct");
      } else {
        res.send({ data: null, result: false });
      }
    });

    app.put("/student/loginInfo/:id", async (req, res) => {
      const id = req.params.id;
      const studentInfo = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateStudentInfo = {
        $push: {
          students: studentInfo,
        },
      };
      const result = await StudentCollection.updateOne(
        filter,
        updateStudentInfo,
        options
      );
      res.send(result);
    });

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
// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

// app.get("/blog", (req, res) => {
//   res.send("hello im from blog");
// });

io.on("connection", (socket) => {
  socket.on("connectQuiz", (data) => {
    console.log(data);
    console.log("New client connected", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});
