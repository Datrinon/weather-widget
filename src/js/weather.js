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
  celsiusMode;

  /**
   * Default location to pick to display temperatures.
   */
  #defaultLocation;
  
  /**
   * Current time; alters the color of the widget. 
   * Night - Dark Blue / Black.
   * Sunrise / Sunset (within 1hr timespan) - Orange.
   * Day - Blue.
   */
  #currentTime;
  /**
   * Current conidition; alters additional decal for widget.
   * Clear - Sun (Day) / Moon (Night)
   * Cloudy / Snowy / Rainy / Hazy - Gray overlay.
   */
  #currentCondition;

  /**
   * Create a weather widget.
   * @param {*} apiKey - API Key from Open Weather.
   * @param {boolean} celsiusMode - Display temps in celsius by default?
   * @param {viewMode} viewMode - Which view mode to use by default? 0 for daily,
   * 1 for a 3 day view, and 2 for a weekly view.
   * @param {{
   *  {string} city,
   *  {string} stateCode,
   *  {string} countryCode
   * }} defaultLocation - Default location to utilize. Codes align to ISO-3166
   */
  constructor(apiKey, celsiusMode = false, viewMode = 0, defaultLocation = null) {
    this.#widgetContainer = Utility.createElement("article", "weather-widget");
    this.#apiBase = `https://api.openweathermap.org/data/2.5/weather?appid=${apiKey}`;
    console.log(this.#apiBase);

    if (defaultLocation === null) {
      this.#defaultLocation = "&q=San Francisco,US-CA";
    } else {
      this.#defaultLocation = `&q=${defaultLocation.city}`
          + `,${defaultLocation.stateCode},${defaultLocation.countryCode}`;
    }

    this.celsiusMode = celsiusMode;

    this.#initSearch();
    this.#initOptionsDisplay(viewMode);
    this.#initDataDisplay();
    this.#initFooter();
    this.#fetchData(defaultLocation);
  }

  #initSearch() {
    this.#widgetContainer.append(component.geosearch());
  }

  #initReloadButton() {
    const reloadButton = component.button("", "reload");
    const reloadIcon = component.faIcon("fas", "fa-redo-alt");

    reloadButton.append(reloadIcon);

    return reloadButton;
  }

  #initOptionsDisplay(viewMode) {
    const optionsContainer = Utility.createElement("div", "display-options");
    const dayViewPanel = Utility.createElement("div", "display-day-view");
    const today = component.button("Today", "options-today");
    const threeDay = component.button("3 Day", "options-3Day");
    const weekly = component.button("Week", "options-weekly");
    const metricPanel = component.div("metrics");
    const toggleFahrenheit = component.button("°F", "options-toggleF");
    const toggleCelsius = component.button("°C", "options-toggleC");

    dayViewPanel.append(today, threeDay, weekly);
    metricPanel.append(toggleFahrenheit, toggleCelsius);
    optionsContainer.append(dayViewPanel, metricPanel);

    dayViewPanel.children[0].classList.add("selected");

    this.#widgetContainer.append(optionsContainer);
  }

  /**
   * Fetch data given a location as a ZIP code, city, or city, state format.
   * @param {string} location 
   */
  async #fetchData(location) {
    const response = await fetch(this.#apiBase + this.#defaultLocation);
    const data = await response.json();
    console.log(data);
  }

  #initDataDisplay() {
    const dataView = component.div("data-section");

    const city = component.p("City", "display-city");
    const country = component.p("Country", "display-town");
    const temperature = component.p("--", "current-temp", "temperature");
    dataView.append(city, country, temperature);

    const minMax = component.div("min-max-temp");
    const min = component.p("--", "min-temp", "temperature");
    const max = component.p("--", "max-temp", "temperature");
    minMax.append(min, max);
    dataView.append(minMax);

    const condition = component.p("Condition here.", "weather-description");
    dataView.append(condition);
    

    this.#widgetContainer.append(dataView);
  }

  #initFooter() {
    const footer = Utility.createElement("footer", "widget-footer");
    const logo = component.div("logo");
    logo.append(component.p("Powered by OpenWeather."));
    this.#widgetContainer.append(logo);    

    footer.append(logo, this.#initReloadButton());

    this.#widgetContainer.append(footer);
  }

  get widget() {
    return this.#widgetContainer;
  }
}
