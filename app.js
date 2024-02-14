let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');



let logger = require('morgan');
let cors = require('cors')

let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
let kanbanRouter = require('./routes/kanban');

let bodyParser = require('body-parser');

global.config = require('./config/serverConfig');

global.cookieMaxAge = 24 * 60 * 60 * 1000;

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');



app.use(logger('dev'));
app.use(express.json({limit: 2000000}));
app.use(express.urlencoded({limit: 2000000, extended: false}));
app.use(cookieParser("@sadfsdf@@asdfads$$asdf"));

let i18n = require('./i18n');
app.use(i18n);

app.use(express.static(path.join(__dirname, '/')));
app.use(cors())

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/kanbanpublish', kanbanRouter);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



// catch 404 and forward tos error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});




module.exports = app;

