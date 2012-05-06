
/**
 * Module dependencies.
 */

var express = require('express')
	, fs = require('fs')
  	, mongoose = require('mongoose')
    , hat = require('hat')
    , im = require('imagemagick')
	, knox = require('knox');
	
//var client = new transloadit('a1b243cb213b4b538c771ffa927950e0', '6ca6e424ebba1d9ee5812a3d5bace3e4a89683d0');
	
var params = {
    template_id: 'ce0159e0b8cb4959966e72f3342e5c54'
};

var client = knox.createClient({
    key: ''
  , secret: ''
  , bucket: ''
});

var app = module.exports = express.createServer()
  , format = require('util').format

app.configure('development', function(){
 	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	mongoose.connect('mongodb://localhost/blog');
});

app.configure('production', function(){
 	app.use(express.errorHandler());
	mongoose.connect(process.env.MONGOHQ_URL);
});

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var BlogPost = new Schema({
  file      : String
});

mongoose.model('Blog', BlogPost)
var Blog = mongoose.model('Blog')

app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.bodyParser());
});

app.get('/', function(req, res){
    Blog.find( function(error,data){
        res.json(data)
    });
});

app.get('/inbox', function(req, res){
  res.render('inbox.ejs');
});

app.post('/inbox', function(req, res){	
	var file = new Buffer(req.body.my_file, "base64")
	var file_name = hat();
	var file_name_small = file_name + '-small';
	var file_location = "/tmp/" + file_name;	
	var file_location_small = file_location + '-small';
	fs.writeFile(file_location, file, function(err) {
		client.putFile(file_location, file_name, function(err, res) {});		
		im.resize({
		  srcPath: file_location,
		  dstPath: file_location_small,
		  width:   320
		}, function(err, stdout, stderr){
		  if (err) throw err
			client.putFile(file_location_small, "thumbnails/" + file_name_small, function(err, res) {
			new Blog({
				file: res.connection._httpMessage.url,
				}).save();
			})
		});	
	});	
	res.send('ok')
});

var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
