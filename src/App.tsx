import React from "react";
import { BrowserRouter } from "react-router-dom";
import Routes from "routes";
import Loading from "components/Loading";
// import { print_rois } from "reward";

function App() {
  // print_rois();

  return (
    <BrowserRouter>
      <Routes />

      {/* <Loading isLoading={isLoading} /> */}
    </BrowserRouter>
  );
}

export default App;
