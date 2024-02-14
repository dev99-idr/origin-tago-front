var express = require('express');
var router = express.Router();
let kanban = require('../public/javascripts/tag-back-action');
let user = require('../public/javascripts/user-back-action');

var multer   = require('multer'); 


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/main.do', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/imglist', function(req, res, next) {
  kanban.kabanimglist(req,res);
});


//login
router.get('/user-login', function(req, res, next) {
  res.render('user-login', { title: 'Express' });
});
router.get('/user-forgot-password', function(req, res, next) {
  res.render('user-forgot-password', { title: 'Express' });
});
router.get('/user-register', function(req, res, next) {
  res.render('user-register', { title: 'Express' });
});
router.get('/user-profile', function(req, res, next) {
  res.render('user-profile', { title: 'Express' });
});
router.get('/accounts', function(req, res, next) {
  res.render('accounts', { title: 'Express' });
});
router.get('/license', function(req, res, next) {
  res.render('license', { title: 'Express' });
});
router.get('/system-information', function(req, res, next) {
  res.render('system-information', { title: 'Express' });
});


/* change locale. 
router.get('/en', function(req, res, next) {


  const data = {
    "title": "Express",
    "locale": "en"
  };
 
  res.cookie('lang','en');
  //res.redirect('back');
  return res.render('index',data);

  //res.render('index', { title: 'Express' });
});
router.get('/ko', function(req, res, next) {

  const data = {
    "title": "Express",
    "locale": "ko"
  };

  res.cookie('lang','ko');
  
  return res.render('index', data);
});
*/

//menu
router.get('/tag-publish', function(req, res, next) {
  res.render('tag-publish', { title: 'Express' });
});
router.get('/tag-register', function(req, res, next) {
  res.render('tag-register', { title: 'Express' });
});
router.get('/tag-editor', function(req, res, next) {
  res.render('tag-editor', { title: 'Express' });
});
router.get('/tag-layout-list', function(req, res, next) {
  res.render('tag-layout-list', { title: 'Express' });
});
router.get('/tag-monitoring', function(req, res, next) {
  res.render('tag-monitoring', { title: 'Express' });
});
router.get('/map-dashboard', function(req, res, next) {
  res.render('map-dashboard', { title: 'Express' });
});
router.get('/tag-dashboard', function(req, res, next) {
  res.render('tag-dashboard', { title: 'Express' });
});
router.get('/tag-history-data', function(req, res, next) {
  res.render('tag-history-data', { title: 'Express' });
});
router.get('/meessenger', function(req, res, next) {
  res.render('meessenger', { title: 'Express' });
});
router.get('/tag-location', function(req, res, next) {
  res.render('tag-location', { title: 'Express' });
});

/*
router.post("/seegene-kw", function(req, res, next) {
    kanban.sendkw(req.body,res);
});
router.get('/seegene', function(req, res, next) {
  res.render('seegene', { title: 'Express' });
});
*/

//image
router.post('/setImage', function(req, res, next) {
  user.setProfileImg(req.body,res);
});
router.post('/getImage', function(req, res, next){
  user.getProfileImg(req.body, res);
})


// license
router.post('/getLicense', function(req, res, next){
  user.licenseRegister(req.body, res);
})


//file upload
var storage  = multer.diskStorage({ // 2
  destination(req, file, cb) {
    cb(null, 'resource/assets/fonts/');
  },
  filename(req, file, cb) {
    cb(null, `${file.originalname}`);
  },
});
var upload = multer({ dest: 'resource/assets/fonts/' }); // 3-1
var uploadWithOriginalFilename = multer({ storage: storage }); // 3-2

router.post('/uploadFileWithOriginalFilename', uploadWithOriginalFilename.single('attachment'), function(req,res){ // 5
  console.log(req.file)
  res.end();

});



module.exports = router;
