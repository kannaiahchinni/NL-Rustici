const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
const fs = require('fs');
//const unzip = require('unzip2');


const appPort = 3000;

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

  var getCourseDetailsFromXml = (jsonData) => {
    if ( jsonData.tincan && jsonData.tincan.activities && 
        jsonData.tincan.activities.length  &&
        jsonData.tincan.activities[0].activity[0] ) {

        const activity = jsonData.tincan.activities[0].activity[0];
        
        return  {
            name: activity.name[0]['_'],
            desc: activity.description[0]['_']
        };

    }
    return {
        
    };
};

var createCourse = (filename) => {
    return xmlToJson(filename+'/tincan.xml');
 };

 const xmlToJson = (filename) => {
    const parser = new xml2js.Parser({
      attrkey: "ATTR"
    });
    
    return new Promise((resolve, reject) => {
        fs.readFile(filename, "utf8", (error, data) => {
            parser.parseString(data, (err, result) => {
                if(err ===  null) {
                    resolve(result);
                } else {
                    reject(err);
                }
            });
        });
    });
  };

var extractFile = (file) => {
    var filename = file.filename;
    try{
        filename = filename.split('.').slice(0, -1).join('.');
    }catch(error) {
    }
    const dir = './resources/' + filename;

    return new Promise((resolve, reject) => {
        fs.createReadStream('./'+file.path).pipe(unzip.Extract({path: dir}))
        .on('close', () => {
            if(fs.existsSync(dir)) {
                createCourse(dir).then((result) => {
                    result.path = dir;
                    resolve(result);
                }, (error) => {
                    reject(error);
                });
            }
        });
    });
};


// register endpoints quickly to test

app.get('/api/test/connection', (req, res) => {
    res.json({name: 'Karunakar Medamoni '});
});

app.post('/lrs/api/file/upload', uploadFile.single('file'), (req, res, next) => {
    console.log(' Inside of file upload ');
    var finalError = new Error("File upload failed ");
    finalError.httpStatusCode = 400;
        if(!req.file) {
            finalError = new Error(" File upload failed. No file selected ");
            return next(error);
        }
        try {
            extractFile(req.file).then((data) => {
                var courseData = getCourseDetailsFromXml(data);
              
                  /*  'course_id': req.body.courseid,
                    'path': data.path,
                    'name': courseData.name,
                    'description': courseData.desc,

                    */
               // return res.send(data); 
            }, (error) => {
                return next(error);
            });
        }catch(error) {
            return next(finalError);
        }   
});

app.listen(appPort, () => {
    console.log('running application ');
});