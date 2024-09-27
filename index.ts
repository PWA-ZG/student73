import path from "path";
import express from "express";
import fs from 'fs';
import https from 'https';
import multer from "multer";
import fse from "fs-extra"

const externalUrl = process.env.RENDER_EXTERNAL_URL; 
const port = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 4080;

const app = express();

app.use(express.json()); 

app.use(express.static(path.join(__dirname, "public")));

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const UPLOAD_PATH = path.join(__dirname, "public", "uploads");
var uploadSnaps = multer({
    storage:  multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, UPLOAD_PATH);
        },
        filename: function (req, file, cb) {
            let fn = file.originalname.replaceAll(":", "-");
            cb(null, fn);
        },
    })
}).single("image");
app.post("/saveSnap",  function (req, res) {
    uploadSnaps(req, res, async function(err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                error: {
                    message: 'Upload failed:: ' + JSON.stringify(err)
                }
            });
        } else {
            console.log(req.body);
            res.json({ success: true, id: req.body.id });

        }
    });
});
app.get("/snaps", function (req, res) {
    let files = fse.readdirSync(UPLOAD_PATH);
    files = files.reverse().slice(0, 10);
    console.log("In", UPLOAD_PATH, "there are", files);
    res.json({
        files
    });
});

if (externalUrl) {   
    const hostname = '0.0.0.0'; //ne 127.0.0.1   
    app.listen(port, hostname, () => {
             console.log(`Server locally running at http://${hostname}:${port}/ and from
              outside on ${externalUrl}`);
        });
} 
else {   
    https.createServer({     
        key: fs.readFileSync('localhost-key.pem'),     
        cert: fs.readFileSync('localhost.pem')   
    }, app)   
    .listen(port, function () {     
        console.log(`Server running at https://localhost:${port}/`);
       });
} 

