import React, {Component} from 'react';
import {aws_saveTaskData, aws_fetchLink} from "../lib/aws_lambda";
import {isLocalhost} from "../lib/utils";

import '../lib/external/lab.css';
import './LabJsWrapper.css';

const config = require('../config');
var _ = require('lodash');
var qs = require('query-string');

// Import questlib
require('questlib');

class LabJsWrapper extends Component {
  constructor(props) {
    console.log('LabJsWrapperconstructor');
    super(props);

    // Parse get params for encrypted metadata
    const params = qs.parse(
      this.props.location.search,
      {ignoreQueryPrefix: true}
    );

    this.surveyUrl = params.survey_url;

    // Set init state
    this.state = {
      encryptedMetadata: params.id,
      sendingData: false,
      link: undefined,
    };

    if (!_.isUndefined(this.state.encryptedMetadata)) {
      this.addScript(process.env.PUBLIC_URL + '/external/lab.js', () => {
        // If we add this script tag before lab.js loads, then the
        // script will not be able to find the lab module.
        this.addScript(process.env.PUBLIC_URL + '/script.js');//original wrapper uses  '/script.js' -- tried w/index.html containing whole script but didn't work
      });
    }
  }

  // labJsData should be parsed
  packageDataForExport(labJsData) {
    const exportData = {};
    console.log('packageDataForExport');
    console.log(labJsData);

    exportData.encrypted_metadata = this.state.encryptedMetadata;
    exportData.taskName = config.taskName;
    exportData.taskVersion = config.taskVersion;
    exportData.data = this.processLabJsData(labJsData);

    return JSON.stringify(exportData);
  }

  processLabJsData(labJsData) {
    return labJsData;
  }
    //const processedData = []; //THIS IS SUPPOSED TO BE MODIFIED TO MAKE SURE THAT IT CONTAINS ALL THE DATA WE NEED BUT LATER LINE labJsData[0] suggests only 1st object returned!
 //here are the arrays that I would tell it to make sure it's keeping
   
    
      // Always keep entry 0 of labjs data since it contains useful metadata
   // processedData.push(labJsData[0]);

    // Do other processing here
    // processedData.push(...);

   // processedData.push()

   // return processedData;
  //}

  componentDidMount() {
    
    console.log('This is the latest labjswrapper.js')
    var that = this;

    const taskData = sessionStorage.getItem('taskData');
    if (taskData) {
      console.log('taskData found in sessionStorage');
      const parsedData = JSON.parse(taskData);
      // If localhost, we're done at this point
      if (isLocalhost) {
        console.log('in islocalhost');
        console.log(that.surveyUrl);
        if (that.surveyUrl) {
          console.log('in that.surveyUrl');
          that.setState({link: that.surveyUrl});
        }
        return;
      }
      that.setState({sendingData: true});
      console.log('Im tryna call aws cuz i have session storage stuff');
      that.setState({sendingData: true});
      that.saveTaskDataWithRetry(parsedData, 11); // second number = how many attempts to make before giving up +1
    }

    window.addEventListener('message', function(event) {
      if (event.data.type === 'labjs.data') {
        const parsedData = JSON.parse(event.data.json);

        if (isLocalhost) {
          if (that.surveyUrl) {
            console.log('in that.surveyUrl');
            that.setState({link: that.surveyUrl});
          }
          return;
        }
        
        that.setState({sendingData: true});
        that.saveTaskDataWithRetry(parsedData, 11); // second number = how many attempts to make before giving up +1
      }
    });
  }

  saveTaskDataWithRetry(parsedData, attempts) {
    const that = this;
    console.log('new saveTaskData called')
    aws_saveTaskData(that.state.encryptedMetadata, that.packageDataForExport(parsedData)).then(() => {
      // Success path
      that.handleDataSaveSuccess();
    }).catch((error) => {
      if (attempts > 1) {
        setTimeout(() => {
          console.log("Retrying to save task data...");
          that.saveTaskDataWithRetry(parsedData, attempts - 1);
        }, 2000); // Retry after 1 second delay
      } else {
        // Handle failure after retries
        console.error("Failed to save task data after retries:", error);
        // Consider alerting the user or other recovery options here
      }
    });
  }

  handleDataSaveSuccess() {
    // Existing logic for handling successful data save...
    if (this.surveyUrl) {
      this.setState({link: this.surveyUrl});
    } else {
      aws_fetchLink(this.state.encryptedMetadata).then(
        (link) => this.setState({link: link})
      );
    }
  }


  addScript(src, callback) {
    const script = document.createElement("script");
    script.src = src;
    script.type = "module";
    script.onreadystatechange = callback;
    script.onload = callback;

    document.head.appendChild(script);
  }

  render() {
    if (_.isUndefined(this.state.encryptedMetadata)) {
      return (
        <div>
          <h2>Something went wrong. Please try again.</h2>
        </div>
      );
    } else if (!_.isUndefined(this.state.link)) {
      window.location.assign(this.state.link);
    }

    return (
      <div>
        <div className="container fullscreen" data-labjs-section="main" style={{visibility: this.state.sendingData ? 'hidden' : 'visible'}}>
          <main className="content-vertical-center content-horizontal-center">
            {/* <div>
              <h2>Loading Experiment</h2>
              <p>The experiment is loading and should start in a few seconds</p>
            </div> */}
          </main>
        </div>
        <div className="center" style={{visibility: this.state.sendingData ? 'visible' : 'hidden'}}>
          <h2>Saving data... do not exit window. Check internet and Refresh if stuck here for over 30 seconds.</h2>
          <p>If you lost internet connection during the game, then the game will restart and you will need to play again.</p>
        </div>
      </div>
    );
  } // end render
} // end class

export default LabJsWrapper;
