import Utility from "./utility";
import component from "./component";

/**
 * A weather widget created using OpenWeather API. 
 */
export default class WeatherWidget {
  
  /**
   * The base path to access the OpenWeather API and obtain coordinates.
   */
  #locationApiBase;
  /**
   * The base path to access the OpenWeather API and obtain temperatures.
   */
  #weatherApiBase;
  /**
   * Article element containing the weather widget. 
   */
  #widgetContainer;
  /**
   * Boolean indicating whether to swap to celsius or USA.
   * determined by location.
   */
  celsiusMode;
  /**
   * Location of the user, stored as a component of a query string. 
   * @type {string}
   */
  location;
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
  * A reference to the data view containing the info collected from the api response 
  * inside of the widget.
  */
  #dataView;

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
    this.#dataView = Utility.createElement("div", "data-view");
    this.#locationApiBase = `https://api.openweathermap.org/data/2.5/weather?appid=${apiKey}`;
    this.#weatherApiBase = `https://api.openweathermap.org/data/2.5/onecall?appid=${apiKey}`;

    // debug
    console.log(this.#locationApiBase);

    if (defaultLocation === null) {
      this.location = "&q=San Francisco,US-CA";
    } else {
      this.location = `&q=${defaultLocation.city}`
          + `,${defaultLocation.stateCode},${defaultLocation.countryCode}`;
    }

    this.celsiusMode = celsiusMode;

    this.#initSearch();
    this.#initOptionsDisplay(viewMode);
    this.#widgetContainer.append(this.#dataView);
    this.#selectDataDisplay();
    this.#initFooter();
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

    dayViewPanel.children[viewMode].classList.add("selected");

    this.#widgetContainer.append(optionsContainer);
  }

  /**
   * Fetch data given a string of parameters. The API key and mode are already
   * provided for. At most, you just have to provide a location and timespan.
   * @param {string[]} query 
   * @returns {{}} JSON data object containing API response.
   */
  async #fetchData(...query) {
    try {
      // 1. Location Code.
      let response = await fetch(this.#locationApiBase + this.location);
      let locationData = await response.json();
      let coords = `&lat=${locationData.coord.lat}&lon=${locationData.coord.lon}&`;
      let location = {
        "country" : locationData.sys.country,
        "city" : locationData.name
      };

      // 2. Weather Code.
      let units = this.celsiusMode ? "&units=metric&" : "&units=imperial&";
      let queryString = query.length !== 0 ? query.join("&") : "";

      let weatherResponse = await fetch(this.#weatherApiBase + coords + units + queryString);
      let weatherData = await weatherResponse.json();

      // 3. Return them together.
      return {weatherData, location};
    } catch (error) {
      // TODO display on the GUI that there was an error.
    }
  }

  /**
   * Selects a data display based on the button that was selected. To be called
   * each time a button is selected on the .display-day-view node.
   */
  #selectDataDisplay() {
    const dayViewButtons = this.#widgetContainer.querySelector(".display-day-view");
    const selected = dayViewButtons.querySelector(".selected");
    const selectedIndex = Array.from(dayViewButtons.children).indexOf(selected);

    Utility.removeAllChildren(this.#dataView);

    switch(selectedIndex) {
      case 0:
        this.#dataView.classList.add("today");
        this.#render1DayDataDisplay();
        break;
        case 1:
        // TODO replace this with renderNDayDataDisplay(), since these two will 
        // conceptually be the same.
        this.#dataView.classList.add("three-day");
        // this.#render3DayDataDisplay();
        break;
      case 2:
        this.#dataView.classList.add("weekly");
        // this.#renderWeeklyDataDisplay();
        break;
    }
  }

  /**
   * For displaying the current day's data.
   * This will create elements, and then populate them with data fetched from
   * OpenWeather.
   */
  #render1DayDataDisplay() {
    const city = component.p("City", "display-city");
    const country = component.p("Country", "display-town");
    const weatherIcon = component.img("", "weather-icon");
    const temperature = component.p("--", "current-temp", "temperature");
    this.#dataView.append(city, country, weatherIcon, temperature);

    const minMax = component.div("min-max-temp");
    const min = component.p("--", "min-temp", "temperature");
    const max = component.p("--", "max-temp", "temperature");
    minMax.append(min, max);
    this.#dataView.append(minMax);

    const condition = component.p("Condition here.", "weather-description");
    this.#dataView.append(condition);

    // fetch data, and then, fill out the rest of the code.
    this.#fetchData().then((data) => {
      console.log(data);

      city.textContent = data.location.city;
      country.textContent = data.location.country;
      weatherIcon.src = `http://openweathermap.org/img/wn/${data.weatherData.current.weather[0].icon}@2x.png`;
      temperature.textContent = Math.round(data.weatherData.current.temp);
      min.textContent = Math.round(data.weatherData.daily[0].temp.min);
      max.textContent = Math.round(data.weatherData.daily[0].temp.max);
      condition.textContent = Utility.toSentence(data.weatherData.daily[0].weather[0].description);
    });
  }

  /**
   * For displaying the weather of the next N days.
   * @param {n} - The number of days to fetch data for.
   */
  #renderNDaysDataDisplay() {

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
