const dotenv = require('dotenv')
dotenv.config()
const mongodb = require('mongodb')

//calling mongodb.connect creates a connection to that database
//calling the db() function on the client parameter returns the catual database objects that we can then work with
mongodb.connect(process.env.CONNECTIONSTRING, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client){
    //exporting the client will allow us to import this database into another file where we want to access the database
    module.exports = client
    const app = require('./app')
    app.listen(process.env.PORT)
})

//we set up this file as the starting point of our node application
//meaning this file will run first and establish a connection to the database before anything else happens in our app