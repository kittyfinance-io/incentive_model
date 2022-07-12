import { createTheme, responsiveFontSizes } from "@mui/material/styles";

let theme = createTheme({
  palette: {
    // mode: "dark",
    // text: {
    //   primary: "#ffffff",
    // },
    mode: "light",
    text: {
      primary: "#000000",
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          background: "transparent",
          backdropFilter: "blur(20px)",
          border: "1px solid",
          padding: "10px",
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontSize: "15px",
        },
      },
    },
  },
});

theme = responsiveFontSizes(theme);

export default theme;
