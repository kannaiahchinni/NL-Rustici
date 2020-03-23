const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
const fs = require('fs');
const unzip = require('unzip2');


const appPort = 3000;
const resource_path = __dirname+'/uploads';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


const storage = multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, resource_path);
    },
    filename: (req, file, callback) => {
      callback(null, Date.now() + '-' + file.originalname);
    }
  });

  var uploadFile = multer({
    storage: storage,
    onFileUploadStart: function (file) {
      console.log(file.originalname, ' file upload starting ');
    }
  });

var extractFile = (file) => {
    var filename = file.filename;
    try{
        filename = filename.split('.').slice(0, -1).join('.');
    }catch(error) {
    }
    const dir = __dirname + '/resources/' + filename;

    return new Promise((resolve, reject) => {
        fs.createReadStream(file.path).pipe(unzip.Extract({path: dir}))
        .on('close', () => {
        });
    });
};


var octetStreamParser =  bodyParser.raw({
    inflate: true,
    limit: '5gb',
    type: 'application/octet-stream',
    verify: function(req, res, buf, encoding) {
      req.rawBody = buf.toString(encoding || 'utf-8');
  
  }
  });

app.get('/',function(req,res){
    res.sendFile(__dirname + "/public/index.html");
});


// register endpoints quickly to test

app.get('/lrs/api/test/connection', (req, res) => {
    console.log(' filename '+ req);
    res.json({name: 'Karunakar Medamoni '});
});

/**
 * Play content from resource folder 
 */
app.use('/resources',express.static('resources'));

/**
 *  Convert Octet Stream into JSON format.
 *  Send rawBody which was converted by octetStreamParser function.
 */

app.post('/lrs/api/octet/parser', octetStreamParser, (req, res, next) => {
    return res.send({body:req.rawBody});
});


/**
 * File upload and extract into resource folder. 
 */
app.post('/lrs/api/file/upload', uploadFile.single('file'), (req, res, next) => {
    console.log(' Inside of file upload ');
    var finalError = new Error("File upload failed ");
    finalError.httpStatusCode = 400;
        if(!req.file) {
            finalError = new Error(" File upload failed. No file selected ");
            return next(error);
        }
        try {
            // add logic to create folder structure.. Send course number and version number.
            extractFile(req.file).then((data) => {
               return res.send(data); 
            }, (error) => {
                return next(error);
            }); 
        }catch(error) {
            return next(finalError);
        }    
        return res.send({});
});

app.listen(appPort, () => {
    console.log('running application ');
});
