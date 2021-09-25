//css
import '../css/reset.css';
import '../css/index.css';
import '../css/weather.css';
//js
import WeatherWidget from './weather';
import component from './component';

//font-awesome
import "@fortawesome/fontawesome-free/js/solid.js";
import "@fortawesome/fontawesome-free/css/all.css";

(function main() {
  const header = component.heading("Open Weather API Widget", 1, "page-title");
  const weather = new WeatherWidget("f6345d1dad5d9efead6cd5394a064987");

  document.body.append(header, weather.widget);
})();