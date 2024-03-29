const express = require("express");
const req = require("express/lib/request");
const res = require("express/lib/response");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const http = require("http");
const socket = require("socket.io");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

///midleware///
app.use(cors({ origin: ["http://localhost:4000"], credentials: true }));
app.use(express.json());
app.use(cookieParser());
const server = http.createServer(app);
// const io = socketIo(server);
var io = socket(server, {
  cors: {
    origin: "*",
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

const uri = `mongodb+srv://fahimtazwer:ALETgHxkxEf2sl8B@fahim1.p8agypj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

///custom middleWare///
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log('assalamualaikum', token)
  if (!token) {
    return res.status(401).send({ message: "unauthorised access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorised access" });
    }
    req.user = decoded;
    next()
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("QuizDB");
    const QuestionCollection = database.collection("Questions");
    const StudentCollection = database.collection("StudentCollection");
    const ReportCollection = database.collection("ReportCollection");
    const UserCollection = database.collection("UserCollection");

    ///auth related api///
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    app.get("/logOut", async (req, res) => {
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    ///Service related api///

    app.get("/", async (req, res) => {
      res.json({ name: "fahim" });
    });
    ///get request///
    app.get("/questionSet/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      console.log(req.query.email)
      console.log('token owner info', req.user)
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
    app.post("/questionSet", verifyToken, async (req, res) => {
      const id = req.params.id;
      const question = req.body;
      const result = await QuestionCollection.insertOne(question);
      res.send(result);
    });

    ///update request///
    app.put("/EditQuiz/:id", verifyToken, async (req, res) => {
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
    app.delete("/questionset/:id", verifyToken, async (req, res) => {
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
    app.get("/LaunchQuestionSet/:QId", verifyToken, async (req, res) => {
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
      if (data == null) {
        // Insert the document into the other collection
        const insertResult = await StudentCollection.insertOne({
          _id: new ObjectId(id),
          userId: question.userId,
          roomName: result,
          questionTitle: question.questionSetTitle,
          publishedDate: formattedDate,
        });
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
      }

      // await studentRun(id)
    });

    ///student quiz entry///
    app.get("/student/:room", async (req, res) => {
      logInRoom = req.params.room;
      const query = { roomName: logInRoom };
      // const projection = { roomName: 1, _id: 1 };
      const data = await StudentCollection.findOne(query);
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
    app.get("/publishedQuestions/:uid", verifyToken, async (req, res) => {
      const uid = req.params.uid;
      const query = { userId: uid };
      const cursor = StudentCollection.find(query);
      const result = await cursor.toArray();
      // console.log(result)
      res.send(result);
    });

    ///get report///
    app.get("/getReports/:id", verifyToken, async (req, res) => {
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
    app.get("/searchUser/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
      const user = await UserCollection.findOne(query);
      if (user === null) {
        res.send(false);
      } else {
        res.send(true);
      }
    });

    ///get user Info///
    app.get("/userInfo/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
      const result = await UserCollection.findOne(query);
      res.send(result);
    });

    ///get rooms ///
    app.get("/getRooms/:uid", verifyToken, async (req, res) => {
      const id = req.params.uid;
      const query = { userId: id };
      const cursor = StudentCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    ///update teacher profile///
    app.put("/teacherProfile/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: id };
      const options = { upsert: true };
      const updatedProfileInfo = {
        $set: body,
      };
      const result = await UserCollection.updateOne(
        filter,
        updatedProfileInfo,
        options
      );
      res.send(result);
    });

    ///handle delete teacher profile///
    app.delete("/teacherProfile/delete/:uid", verifyToken, async (req, res) => {
      const id = req.params.uid;
      const query = { _id: id };
      const result = await UserCollection.deleteOne(query);
      res.send(result);
    });

    ///handle delete report///
    app.delete("/reports/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      // const result = await ReportCollection.deleteOne(query)
      console.log(id);
      // console.log(result)
      // res.send(result)
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