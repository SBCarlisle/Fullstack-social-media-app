import Search from './modules/search'
import Chat from './modules/chat'
import RegistrationForm from './modules/registrationForm'

console.log("main.js")

if (document.querySelector("#registration-form")) {
  new RegistrationForm()
  console.log("called new reg form")
}

if (document.querySelector("#chat-wrapper")) { // will only exist if user is logged in
  new Chat()
  console.log("new chat")
}

if (document.querySelector(".header-search-icon")) {
  new Search()
}
//only if the user is logged in thay will have a search icon present so we dont need to load the search JS if they don't