import express from "express";
import mongoose from "mongoose";
import { StoryModel } from "./entities/Story.js";
import { UserModel } from "./entities/User.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

const jwtSecret = "ilakatha mafilia";

const app = express();

//adding middleware
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//setting up view engine
app.set("view engine", "ejs");

app.listen(9000, () => {
  console.log("listening on port 9000");
});

mongoose.set("debug", true);
const connectToDb = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/storybox");
    console.log("connected to mongodb");
  } catch (err) {
    console.log("failed to connect to db: ", err);
  }
};

connectToDb();

/*
 * Html Pages rendered on server
 * +------------------------------------------------------+
 */
app.get("/", (req, res) => {
  res.render("home");
});

app.get("/register-page", (req, res) => {
  res.render("register-page");
});

app.get("/login-page", (req, res) => {
  res.render("login-page");
});

/*
 * +------------------------------------------------------+
 */

//endpoints
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  let userExists = await UserModel.exists({ email: email });
  if (userExists) {
    res.send("user already exist with mail");
  }

  let newUser = {
    email: email,
    password: password,
  };

  let savedUser = await UserModel.create(newUser);

  //change to res.json() later
  res.send("User Registed");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  let user = await UserModel.findOne({ email: email });
  console.log("user fetched from db: ", user);

  if (!user) {
    res.cookie("storyboxtoken");
    res.send("No User exists");
  }

  if (user.password === password) {
    let loginObject = {email: email , password: password}
    const jwtToken = jwt.sign(loginObject, jwtSecret);
    res.cookie("storyboxtoken", jwtToken);
    res.send("User is valid");
  } else {
    res.cookie("storyboxtoken");
    res.send("User is invalid");
  }
});

app.get("/top-stories", async (req, res, next) => {
  const stories = await StoryModel.find()
    .sort({ likes: 1 })
    .sort({ title: 1 })
    .limit(100);
  res.json({ result: "SUCCESS", stories: stories });
});

app.post("/new-story", async (req, res, next) => {
  let newStory = {
    title: req.body.title,
    author: req.body.author,
    content: req.body.content,
    tags: req.body.tags,
  };

  const savedStory = await StoryModel.create(newStory);
  res.json({ result: "SUCCESS", story: savedStory });
});

app.put("/story", async (req, res, next) => {
  const existing_story1 = await StoryModel.find({ title: req.body.title });
  let existing_story = {
    title: req.body.title,
    author: req.body.author,
    content: req.body.content,
    tags: req.body.tags,
  };

  const savedStory = await StoryModel.create(existing_story);
  res.json({ result: "SUCCESS", story: savedStory });
});

app.get("/story/search", async (req, res, next) => {
  // const title = req.params.title;
  const title = req.query.title;
  const story = await StoryModel.find({ title: title }).limit(1);
  res.json({ result: "SUCCESS", title: title, story: story[0] });
});

app.get("/story", async (req, res, next) => {
  let userCookies = req.cookies; //set in postman during testing
  let token = userCookies.storyboxtoken;
  console.log("token parsed ", token);
  if (!token) {
    res.status(400).json({ result: "FAILURE" });
  }

  let {email} = jwt.decode(token, jwtSecret);
  // const username = email.split("@")[0];
  let userStories = await StoryModel.find({author:email});
  console.log("user stories: ",userStories)

  res.json({ result: "SUCCESS" , stories: userStories });
});
