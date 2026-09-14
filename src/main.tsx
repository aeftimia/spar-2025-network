import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider, createTheme } from "@mantine/core";
import "@mantine/core/styles.css";
import "leaflet/dist/leaflet.css";
import "./styles.css";
import App from "./App";
const theme = createTheme({
  primaryColor: "teal",
  defaultRadius: "md",
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  headings: { fontFamily: "inherit" },
  components: {
    Button: { defaultProps: { fw: 600 } },
    Tooltip: {
      defaultProps: { events: { hover: true, focus: true, touch: true } },
    },
  },
});
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>
  </React.StrictMode>,
);
