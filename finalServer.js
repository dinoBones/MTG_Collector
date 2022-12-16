const http = require("http");
const express = require("express");   /* Accessing express module */
const fileSys = require("fs");
const bodyParser = require("body-parser");
const path = require("path");
const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config({ path: path.resolve(__dirname, '.env') }) 
const fetch = require("node-fetch");
const app = express();  /* app is a request handler function */

const readline = require('readline');
const { text } = require("express");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

app.use(bodyParser.urlencoded({ extended: false }));

let portNumber = (process.argv.slice(2,3)[0]);


const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};

const uri = `mongodb+srv://${userName}:${password}@cluster0.1yt9kto.mongodb.net/?retryWrites=true&w=majority`;
//const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.set("views", path.resolve(__dirname, "pages"));

app.set("view engine", "ejs");

app.use('/css', express.static('css'));


app.get("/", (request, response) => {
    fileSys.readFile('pages/index.ejs', function(err, data) {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(data);
        return response.end();
    })
});

app.post("/", async (request, response) => {

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    //console.log(`https://api.magicthegathering.io/v1/cards?name=${request.body.card.toString()}`)
    await fetch(`https://api.magicthegathering.io/v1/cards?name=${request.body.cardName.toString()}&set=${request.body.cardSet.toString()}&number=${request.body.cardNum.toString()}`)
    .then(response => response.json())
    .then(async data => {
        //const cards = JSON.parse(data).cards;
        var element = data?.cards[0];

        const variables = {
            cardName: "Added " + element?.name + " to your collection" ?? "Card Doesnt Exist",
            imgURL: element?.imageUrl ?? "\"\" alt=\"No Image Avaliable\""
        };
        
        await response.render("processForm", variables);

        try {
            await client.connect();
            let newCard = {cardName: element?.name, cardSet: element?.set, cardNum: element?.number, imgURL: element?.imageUrl};
            await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newCard);
        } catch (e) {
            console.error(e);
        } finally {
            await client.close();
        }

        /* cardList.find(async element => {

            if (element?.set == request.body.cardSet.toString() && element?.number == request.body.cardNum.toString()) {

                const variables = {
                    cardName: element?.name ?? "Card Doesnt Exist",
                    imgURL: element?.imageUrl ?? ""
                };
                
                await response.render("processForm", variables);

                try {
                    await client.connect();
                    let newCard = {cardName: element?.name, cardSet: element?.set, cardNum: element?.number, imgURL: element?.imageUrl};
                    await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newCard);
                } catch (e) {
                    console.error(e);
                } finally {
                    await client.close();
                }
            }
            
        }); */
    });

//        try {
//            await client.connect();
//            let newApplicant = {name: variables.name, email: variables.email, GPA: variables.GPA, background: variables.background}
//            await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newApplicant);
//        } catch (e) {
//           console.error(e);
//        } finally {
//            await client.close();
//        }
});

app.get("/collection", async (request, response) => {

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    try {
        await client.connect();
        const cursor = await client.db(databaseAndCollection.db)
                    .collection(databaseAndCollection.collection)
                    .find({});
        var collection = "<table border = 1><tr><th>Card Name</th><th>Set ID</th><th>Card Number</th><th>Image</th></tr>";
        await cursor.forEach(element => {
            if (element?.imgURL) {
                collection += "<tr><td>" + element?.cardName + "</td><td>" + element?.cardSet + "</td><td>" + element?.cardNum + "</td><td><img src=" + element?.imgURL + "></td></tr>";
            } else {
                collection += "<tr><td>" + element?.cardName + "</td><td>" + element?.cardSet + "</td><td>" + element?.cardNum + "</td><td>No Image Avaliable</td></tr>";
            }
        });
        collection += "</table>"

        const variables = {
            collection: collection
        }

        response.render("collection", variables);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

});

app.listen(portNumber);
console.log(`Web server started and running at http://localhost:${portNumber}`);
var askQuestion = function() {
    rl.question(`Stop to shut down the server: `, userInput => {
        if (userInput == 'stop') {
            console.log("Shutting down the server");
            process.exit(0);
        } else {
            console.log(`Invalid command: ${userInput}`);
        }
        askQuestion();
    });
};
askQuestion();