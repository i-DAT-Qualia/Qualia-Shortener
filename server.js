//load requirements
var http = require("http");
var mongoose = require('mongoose');
var randomstring = require("randomstring");
var nopt = require("nopt");

//get settings

var knownOpts = {
    "mongoPath": String, //the URL path to Mongo
    "rootURL": String, //the root url, to which the short links are appened when returned
    "external": Number, //redirection port, which should be behind a proxy
    "internal": Number, //internal port for accepting new links, which should only be accessible from inside network
};

var shortHands = {
    "m":["--mongoPath"],
    "r":["--rootURL"],
    "e":["--external"],
    "i":["--internal"]
};

var parsedArgs = nopt(knownOpts,shortHands,process.argv,2)

//connect to MongoDB
mongoose.connect(parsedArgs.mongoPath);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
  console.log('connected!')
});

//set up Link data schema
var linkSchema = mongoose.Schema({
    short: String,
    long: String
});

//add function for generating the short link
linkSchema.methods.shorten = function () {
  this.short = "/"+randomstring.generate(7)+"/";
}

//add function stringifying data return
linkSchema.methods.to_json_string = function () {
  return(JSON.stringify({
      "short": this.short,
      "long": this.long,
      "short_url": parsedArgs.rootURL + this.short
  }))
}

//load the schema
var Link = mongoose.model('Link', linkSchema);

//external server to perform redirects
http.createServer(function(request, response) {

  //find the short url from the request
  Link.find({ short: request.url }, function(err,data) {
    if (err) return console.error(err);

    if (data.length > 0) {
      //redirect if we find something
      response.writeHead(301, {Location: data[0]['long']});
      response.end();
    } else{
      //404 if we don't
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("No Redirect Found");
      response.end();
    }

  });

}).listen(parsedArgs.external);

//internal server to accept new links
http.createServer(function(request, response) {
  //only respond to posts
  if (request.method == 'POST') {
        var body = '';

        //load body data
        request.on('data', function (data) {
            body += data;

            // Too much POST data, kill the connection!
            if (body.length > 1e6)
                request.connection.destroy();
        });

        request.on('end', function () {
            //parse posted data and save link
            data = JSON.parse(body)

            var newlink = new Link (data);
            newlink.shorten();
            newlink.save();

            //return response with shortened URL
            response.writeHead(201, {"Content-Type": "text/JSON"});
            response.write(newlink.to_json_string());
            response.end();

        });
  }else{
    response.writeHead(403, {"Content-Type": "text/plain"});
    response.write("Only POST requests accepted");
    response.end();
  }


}).listen(parsedArgs.internal);
