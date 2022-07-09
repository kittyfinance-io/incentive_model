import * as React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import App from "./App";
import theme from "config/theme";
import { store } from "store";
import { Web3Provider } from "state/web3";

ReactDOM.render(
  <Provider store={store}>
    <Web3Provider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </Web3Provider>
  </Provider>,
  document.querySelector("#root")
);
