const usersCollection = require('../db').db().collection("users")
const followsCollection = require('../db').db().collection("follows")
const ObjectID = require('mongodb').ObjectID
const User = require('./User')

let Follow = function(followedUsername, authorId) {
  this.followedUsername = followedUsername
  this.authorId = authorId
  this.errors = []
}

Follow.prototype.cleanUp = function() {
  if(typeof(this.followedUsername) != "string") {
    this.followedUsername = ""
  }
}

Follow.prototype.validate = async function(action) {
  // followedUsername must exist in database
  let followedAccount = await usersCollection.findOne({username: this.followedUsername})
  if (followedAccount) {
    this.followedId = followedAccount._id
  } else {
    this.errors.push("You cannot follow a user that does not exist.")
  }
  console.log('Follow.validate')
  console.log('calling: doesFollowAlreadyExist')
  console.log('followedId: ' + this.followedId)
  console.log('authorId: ' + this.authorId)

  let doesFollowAlreadeyExist = await followsCollection.findOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)})

  console.log('doesFollowAlreadeyExist = ' + doesFollowAlreadeyExist)

  if (action == "create") {
    if (doesFollowAlreadeyExist){
      this.errors.push("You are already following this user.")
    }
  }
  if (action == "delete") {
    if (!doesFollowAlreadeyExist){
      this.errors.push("You do not follow that user.")
    }
  }

  // should not be able to follow yourself
  if (this.followedId.equals(this.authorId)) {this.errors.push("You cannot follow yourself.")}
  
}


Follow.prototype.create = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    console.log('called Follow.create, this.clean up')
    await this.validate("create")
    console.log('called Follow.create, this.validate')

    console.log('Follow.create errors is a: ' + typeof(this.errors))
    console.log('errors = '+ this.errors)
    if (!this.errors.length) {
      await followsCollection.insertOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)})
      console.log('create, insert one')
      resolve()
    } else {
      reject(this.errors)
    }
  })
}

Follow.prototype.delete = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    await this.validate("delete")
    if (!this.errors.length) {
      await followsCollection.deleteOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)})
      resolve()
    } else {
      reject(this.errors)
    }
  })
}

Follow.isVisitorFollowing = async function (followedId, visitorId){
  let followDoc = await followsCollection.findOne({followedId: followedId, authorId: new ObjectID(visitorId)})
  if(followDoc){
    return true
  } else {
    return false
  }
}

Follow.getFollowersById = function(id) {
  return new Promise(async (resolve, reject) => {
    try{
      let followers = await followsCollection.aggregate([
        {$match: {followedId: id}},
        {$lookup: {from: "users", localField: "authorId", foreignField: "_id", as: "userDoc"}},
        {$project: {
          username: {$arrayElemAt: ["$userDoc.username", 0]},
          email: {$arrayElemAt: ["$userDoc.email", 0]}
        }}
      ]).toArray()
      followers = followers.map(function(follower){
        let user = new User(follower, true) //the true parameter tells the function to get the gravitar based on the user email
        return {username: follower.username, avatar: user.avatar}
      })
      resolve(followers) 
    } catch {
      reject()
    }
  })
}

Follow.getFollowingById = function(id) {
  return new Promise(async (resolve, reject) => {
    try{
      let followers = await followsCollection.aggregate([
        {$match: {authorId: id}},
        {$lookup: {from: "users", localField: "followedId", foreignField: "_id", as: "userDoc"}},
        {$project: {
          username: {$arrayElemAt: ["$userDoc.username", 0]},
          email: {$arrayElemAt: ["$userDoc.email", 0]}
        }}
      ]).toArray()
      followers = followers.map(function(follower){
        let user = new User(follower, true) //the true parameter tells the function to get the gravitar based on the user email
        return {username: follower.username, avatar: user.avatar}
      })
      resolve(followers) 
    } catch {
      reject()
    }
  })
}

Follow.countFollowersById = function(id) {
  return new Promise(async (resolve, reject) => {
      let followerCount = await followsCollection.countDocuments({followedId: id})
      resolve(followerCount)
  })
}

Follow.countFollowingById = function(id) {
  return new Promise(async (resolve, reject) => {
      let count = await followsCollection.countDocuments({authorId: id})
      resolve(count)
  })
}

module.exports = Follow