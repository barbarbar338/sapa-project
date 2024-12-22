import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

import Chart from "chart.js/auto";
import RealtimePlugin from "chartjs-plugin-streaming";

import "chart.js/auto";
import "chartjs-adapter-moment";
import "chartjs-plugin-streaming";

import "./index.css";

Chart.register(RealtimePlugin);

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
