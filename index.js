const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const fetch = require("node-fetch");
const app = express();
const port = process.env.PORT || 5000;
const { execFile, spawn } = require("child_process");
//dotenv
require("dotenv").config();
const axios = require("axios");

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.3onslcg.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function executeCode(code, runtime) {
  return new Promise(async (resolve, reject) => {
    try {
      switch (runtime) {
        case "javascript":
          // Execute JavaScript code using Jdoodle API
          try {
            const responseJS = await axios.post(
              "https://api.jdoodle.com/v1/execute",
              {
                clientId: "e44108518313362b26f7f704e10911ed",
                clientSecret:
                  "e6ae2d62cc025ac98fde7b1f197bf1b9f0316917200730d50804f70ccd407566",
                script: code,
                stdin: "",
                language: "nodejs",
                versionIndex: "0",
              }
            );

            resolve(responseJS.data.output);
          } catch (error) {
            console.error(`Error executing JavaScript code: ${error}`);
            reject("Error executing JavaScript code");
          }
          break;

        case "python":
          // Execute Python code using Jdoodle API
          try {
            const responsePython = await axios.post(
              "https://api.jdoodle.com/v1/execute",
              {
                clientId: "e44108518313362b26f7f704e10911ed",
                clientSecret:
                  "e6ae2d62cc025ac98fde7b1f197bf1b9f0316917200730d50804f70ccd407566",
                script: code,
                stdin: "",
                language: "python3",
                versionIndex: "0",
              }
            );

            resolve(responsePython.data.output);
          } catch (error) {
            console.error(`Error executing Python code: ${error}`);
            reject("Error executing Python code");
          }
          break;

        case "go":
          // Execute Go code using the Go Playground API
          const goResponse = await fetch("https://play.golang.org/compile", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `version=2&body=${encodeURIComponent(code)}`,
          });
          const goResult = await goResponse.json();
          if (goResult.Errors) {
            reject(goResult.Errors);
          } else {
            resolve(goResult.Events[0].Message);
          }
          break;
        case "cpp":
          // Execute C++ code using Jdoodle API
          try {
            const response = await axios.post(
              "https://api.jdoodle.com/v1/execute",
              {
                clientId: "e44108518313362b26f7f704e10911ed",
                clientSecret:
                  "e6ae2d62cc025ac98fde7b1f197bf1b9f0316917200730d50804f70ccd407566",
                script: code,
                stdin: "",
                language: "cpp",
                versionIndex: "0",
              }
            );

            resolve(response.data.output);
          } catch (error) {
            console.error(`Error executing C++ code: ${error}`);
            reject("Error executing C++ code");
          }
          break;

        case "php":
          // Execute PHP code using Jdoodle API
          try {
            const response = await axios.post(
              "https://api.jdoodle.com/v1/execute",
              {
                clientId: "e44108518313362b26f7f704e10911ed",
                clientSecret:
                  "e6ae2d62cc025ac98fde7b1f197bf1b9f0316917200730d50804f70ccd407566",
                script: code,
                stdin: "",
                language: "php",
                versionIndex: "0",
              }
            );

            resolve(response.data.output);
          } catch (error) {
            console.error(`Error executing PHP code: ${error}`);
            reject("Error executing PHP code");
          }
          break;

        default:
          reject(`Runtime ${runtime} is not supported`);
      }
    } catch (error) {
      reject(`Error executing ${runtime} code: ${error}`);
    }
  });
}

async function run() {
  try {
    // await client.connect();

    const db = client.db("RunMeQuickDB");
    const executionsCollection = db.collection("executions");

    app.post("/api/execute", async (req, res) => {
      const { code, runtime, userEmail } = req.body;

      try {
        const executionResult = await executeCode(code, runtime);
        const executionRecord = {
          code,
          runtime,
          result: executionResult,
          userEmail,
          createdAt: new Date().toLocaleString("en-GB", {
            dateStyle: "short",
            timeStyle: "short",
          }),
          userEmail,
        };
        await executionsCollection.insertOne(executionRecord);

        res.json({ status: "Execution Complete", result: executionResult });
      } catch (error) {
        console.error("Error executing code:", error);
        res.status(500).json({ error });
      }
    });
    app.get("/api/execute", async (req, res) => {
      let query = {};
      if (req.query?.userEmail) {
        query = { userEmail: req.query.userEmail };
      }
      try {
        const executions = await executionsCollection.find(query).toArray();
        res.json({ executions });
      } catch (error) {
        console.error("Error fetching repositories:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
