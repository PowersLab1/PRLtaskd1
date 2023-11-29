import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { HashRouter as Router } from "react-router-dom";//LIKELY NEED TO REMOVE THIS
import { createBrowserHistory } from 'history';
export const history = createBrowserHistory();
console.log('render react');
ReactDOM.render(
    <Router history={history} basename={process.env.PUBLIC_URL}>
      <App />
    </Router>,
    document.getElementById("root")
);

////USE THIS IF CONCERNED ABOUT CONSOLE BASENAME AND HASHROUTER WARNINGS
////The script below can replace the script above and have the task safely run w/o any error messages, but it's unclear what the value of this would be. 
// import React from 'react';
// import ReactDOM from 'react-dom';
// import App from './App';
// import { HashRouter as Router } from "react-router-dom";

// ReactDOM.render(
//     <Router>
//         <App />
//     </Router>,
//     document.getElementById('root')
// );
