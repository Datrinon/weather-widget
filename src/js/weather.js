import {format, addDays} from "date-fns";
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
  locationQuery;
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
  #dataDisplayContainer;

  /**
   * Data object fetched from the API. Only needs to be retrieved every time a new search occurs or every hour.
   */
  #apiData;

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
    this.#dataDisplayContainer = Utility.createElement("div", "data-view");
    this.#locationApiBase = `https://api.openweathermap.org/data/2.5/weather?appid=${apiKey}`;
    this.#weatherApiBase = `https://api.openweathermap.org/data/2.5/onecall?appid=${apiKey}`;

    // debug
    console.log(this.#locationApiBase);

    if (defaultLocation === null) {
      this.locationQuery = "&q=San Francisco,US-CA";
    } else {
      this.locationQuery = `&q=${defaultLocation.city}`
          + `,${defaultLocation.stateCode},${defaultLocation.countryCode}`;
    }

    this.celsiusMode = celsiusMode;

    this.#initSearch();
    this.#initOptionsDisplay(viewMode);
    this.#widgetContainer.append(this.#dataDisplayContainer);
    this.#fetchData().then((data) => {
      this.#apiData = data;
      this.#displayData();
    });
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
    dayViewPanel.querySelectorAll("*")
      .forEach(button => button.addEventListener("click", (e) => this.#toggleSelected.call(this, e)));


    metricPanel.append(toggleFahrenheit, toggleCelsius);
    optionsContainer.append(dayViewPanel, metricPanel);

    dayViewPanel.children[viewMode].classList.add("selected");
    dayViewPanel.children[viewMode].setAttribute("disabled", "true");

    this.#widgetContainer.append(optionsContainer);
  }

  #toggleSelected(e) {
    // remove selected class from the other.
    const parent = Utility.getMatchingParent(e.currentTarget, ".display-day-view");
    const currentSelected = parent.querySelector(".selected");
    currentSelected.classList.remove("selected");
    currentSelected.removeAttribute("disabled");
    // toggle selected class on the button
    e.currentTarget.classList.add("selected");
    e.currentTarget.setAttribute("disabled", "true");
    // run displayData method
    this.#displayData();
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
      let response = await fetch(this.#locationApiBase + this.locationQuery);
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
   * Shows a data display based on the button that was selected. To be called
   * each time a button is selected on the .display-day-view node.
   */
  #displayData() {
    const dayViewButtons = this.#widgetContainer.querySelector(".display-day-view");
    const selected = dayViewButtons.querySelector(".selected");
    const selectedIndex = Array.from(dayViewButtons.children).indexOf(selected);

    Utility.removeAllChildren(this.#dataDisplayContainer);

    switch(selectedIndex) {
      case 0:
        this.#dataDisplayContainer.classList.add("today");
        this.#render1DayDataDisplay();
        break;
        case 1:
        // TODO replace this with renderNDayDataDisplay(), since these two will 
        // conceptually be the same.
        this.#dataDisplayContainer.classList.add("three-day", "multiday");
        this.#renderNDaysDataDisplay(3);
        break;
      case 2:
        this.#dataDisplayContainer.classList.add("weekly", "multiday");
        this.#renderNDaysDataDisplay(7);
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
    this.#dataDisplayContainer.append(city, country, weatherIcon, temperature);

    const minMax = component.div("min-max-temp");
    const min = component.p("--", "min-temp", "temperature");
    const max = component.p("--", "max-temp", "temperature");
    minMax.append(min, max);
    this.#dataDisplayContainer.append(minMax);

    const condition = component.p("Condition here.", "weather-description");
    this.#dataDisplayContainer.append(condition);

    city.textContent = this.#apiData.location.city;
    country.textContent = this.#apiData.location.country;
    weatherIcon.src = `http://openweathermap.org/img/wn/${this.#apiData.weatherData.current.weather[0].icon}@2x.png`;
    temperature.textContent = Math.round(this.#apiData.weatherData.current.temp);
    min.textContent = Math.round(this.#apiData.weatherData.daily[0].temp.min);
    max.textContent = Math.round(this.#apiData.weatherData.daily[0].temp.max);
    condition.textContent = Utility.toSentence(this.#apiData.weatherData.daily[0].weather[0].description);
  }

  /**
   * For displaying the weather of the next N days.
   * @param {n} - The number of days to fetch data for.
   */
  #renderNDaysDataDisplay(n) {

    const today = new Date();

    for (let i = 0; i < n; i++) {
      const dayContainer = component.div("day");
      const dayLabel = component.p("", "day-of-week");
      const weatherIcon = component.img(null);
      const dayTemp = component.p("--", "day-temp", "temperature");
      const minMax = component.div("min-max-temp");
      const min = component.p("--", "min-temp", "temperature");
      const max = component.p("--", "max-temp", "temperature");
      
      dayLabel.textContent = format(addDays(today, i), "eee");
      weatherIcon.src = `http://openweathermap.org/img/wn/${this.#apiData.weatherData.daily[i].weather[0].icon}@2x.png`;
      dayTemp.textContent = this.#apiData.weatherData.daily[i].temp.day;
      min.textContent = this.#apiData.weatherData.daily[i].temp.min;
      max.textContent = this.#apiData.weatherData.daily[i].temp.max;

      minMax.append(min, max);
      dayContainer.append(dayLabel, weatherIcon, dayTemp, minMax);

      this.#dataDisplayContainer.append(dayContainer);
    }
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
