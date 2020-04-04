const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const unzip = require('unzip2');
const LRSController = require('./controllers/LRSController');


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
    }
  });

  /**
   * 
   * @param {string} path 
   * Delete the version folder if already existed and create same folder with new course content folder
   */
const deleteFolder = (path) => {

    if(fs.existsSync(path)) {
        fs.readdirSync(path).forEach((f, index) => {
            var currPath = path+ '/' + f;
            if(fs.lstatSync(currPath).isDirectory()) {
                deleteFolder(currPath);
            }else {
                fs.unlinkSync(currPath);
            }
        });
        fs.rmdirSync(path);
    }
    
};

var extractFile = (file, courseName, version) => {
    var filename = file.filename;
    const basePath = __dirname + '/resources/';
    var filePath;
    var versionPath;

    try{
        filename = filename.split('.').slice(0, -1).join('.');
        filePath = basePath + courseName+'/'+version + '/' + filename;
        versionPath = basePath + courseName+'/'+version;
        deleteFolder(versionPath);
        
    }catch(error) {
        return new Promise((resolve, reject) => {
            reject({message: ' file deletion is failed to update the content '});
        });
    }
    
    return new Promise((resolve, reject) => {
        fs.createReadStream(file.path).pipe(unzip.Extract({path: filePath}))
        .on('close', () => {
            const resourcePath = '/resources/'+ courseName + '/' + version + '/' + filename;
            fs.unlinkSync(__dirname + '/uploads/' + file.filename) ;
            resolve({msg: 'done', path: resourcePath});
        })
        .on('error', () => {
            reject({msg: error});
        });
    });
};


var octetStreamParser =  bodyParser.raw({
    inflate: true,
    limit: '5gb',
    type: 'application/octet-stream',
    verify: function(req, res, buf, encoding) {
      req.rawBody = buf.toString(encoding || 'utf-8');
      console.log('Inside of octetStream ');
  }
  });

app.get('/',function(req,res){
    res.sendFile(__dirname + "/public/index.html");
});


// register endpoints quickly to test

app.get('/lrs/api/test/connection', (req, res) => {
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

    var finalError = new Error("File upload failed ");
    finalError.httpStatusCode = 400;
	
        if(!req.file || !req.query.courseid || !req.query.version) {
            finalError = new Error(" File upload failed. following are missing file, courseid, version ");
            return next(finalError);
        }
        try {
            // add logic to create folder structure.. Send course number and version number.
            extractFile(req.file, req.query.courseid, parseInt(req.query.version)).then((data) => {
               return res.send(data); 
            }, (error) => {
                return next(error);
            }); 
        }catch(error) {
            return next(finalError);
        }    
        //return res.send({});
});

/**
 *  State related end points
 */


app.put('/engine/lrs/activities/state', octetStreamParser, LRSController.addState);
app.get('/engine/lrs/activities/state',octetStreamParser, LRSController.getState);
app.get('/engine/lrs/statements', LRSController.getStatement);
app.put('/engine/lrs/statements',  LRSController.addStatement);

app.listen(appPort, () => {
    console.log('running application ');
});
