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
  const img = component.img("https://openweathermap.org/themes/openweathermap/assets/img/logo_white_cropped.png", "ow-logo");
  const header = component.heading("API Widget Demo", 1, "page-title");
  const header2 = component.heading("by", 1, "author");
  const authorLink = Utility.createElement("a", "gh-link");
  authorLink.textContent = "Dan T.";
  authorLink.setAttribute("href", "")
  const weather = new WeatherWidget("f6345d1dad5d9efead6cd5394a064987");

  document.body.append(img, header, weather.widget);
})();