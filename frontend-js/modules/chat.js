import DOMPurify from "dompurify"
import User from "../../models/User"

export default class Chat {
  constructor() {
    this.openedYet = false
    this.chatWrapper = document.querySelector("#chat-wrapper")
    this.openIcon = document.querySelector(".header-chat-icon")
    this.injectHTML()
    this.chatLog = document.querySelector("#chat")
    this.chatField = document.querySelector("#chatField")
    this.chatForm = document.querySelector("#chatForm")
    this.closeIcon = document.querySelector(".chat-title-bar-close")
    this.events()
  }

  // Events
  events() {
    this.chatForm.addEventListener("submit", (e) => {
      e.preventDefault()
      this.sendMessageToServer()
    })
    //we want the this keyword to point to the object, not the element that got clicked on so we use arrow functions for the event function
    this.openIcon.addEventListener( "click", () => this.showChat())
    this.closeIcon.addEventListener("click", () => this.hideChat())
    if(user.avatar) console.log('user.avatar')
  }

  // Methods
  sendMessageToServer() {
    //emits a message to the server
    this.socket.emit('chatMessageFromBrowser', {message: this.chatField.value})
    this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`
    <div class="chat-self">
    <div class="chat-message">
      <div class="chat-message-inner">
        ${this.chatField.value}
      </div>
    </div>
    <img class="chat-avatar avatar-tiny" src="${this.avatar ? this.avatar : 'https://www.clipartkey.com/mpngs/m/152-1520367_user-profile-default-image-png-clipart-png-download.png'}">
    </div>
    `))
    this.chatLog.scrollTop = this.chatLog.scrollHeight
    this.chatField.value = ""
    this.chatField.focus()
  }

  showChat() {
    if (!this.openedYet) {
      this.openConnection()
    }
    this.openedYet = true
    this.chatWrapper.classList.add("chat--visible")
    this.chatField.focus()
  }

  hideChat() {
    this.chatWrapper.classList.remove("chat--visible")
  }

  openConnection() {
    this.socket = io()
    this.socket.on('welcome', data => {
      this.username = data.username
      this.avatar = data.avatar
    })
    this.socket.on('chatMessageFromServer', (data) => {
      this.displayMessageFromServer(data)
    })
  }

  displayMessageFromServer(data) {
    this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`
    <div class="chat-other">
    <a href="/profile/${data.username}"><img class="avatar-tiny" src="${data.avatar ? data.avatar : 'https://www.clipartkey.com/mpngs/m/152-1520367_user-profile-default-image-png-clipart-png-download.png'}"></a>
    <div class="chat-message"><div class="chat-message-inner">
      <a href="/profile/${data.username}"><strong>${data.username}:</strong></a>
      ${data.message}
    </div></div>
  </div>`
    ))
  this.chatLog.scrollTop = this.chatLog.scrollHeight
  }

  injectHTML() {
    this.chatWrapper.innerHTML = `
    <div class="chat-title-bar">Chat <span class="chat-title-bar-close"><i class="fas fa-times-circle"></i></span></div>
    <div id="chat" class = "chat-log"></div>
    <form id="chatForm" class="chat-form border-top">
      <input type="text" class="chat-field" id="chatField" placeholder="Type a message???" autocomplete="off">
    </form>
    `
  }
}