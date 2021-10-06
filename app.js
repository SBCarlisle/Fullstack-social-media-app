const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)//?
const flash = require('connect-flash')
const markdown = require('marked')
const sanitizeHTML = require('sanitize-html')
const csrf = require('csurf')

const app = express()

//tells express to add user submitted data onto our request object
app.use(express.urlencoded({extended: false}))
//tells our app to accept json data submissions
app.use(express.json())

app.use('/api', require('./router-api'))

let sessionOptions = session({
    secret: "JavaScript is cool",
    store: new MongoStore({client: require('./db')}), 
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true}
})

app.use(sessionOptions)
app.use(flash())

app.use(function(req, res, next){   //we are telling express to run this function for every request

    res.locals.filterUserHTML = function(content){
        return sanitizeHTML(markdown(content), {allowedTags: ['p', 'br', 'ul', 'ol', 'strong', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], allowedAttributes: {}})
    }

    // make all error and success flash messages available from all templates
    res.locals.errors = req.flash("errors")
    res.locals.success = req.flash("success")

    // make current user id available on the request object
    // add to new property req.visitorId
    if (req.session.user){
        req.visitorId = req.session.user._id
    } else {
        req.visitorId = 0
    }

    // make user session data available from within view templates
    // locals is an object that will be available within our ejs templates
    // we can add any data we want to be available
    res.locals.user = req.session.user
    next()
})

const router = require('./router')


//adds a middleware for serving static files to your express app
app.use(express.static('public'))

//this is the express views configuration option to organize and access html files
app.set('views', 'views')
//express templating engine selection
app.set('view engine', 'ejs')

app.use(csrf())

app.use(function(req, res, next){
    res.locals.csrfToken = req.csrfToken()
    next()
})

app.use('/', router)

app.use(function(err, req, res, next){
    if(err){
        if (err.code == "EBADCSRFTOKEN") {
            req.flash('errors', "Cross site request detected.")
            req.session.save( () => res.redirect('/'))
        } else {
            res.render("404")
        }
    }
})

const server = require('http').createServer(app)

const io = require('socket.io')(server)

io.use(function(socket, next){
    sessionOptions(socket.request, socket.request.res, next)
})

//the socket parameter represents the connection between server and browser
io.on('connection', function(socket){
    //chatMessageFromBrowser is our custom defined event type
    //the browser sent along a data object that this function recieves
    if(socket.request.session.user){
        let user = socket.request.session.user
        socket.on('chatMessageFromBrowser', function(data){
            socket.emit('welcome', {username: user.username, avatar: user.avatar})
            //to emit a message to all connected users
            //if we wanted to send a message back to the user that sent the message we would use socket.emit
            socket.broadcast.emit('chatMessageFromServer', {message: sanitizeHTML(data.message, {allowedTags: [], allowedAttributes: {}}), username: user.username, avatar: user.avatar})
        })
    }
})

//when running locally without a remote db we would include app.listen(3000) here
//we want our db file to run first to establish a connection to the db so instead we do
module.exports = server
//this still creates an express variable app but instead of telling it to start listening
//we export it to run it from somewhere else, namely from our db.js file