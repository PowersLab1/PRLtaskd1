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
    console.log('in compondentDidMount');
    //console.log(that.state.encryptedMetadata);//this was in the original code
    
    var that = this;
    window.addEventListener('message', function(event) {
      console.log('in EventListener');

      if (event.data.type === 'labjs.data') {
        const parsedData = JSON.parse(event.data.json);
        console.log('in componentDidMount -- type = labjs.data');
        // Print out debugging info if flag is set or we're on localhost
        if (config.debug || isLocalhost) {
          console.log(parsedData);
          console.log(that.processLabJsData(parsedData));
        }

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
        console.log('in componentDidMount -- after if statements');
        console.log(that.state.encryptedMetadata);
        console.log(parsedData);
        that.setState({sendingData: true});
        console.log('logging this')
        console.log(this); //added this for debugging
        console.log('logging that')
        console.log(that); //added this for debugging
        console.log('sending request')
        aws_saveTaskData(that.state.encryptedMetadata, that.packageDataForExport(parsedData)).then(
          () => {
            console.log('sent data')
            console.log(that.surveyUrl) //added for debugging
            if (that.surveyUrl) {
              that.setState({link: that.surveyUrl});
            } else {
              aws_fetchLink(that.state.encryptedMetadata).then(
                (link) => that.setState({link: link})
              ); //wise to add some additional handling here for when backend stuff goes down -- handling errors
            }
          }
        );
      }
      aws_fetchLink(that.state.encryptedMetadata).then(
        (link) => that.setState({link: link})
      );
    });
  
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
          <h2>Saving data... do not exit window</h2>
        </div>
      </div>
    );
  } // end render
} // end class

export default LabJsWrapper;
