import React from 'react'
import './App.css'

const issuePreview = (issue) => (
  <li>{issue.id} - {issue.description}</li>
)

const issueList = (issues) => (
  <ul>
    {issues.map(issuePreview)}
  </ul>
)

const userIssueList = (user) => (
  <div>
    {user.email}
    {issueList(user.issues)}
  </div>
)

const orderByCreatedOn = (issue1, issue2) => {
  let date1 = new Date(issue1.createdOn)
  let date2 = new Date(issue2.createdOn)

  return Math.sign(date2.getTime() - date1.getTime())
}

const recentIssues = (allIssues) =>
  issueList(allIssues.sort(orderByCreatedOn).slice(0, 5))

const issueDetails = (issue) => (
  <div>
    {issue.id} - {issue.description}
    <button>{issue.status ? "Close" : "Open"}</button>
  </div>
)

const userPreview = (user) => (
  <option value={user.id}>{user.userName}</option>
)

const userList = (users, currentUserId, onChange) => (
  <select value={currentUserId} onChange={(evnt) => onChange(evnt.target.value)}>
    {users.map(userPreview)}
  </select>
)

class NewUserForm extends React.Component {

  state =
    { userName: ""
    , email   : ""
    }

  handleInput = (evnt) => {
    let newUser = {...this.state};

    newUser[evnt.target.name] = evnt.target.value;

    this.setState(newUser)
  }

  handleSubmit = (evnt) => {
    evnt.preventDefault();

    this.props.addNewUser(this.state)
    this.setState({ userName: "", email: ""})
  }

  render = () => (
    <form onSubmit={this.handleSubmit}>
      <input type="text"   name="userName" onChange={this.handleInput} value={this.state.userName} placeholder="User Name"/>
      <input type="email"  name="email"    onChange={this.handleInput} value={this.state.email}    placeholder="Email"/>
      <input type="submit"                 value="New User" />
    </form>
  )
}

class NewIssueForm extends React.Component {
  state = {
    description: ""
  }

  handleInput = (evnt) => {
    this.setState({description: evnt.target.value})
  }

  handleSubmit = (evnt) => {
    evnt.preventDefault();

    this.props.addNewIssue(this.state.description)
    this.setState({ description: "" })
  }

  render = () => (
    <form onSubmit={this.handleSubmit}>
      <input type="text"   name="description" onChange={this.handleInput} value={this.state.description} placeholder="Description" />
      <input type="submit"                    value="New Issue" />
    </form>
  )
}

const testUsers =
  { 1:
    { id : 1
    , email  : "foo@foo.com"
    , userName: "Bob"
    , issues :
        [ {description: "a test issue 2", status: true, id: 2, createdOn: "2019-09-28T15:05:18.180058Z"}
        , {description: "a test issue"  , status: true, id: 1, createdOn: "2019-09-27T15:05:18.180058Z"}
        , {description: "a test issue 3", status: true, id: 3, createdOn: "2019-09-29T15:05:18.180058Z"}
        ]
    }
  , 7:
    { id : 7
    , email  : "bar@bar.com"
    , userName: "Joe"
    , issues :
        [ {description: "a joes test issue 2", status: true, id: 2, createdOn: "2019-09-28T15:05:18.180058Z"}
        , {description: "a joes test issue"  , status: true, id: 1, createdOn: "2019-09-27T15:05:18.180058Z"}
        , {description: "a joes test issue 3", status: true, id: 3, createdOn: "2019-09-29T15:05:18.180058Z"}
        ]
    }
  }

const getUsersFromServer = () =>
  fetch('/api/users/')
    .then(res => res.json())

const getIssuesFromServer = () =>
  fetch('/api/issues/')
    .then(res => res.json())

const getUsersAndIssuesFromServer = () =>
  getUsersFromServer().then(users =>
  getIssuesFromServer().then(issues =>
      objectFromListById(users, issues)
  ))

const objectFromListById = (users) =>
  users.reduce((obj, user) => {
    user.issues = [];
    obj[user.id] = user;
    return obj;
  }, {})

const saveUserToServer = (newUser) =>
  fetch('/api/users/',
    { method  : "POST"
    , headers : { "Content-Type": "application/json" }
    , body    : JSON.stringify(newUser)
    }
  ).then(res => res.json())

class App extends React.Component {

  state = {
    currentUser: 1,
    users: testUsers
  }

  componentDidMount = () => {
    getUsersAndIssuesFromServer()
     .then(users => {
       this.setState({ users })
     })
  }

  getNextId = () =>
    //gets the max id from the isssues of the current user
    Math.max(...this.getCurrentUser().issues.map(issue => issue.id)) + 1

  addNewIssueCurrentUser = (description) => {
    const newIssue =
      { description
      , status: true
      , id: this.getNextId()
      , createdOn: new Date().toISOString()
      }

    let users = {...this.state.users};

    users[this.state.currentUser].issues.push(newIssue);

    this.setState({ users });
  }

  getNextUserId = () =>
    Math.max(...this.getAllUsers().map(user => user.id)) + 1

  addNewUser = (newUserInfo) => {
    saveUserToServer(newUserInfo)
      .then(newUser => {
        console.log(newUser);
        newUser.issues = [];

        let users = {...this.state.users};

        users[newUser.id] = newUser;

        this.setState({ users, currentUser: newUser.id });
      })
  }

  getCurrentUser = () =>
    this.state.users[this.state.currentUser]

  getAllUsers = () =>
    Object.values(this.state.users)

  getAllIssues = () =>
    this.getAllUsers().flatMap(user => user.issues)
    //this.getAllUsers().map(user => user.issues).flat()

  setCurrentUser = (currentUser) => {
    this.setState({ currentUser })
  }

  render = () => (
    <div className="container">
      <aside className="sidebar">
        <NewUserForm addNewUser={this.addNewUser}/>
        <NewIssueForm addNewIssue={this.addNewIssueCurrentUser} />
        {recentIssues(this.getAllIssues())}
      </aside>

      <article className="mainContent">
        {userList(this.getAllUsers(), this.state.currentUser, this.setCurrentUser)}
        {userIssueList(this.getCurrentUser())}
      </article>
    </div>
  )
}

export default App;
