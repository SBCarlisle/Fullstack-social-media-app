const bcrypt = require('bcryptjs')

//this is how we access our collection
//first import the db from our db.js file, then look inside it for the users collection
const usersCollection = require('../db').db().collection("users")

const validator = require("validator")
const md5 = require('md5')

let User = function (data, getAvatar) {
    this.data = data
    this.errors = []
    if(getAvatar == undefined){
        getAvatar = false
    } else if (getAvatar){
        this.getAvatar()
    }
}

User.prototype.cleanUp = function () {
    if (typeof (this.data.username) != "string") {
        this.data.username = ""
    }
    if (typeof (this.data.email) != "string") {
        this.data.email = ""
    }
    if (typeof (this.data.password) != "string") {
        this.data.password = ""
    }

    //get rid of any bogus proporties
    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password,
    }
    //capitolize the first letter in the user name
    //this.data.username = this.data.username.replace(/^\w/, c => c.toUpperCase())

}

User.prototype.validate = function(){
    return new Promise(async (resolve, reject) => { //why is there an async promise executor function?
        
            if (this.data.username == "") {
                this.errors.push("You must provide a username.")
            }
            if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {
                this.errors.push("Username can only contain letters and numbers")
            }
            if (!validator.isEmail(this.data.email)) {
                this.errors.push("You must provide a valid email.")
            }
            if (this.data.password == "") {
                this.errors.push("You must provide a password.")
            }
            if (this.data.password.length > 0 && this.data.password.length < 8) {
                this.errors.push("Your password must be at least 8 characters.")
            }
            if (this.data.password.length > 50) {
                this.errors.push("Password must not be greater than 50 characters")
            }
            if (this.data.email.length > 0 && this.data.email.length < 8) {
                this.errors.push("Your email must be at least 8 characters.")
            }
            if (this.data.email.length > 100) {
                this.errors.push("Email must not be greater than 100 characters")
            }
            if (this.data.username.length > 0 && this.data.username.length < 3) {
                this.errors.push("Your username must be at least 3 characters.")
            }
            if (this.data.username.length > 30) {
                this.errors.push("Username must not be greater than 30 characters")
            }
            // Only if username is valid, check to see if it is already taken
            if(this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)){
                let usernameExists = await usersCollection.findOne({
                    username: this.data.username
                })
                if (usernameExists){
                    this.errors.push("That username is already taken.")
                }
            }
        
                // Only if email is valid, check to see if it is already taken
                if(validator.isEmail(this.data.email)){
                    let emailExists = await usersCollection.findOne({
                        email: this.data.email
                    })
                    if (emailExists){
                        this.errors.push("That email is already taken.")
                    }
                    resolve()
                } else{
                    reject('not a valid email')
                }
         

        
    })
}

User.prototype.login = function () {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        usersCollection.findOne({
            username: this.data.username}).then((attemptedUser)=>{
                if (attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
                    /*
                        Because a function is calling our anonymous function and not an object we need to be careful with the 'this' keyword.
                        If we use a standard function JS considers our function to be called by the global object.
                        To fix this problem we use an arrow function which does not change the scope of the 'this' keyword.
                        That means that 'this' will point to what it pointed to outside of the function, which would be the object 'user'
                    */
                   this.data = attemptedUser//this brings in the user email to use to grab our gravatar
                   this.getAvatar()
                    resolve('congrats, login accepted!')
                } else {
                    reject('invalid user/pass.')
                }
            }).catch(function(){
                reject("please try again later.")
            })
    })
}

User.prototype.register = function(){
    return new Promise(async (resolve, reject) => {
        // validate user input
        this.cleanUp()
        await this.validate().catch(err => console.log(err)) 
        // catch block could be more useful
        // 'this' refers to the object that is executing the current function, the current function being executed is register, and what is calling it is the object 'user' that we created in our userController file
        // step 1 validate user data
        // step 2 only if there are no validation errors, then save user data into database
        if (!this.errors.length) {
            // hash user password
            let salt = bcrypt.genSaltSync(10)
            this.data.password = bcrypt.hashSync(this.data.password, salt)
            //mongodb methods return a promise so we can await its resolve before we resolve our promise
            await usersCollection.insertOne(this.data)
            this.getAvatar()
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

User.prototype.getAvatar = function() {
    this.avatar = `https:gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

User.findByUsername = function(username){
    return new Promise(function(resolve, reject){
        if (typeof(username) != "string") {
            reject()
            return
        }
        usersCollection.findOne({username: username}).then(function(userDoc){
            if(userDoc){
                userDoc = new User(userDoc, true)
                userDoc = {
                    _id: userDoc.data._id,
                    username: userDoc.data.username,
                    avatar: userDoc.avatar
                }
                resolve(userDoc)
            } else {
                reject()
            }
        }).catch(function(){
            reject()
        })
    })
}

User.doesEmailExist = function(email) {
    return new Promise( async function(resolve, reject) {
        if ( typeof(email) != "string" ){
            resolve(false)
            return 
        }

        let user = await usersCollection.findOne({email: email})
        if (user) {
            resolve(true)
        } else {
            resolve(false)
        }
    })
}

module.exports = User

