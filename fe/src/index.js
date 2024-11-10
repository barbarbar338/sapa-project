import Chart from "chart.js/auto";
import RealtimePlugin from "chartjs-plugin-streaming";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import "chart.js/auto";
import "chartjs-adapter-moment";
import "chartjs-plugin-streaming";
import "./index.css";

Chart.register(RealtimePlugin);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);

reportWebVitals();
