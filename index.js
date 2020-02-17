const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bodyParser = require('body-parser');
/*const unzip = require('unzip2');
*/

const appPort = 3000;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// register endpoints quickly to test

app.get('/api/test/connection', (req, res) => {
    res.json({name: 'Karunakar Medamoni '});
});

app.listen(appPort, () => {
    console.log('running application ');
});