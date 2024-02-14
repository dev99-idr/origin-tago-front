let express = require('express');
let router = express.Router();

let kanban = require('../public/javascripts/tag-back-action');   
/* GET home page. */
router.get('/', function(req, res, next) {
    res.send('kanban get');
});

router.post('/recentimage',function(req,res,next){
    kanban.kanbanrecentimage(req.body,res,next);
})
router.post('/', function(req, res, next) {
    kanban.kanbanpublish(req.body,res,next);  
    // res.send('kanban post');
});
router.post('/recentdata',function(req,res,next){
    kanban.kanbanrecentdata(req.body,res,next);
})
router.post('/gettagkey',function(req,res,next){
    kanban.gettagkey(req.body,res,next);
})
router.post('/saveBase64File',function(req,res,next){
    kanban.saveBase64File(req.body,res,next);
})
module.exports = router;
