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
    // origin: "http://localhost:4000",
    origin: "*",
    // methods: ["GET", "POST"]
  },
});

const roomUserCount = {};

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

    // Notify the admin module

    let roomSize = io.sockets.adapter.rooms.get(room).size;

    io.to("admin").emit("userJoined", tempData, steps, room, roomSize);
  });
  socket.on("joinAdminRoom", (adminRoomName) => {
    socket.join(adminRoomName);
  });

  socket.on("startExam", (data) => {
    // socket.emit('showQuiz',data)
    io.to(data.roomName).emit("examStarted", data);
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
    const ReportCollection = database.collection("ReportCollection");
    const UserCollection = database.collection("UserCollection");
    ///get request///
    app.get("/questionSet/:id", async (req, res) => {
      const id = req.params.id
      const query = { userId: id };
      const cursor = QuestionCollection.find(query);
      const result = await cursor.toArray();

      const projection = { _id: 1 };
      const studentCursor = StudentCollection.find({}, { projection });
      const studentResult = await studentCursor.toArray();

      // res.send(result);
      res.json({
        questions: result,
        studentIds: studentResult,
      });
    });

    app.get("/EditQuiz/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await QuestionCollection.findOne(query);
      res.send(result);
    });

    ///post request////
    app.post("/questionSet", async (req, res) => {
      const id = req.params.id
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
    });

    ///launch quiz////
    app.get("/LaunchQuestionSet/:QId", async (req, res) => {
      const id = req.params.QId;
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

      const currentDate = new Date();
      const formattedDate = formatDate(currentDate);

      const query = { _id: new ObjectId(id) };
      const data = await StudentCollection.findOne(query);
      const question = await QuestionCollection.findOne(query);
      console.log(question.userId);
      if (data == null) {
        // Insert the document into the other collection
        const insertResult = await StudentCollection.insertOne({
          _id: new ObjectId(id),
          userId:question.userId,
          roomName: result,
          questionTitle: question.questionSetTitle,
          publishedDate: formattedDate,
        });
        console.log(insertResult);
      } else {
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updatedQuiz = {
          $set: {
            roomName: result,
            publishedDate: formattedDate,
          },
        };
        const data = await StudentCollection.updateOne(
          filter,
          updatedQuiz,
          options
        );
        console.log(data);
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

    ///published questions////
    app.get("/publishedQuestions/:uid", async (req, res) => {
      const uid =req.params.uid
      const query ={userId:uid}
      const cursor = StudentCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    ///get report///
    app.get("/publishedQuestions/:id", async (req, res) => {
      const id = req.params.id;
      const pipeline = [
        { $match: { _id: new ObjectId(id) } },
        { $unwind: "$students" },
        {
          $project: {
            _id: 0,
            id: "$students.id",
            answer: "$students.answer",
            name: "$students.name",
            email: "$students.email",
          },
        },
      ];
      const studentAnswers = await StudentCollection.aggregate(
        pipeline
      ).toArray();
      const TeacherPipeline = [
        { $match: { _id: new ObjectId(id) } },
        { $unwind: "$questions" },
        {
          $project: {
            _id: 0,
            Answer: "$questions.Answer",
            Point: "$questions.Point",
          },
        },
      ];
      const teacherAnswers = await QuestionCollection.aggregate(
        TeacherPipeline
      ).toArray();
      const findResult = await ReportCollection.findOne({
        _id: new ObjectId(id),
      });
      if (findResult === null) {
        const reports = await calculateMarks(studentAnswers, teacherAnswers);
        res.send(reports);
        const insertResult = await ReportCollection.insertOne({
          _id: new ObjectId(id),
          StudentsReport: reports,
        });
      } else {
        res.send(findResult.StudentsReport);
      }
    });

    ///Sign up functionality///
    app.post("/teacher/signUp/:id", async (req, res) => {
      const id = req.params.id;
      const user = req.body;
      const newUser = {
        _id: id,
        ...user,
      };
      const result = await UserCollection.insertOne(newUser);
      res.send(result);
    });

    ///search user for google sign in///
    app.get('/searchUser/:id',async (req,res)=>{
      const id = req.params.id
      const query = {_id: id}
      const user = await UserCollection.findOne(query);
      console.log(user)
      if (user=== null ) { 
        res.send(false)
      }else{
        res.send(true)
      }
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

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // January is 0!
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
}

////report generating function////
function calculateMarks(students, actualAnswers) {
  // Convert actual answers to a more accessible format
  const answerKey = {};
  actualAnswers.forEach((answerObj) => {
    if (Array.isArray(answerObj.Answer)) {
      answerObj.Answer.forEach((ans) => {
        answerKey[ans.trim().toLowerCase()] = parseInt(answerObj.Point, 10);
      });
    } else {
      let answer =
        typeof answerObj.Answer === "boolean"
          ? answerObj.Answer
          : answerObj.Answer.trim().toLowerCase();
      answerKey[answer] = parseInt(answerObj.Point, 10);
    }
  });

  // Calculate marks for each student
  const studentMarks = students.map((student) => {
    let totalMarks = 0;

    for (const questionId in student.answer) {
      let studentAnswer = student.answer[questionId];
      studentAnswer =
        typeof studentAnswer === "boolean"
          ? studentAnswer
          : studentAnswer.trim().toLowerCase();

      if (answerKey[studentAnswer] !== undefined) {
        totalMarks += answerKey[studentAnswer];
      }
    }

    return {
      id: student.id,
      totalMarks,
      name: student.name,
      email: student.email,
    };
  });
  return studentMarks.sort((a, b) => b.totalMarks - a.totalMarks);
}

///routes///
// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

// app.get("/blog", (req, res) => {
//   res.send("hello im from blog");
// });
