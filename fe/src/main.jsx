import { render } from "preact";
import { App } from "./app.jsx";

import Chart from "chart.js/auto";
import RealtimePlugin from "chartjs-plugin-streaming";

import "chart.js/auto";
import "chartjs-adapter-moment";
import "chartjs-plugin-streaming";

import "./index.css";

Chart.register(RealtimePlugin);

render(<App />, document.getElementById("app"));
