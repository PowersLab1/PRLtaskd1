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
        this.addScript(process.env.PUBLIC_URL + '/script.js');
      });
    }
  }

  packageDataForExport(labJsData) {
    const exportData = {};
    exportData.encrypted_metadata = this.state.encryptedMetadata;
    exportData.taskName = config.taskName;
    exportData.taskVersion = config.taskVersion;
    exportData.data = this.processLabJsData(labJsData);

    return JSON.stringify(exportData);
  }

  processLabJsData(labJsData) {
    return labJsData;
  }

  async sendDataWithRetry(data, retries = 5, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        await aws_saveTaskData(this.state.encryptedMetadata, this.packageDataForExport(data));
        console.log('Data sent successfully');
        if (this.surveyUrl) {
          this.setState({link: this.surveyUrl});
        } else {
          aws_fetchLink(this.state.encryptedMetadata).then(
            (link) => this.setState({link: link})
          );
        }
        return; // Exit if successful
      } catch (error) {
        console.log(`Attempt ${i + 1} failed: ${error}`);
        this.setState({sendingData: true}); // Update UI to show retrying message
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay)); // Wait before retrying
          delay *= 2; // Exponential backoff
        }
      }
    }
    console.error('All attempts to send data failed');
    this.setState({sendingData: 'error'}); // Update UI to show error message
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
        <div className="container fullscreen" data-labjs-section="main" style={{visibility: this.state.sendingData === false ? 'visible' : 'hidden'}}>
          <main className="content-vertical-center content-horizontal-center">
          </main>
        </div>
        <div className="center" style={{visibility: this.state.sendingData !== false ? 'visible' : 'hidden'}}>
          {this.state.sendingData === 'error' ? (
            <h2>There was an error saving your data. Please check your internet connection and then refresh the page -- you may need to repeat the game if internet connection was lost during the game.</h2>
          ) : (
            <h2>Saving data -- do not close the window.</h2>
          )}
        </div>
      </div>
    );
  } // end render
} // end class

export default LabJsWrapper;
