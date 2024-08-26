import React from "react";
import { Route, Switch } from "react-router-dom";

import LabJsWrapper from "./containers/LabJsWrapper";


export default () =>
  <Switch>
    <Route path="/" exact component={LabJsWrapper} />

        { /* Finally, catch all unmatched routes */ }
        {/*  <Route component={NotFound} /> */}
  </Switch>;
