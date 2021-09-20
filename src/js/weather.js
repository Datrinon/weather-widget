import Utility from "./utility";
import component from "./component";

/**
 * A weather widget created using OpenWeather API. 
 */
export default class WeatherWidget {
  
  /**
   * The base path to access the OpenWeather API.
   */
  #apiBase;

  /**
   * Article element containing the weather widget. 
   */
  #widgetContainer;

  /**
   * Location of the user... data type?
   */
  #location;
  /**
   * Boolean indicating whether to swap to celsius or USA.
   * determined by location.
   */
  #celsiusMode;


  constructor(apiKey) {
    this.#widgetContainer = Utility.createElement("article", "weather-widget");
    this.#apiBase = `api.openweathermap.org/data/2.5/weather?appid=${apiKey}`;
    console.log(this.#apiBase);

    // logo code
    // const logo = component.div("logo");
    // logo.append(component.p("Powered by OpenWeather."));
    // this.#widgetContainer.append(logo);

    this.#initializeSearch();
    this.#initializeDisplayOptions();
  }

  #initializeSearch() {
    this.#widgetContainer.append(component.geosearch());
  }

  #initializeDisplayOptions() {
    const optionsContainer = Utility.createElement("div", "display-options");
    const dayViewPanel = Utility.createElement("div", "display-day-view");
    const today = component.button("Today", "display-today");
    const threeDay = component.button("3 Day", "display-3Day");
    const weekly = component.button("Weekly", "display-weekly");
    const metricPanel = component.div("metrics");
    const toggleFahrenheit = component.button("F°", "display-toggleF");
    const toggleCelsius = component.button("C°", "display-toggleC");

    dayViewPanel.append(today, threeDay, weekly);
    metricPanel.append(toggleFahrenheit, toggleCelsius);

    optionsContainer.append(dayViewPanel, metricPanel);

    this.#widgetContainer.append(optionsContainer);
  }



  get widget() {
    return this.#widgetContainer;
  }
}
