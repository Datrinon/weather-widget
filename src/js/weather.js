import {format, addDays} from "date-fns";
import Utility from "./utility";
import component from "./component";

/**
 * A weather widget created using OpenWeather API. 
 */
export default class WeatherWidget {
  
  #STORAGE_KEY = "WEATHER_WIDGET_LOCATION";
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
  #locationQuery;
  /**
   * Based on last valid value assigned to location query, which is needed
   * to make it update.
   * @type {string}
   */
  #lastValidLocationQuery;
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
   * }} defaultLocation - Default location to utilize. Codes align to ISO-3166. You
   * can leave this null if the user has already searched for a place.
   */
  constructor(apiKey, celsiusMode = false, viewMode = 0, defaultLocation = null) {
    this.#widgetContainer = Utility.createElement("article", "weather-widget");
    
    const bg = Utility.createElement("div", "bg");
    this.#widgetContainer.append(bg);

    const nightSky = Utility.createElement("div", "night-sky");
    this.#widgetContainer.append(nightSky);

    this.#dataDisplayContainer = Utility.createElement("div", "data-view");
    this.#locationApiBase = `https://api.openweathermap.org/data/2.5/weather?appid=${apiKey}`;
    this.#weatherApiBase = `https://api.openweathermap.org/data/2.5/onecall?appid=${apiKey}`;
    
    // debug
    console.log(this.#locationApiBase);

    if (defaultLocation === null) {
      this.#locationQuery = localStorage.getItem(this.#STORAGE_KEY);
      if (!this.#locationQuery) {
        this.#locationQuery = "&q=San Francisco,US-CA";
      }
    } else {
      this.#locationQuery = `&q=${defaultLocation.city}`
          + `,${defaultLocation.stateCode},${defaultLocation.countryCode}`;
    }

    this.celsiusMode = celsiusMode;

    this.#initSearch();
    this.#initOptionsDisplay(viewMode);
    this.#widgetContainer.append(this.#dataDisplayContainer);
    this.#initFooter();
    this.#updateDisplay();

    window.onbeforeunload = () => {
      this.saveLocationToStorage.call(this);
    }
  }

  /**
   * Submits a search and queries the location.
   */
  #submitSearch(e) {
    let searchParameter;
    const searchField = Utility
        .getMatchingParent(e.currentTarget, ".search-container")
        .querySelector(".search-field");
    let searchQuery = searchField.value; 
    // searches can come as zip code, city name / state, city name / country, or by lat / long coordinates.
    // trim any extra white space
    searchQuery = searchQuery.replace(", ", ",");
    searchQuery = searchQuery.trim(); 
    
    // If there are numbers in the query, infer that it is a US zip code.
    if (searchQuery.match(/[0-9]/g)
        && searchQuery.match(/[0-9]/g).length === 5
    ) {
      searchParameter = "&zip=" + searchQuery;
    // else check for lat long
    } else if (searchQuery.match(/[0-9]\./g)
      && searchQuery.match(/[0-9]\./g).length === 2
    ) {
      searchQuery = searchQuery.split(",");
      searchParameter = `&lat=${searchQuery[0]}&lon=${searchQuery[1]}`;
    // else check for a state abbreviation provided as the second argument.
    } else if (searchQuery.includes(",")
      && searchQuery.split(",")[1] !== null
      && searchQuery.split(",").length == 2
    ) {
      // in this case, we append us to the end
      searchQuery += ",US";
      searchParameter = `&q=${searchQuery}`;
    } else {
      // else just throw it to q to query for.
      searchParameter = `&q=${searchQuery}`;
    }

    this.#locationQuery = searchParameter;
    this.#updateDisplay(true);
  }

  /**
   * Get location of the user. Uses callback patterns rather than async / await due
   * to the nature of the navigator API (it is asynchronous but the needed
   * method returns void rather than the result of the callbacks it takes in as parameters)
   */
  #askForLocation(e) {
    let self = this;
    let button = e.currentTarget;
    function success(position) {
      const latitude  = position.coords.latitude;
      const longitude = position.coords.longitude;

      let searchParameter = `&lat=${latitude}&lon=${longitude}`;
      self.#locationQuery = searchParameter;
      self.#updateDisplay();
    }
  
    function error() {
      const parent = Utility.getMatchingParent(button, ".search-container");
      component.tooltip(parent,
          "Please allow location permissions to use your location on the widget.", 3);
      }
    
      navigator.geolocation.getCurrentPosition(success, error);
  }

  /**
   * Initializes the search bar by creating the element and adding the appropriate handlers.
   */
  #initSearch() {
    const searchBarForm = component.geosearch("Search a place...");
    searchBarForm.querySelector(".location").setAttribute("title", "Use My Location");
    searchBarForm.querySelector(".location").addEventListener("click",
        (e) => this.#askForLocation.call(this, e));

    // Display search assistance when field is active.
    searchBarForm.querySelector(".search").setAttribute("title", "Search Place");
    searchBarForm.querySelector(".search-field")
      .addEventListener("focus", (e) => this.#showSearchTips.call(this, e));
    searchBarForm.querySelector(".search-field")
      .addEventListener("focusout",
          (e) => e.currentTarget.parentNode.querySelector(".tooltip").remove());

    searchBarForm.addEventListener("submit", (e) => {
      // use submit event to catch empty queries.
      e.preventDefault(); 
      this.#submitSearch.call(this, e);
    });

    this.#widgetContainer.append(searchBarForm);
  }

  /**
   * Only show search tips when the user focuses on the input. And don't create
   * another if one is already present.
   * @param {Event} e - event the callback is assigned. to. 
   */
  #showSearchTips(e) {
    const parent = Utility.getMatchingParent(e.currentTarget, ".search-field-wrapper");
    if (!parent.querySelector(".tooltip")) {
      const acceptableFormats = `Acceptable formats:
      ??? (U.S.) Zip Code
      ??? (U.S.) City Name, State Abbrev.
      ??? (Intl.) City Name, Country
      ??? Latitude, Longitude`;
      component.tooltip(parent, acceptableFormats, 0, false);
    }
  }

  /**
   * Initializes a reload button, adding it to the view and adding appropriate handlers.
   */
  #initReloadButton() {
    const self = this;
    const reloadButton = component.button("", "reload");
    const reloadIcon = component.faIcon("fas", "fa-redo-alt");

    reloadButton.append(reloadIcon);
    reloadButton.setAttribute("title", "Update");

    reloadButton.addEventListener("click", () => {
      self.#updateDisplay();
    });

    return reloadButton;
  }

  /**
   * Update the display by fetching data and then displaying it.
   * @param {boolean} onSearch - Set to true if you're updating the view from search bar.
   */
  #updateDisplay(onSearch=false) {
    const loadingMessage = component.loadingMessage(
      this.widget.querySelector(".reload"),
      "Updating");
    
    loadingMessage.play();

    this.#fetchData()
      .then((data) => {
        loadingMessage.stop();
        this.#lastValidLocationQuery = this.#locationQuery;
        if (onSearch) {
          // guaranteed to always be valid.
          document.querySelector(".search-field").value = "";
        }
        this.#apiData = data;
        console.log(data);
        this.#determineBGColor();
        this.#renderDisplayData();

        this.widget.querySelector(".update-time").textContent =
          format(new Date(), "p");
      }).catch((error) => {
        loadingMessage.stop();
        console.log(error);
        if (onSearch) {
            component.tooltip(document.querySelector(".search-field").parentNode,
                "Location was not found. Please ensure formatting is followed.", 3);
            console.log("resetting to previous location query...");
            this.#locationQuery = this.#lastValidLocationQuery;
        }
    });
  }

  #initOptionsDisplay(viewMode) {
    let self = this;
    const optionsContainer = Utility.createElement("div", "display-options");
    const dayViewPanel = Utility.createElement("div", "display-day-view");
    const today = component.button("Today", "options-today");
    const threeDay = component.button("3 Day", "options-3Day");
    const weekly = component.button("Week", "options-weekly");
    const metricPanel = component.div("metrics");
    const toggleFahrenheit = component.button("??F", "options-toggleF");
    const toggleCelsius = component.button("??C", "options-toggleC");

    dayViewPanel.append(today, threeDay, weekly);
    dayViewPanel.querySelectorAll("*")
      .forEach(button => button.addEventListener("click",
          (e) => {
            self.#toggleSelected(e, ".display-day-view");
            self.#renderDisplayData();
          }));
    dayViewPanel.children[viewMode].classList.add("selected");
    dayViewPanel.children[viewMode].setAttribute("disabled", "true");

    metricPanel.append(toggleFahrenheit, toggleCelsius);
    if (this.celsiusMode) {
      toggleCelsius.classList.add("selected");
      toggleCelsius.setAttribute("disabled", "true");
    } else {
      toggleFahrenheit.classList.add("selected");
      toggleFahrenheit.setAttribute("disabled", "true");
    }
    toggleFahrenheit.addEventListener("click", (e) => this.#toggleMeasurementSystem.call(this, e));
    toggleCelsius.addEventListener("click", (e) => this.#toggleMeasurementSystem.call(this, e));

    optionsContainer.append(dayViewPanel, metricPanel);
    this.#widgetContainer.append(optionsContainer);
  }

  /**
   * Swap measurement systems, updating all elements with .temperature with the 
   * new value.
   */
  #toggleMeasurementSystem(e) {
    this.#toggleSelected(e, ".metrics");
    this.celsiusMode = !this.celsiusMode;
    
    if(this.celsiusMode) {
      document.querySelectorAll(".temperature").forEach(temp =>{
        let temperature = parseInt(temp.textContent);
        temperature = Math.round((5/9) * (temperature - 32));

        temp.textContent = temperature;
      });
    } else {
      document.querySelectorAll(".temperature").forEach(temp =>{
        let temperature = parseInt(temp.textContent);
        temperature = Math.round(((9/5) * temperature) + 32);

        temp.textContent = temperature;
      });
    }
  }

  #toggleSelected(e, parentSelector) {
    // remove selected class from the other.
    const parent = Utility.getMatchingParent(e.currentTarget, parentSelector);
    const currentSelected = parent.querySelector(".selected");
    currentSelected.classList.remove("selected");
    currentSelected.removeAttribute("disabled");
    // toggle selected class on the button
    e.currentTarget.classList.add("selected");
    e.currentTarget.setAttribute("disabled", "true");
  }

  /**
   * Fetch data given a string of parameters. The API key and mode are already
   * provided for. At most, you just have to provide a location and timespan.
   * @param {string[]} query 
   * @returns {{}} JSON data object containing API response.
   */
  async #fetchData(...query) {
    // 1. Location Code.
    let response = await fetch(this.#locationApiBase + this.#locationQuery, );
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

    let offset = Math.ceil(weatherData.timezone_offset / 3600);
    let time = new Date();
    // convert to UTC first
    time.setHours(time.getHours() + (time.getTimezoneOffset() / 60));
    // now add the offset
    time.setHours(time.getHours() + offset);
    time = time.getHours();

    // 3. Return them together.
    return {weatherData, location, time};
  }

  /**
   * Called after the API fetches data, determines the bg color given the time and condition.
   */
  #determineBGColor() {
    let bgStyle;
    const time = Math.floor(this.#apiData.time);
    const condition = this.#apiData.weatherData.current.weather[0].description.toLowerCase();
    document.querySelector(".night-sky").style.opacity = 0; 
    // 20 - 6 apply night bg
    if (time >= 20 || time < 6) {
      // -> if not clear, apply night-overcast-bg
      if (condition.includes("clear") || condition.includes("broken clouds")) {
        bgStyle = "night-bg";
        document.querySelector(".night-sky").style.opacity = 1.0; 
      } else {
        bgStyle = "night-overcast-bg";
        document.querySelector(".night-sky").style.opacity = 0.5; 
      }
    // else apply day styles
    } else {
      if ((time >= 6 && time < 9)) {
        bgStyle = "sunrise-bg";
      } else if (time >= 18 && time < 20) {
        bgStyle = "sunset-bg";
      } else {
        bgStyle = "sunny-bg";
      }

      if (!condition.includes("clear")
        && !condition.includes("few")
        && !condition.includes("scattered"))
        {
        bgStyle = "overcast-bg";
      }
    }

    // set bg style.
    const root = window.getComputedStyle(document.body);
    const self = this.widget;
    const bgWrapper = this.widget.querySelector(".bg");
    const newBg = root.getPropertyValue(`--${bgStyle}`);

    if (newBg !== self.style.background) {
      bgWrapper.style.background = root.getPropertyValue(`--${bgStyle}`);
      bgWrapper.classList.add("gradual-opacity");
      bgWrapper.addEventListener("animationend", () => {
        // apply the bg color to the original widget.
        self.style.background = bgWrapper.style.background;
        // get rid of animation class for the wrapper.
        bgWrapper.classList.remove("gradual-opacity");
      }, {once: true});
    }
  }

  /**
   * Shows a data display based on the button that was selected. To be called
   * each time a button is selected on the .display-day-view node.
   */
  #renderDisplayData() {
    const dataContainer = this.#dataDisplayContainer;
    const dayViewButtons = this.#widgetContainer.querySelector(".display-day-view");
    const selected = dayViewButtons.querySelector(".selected");
    const selectedIndex = Array.from(dayViewButtons.children).indexOf(selected);

    // remove the current view using a disappear animation;
    // remove appear-from-bottom which is used later to make the updated view appear.
    dataContainer.classList.remove("appear-from-bottom");
    dataContainer.classList.add("disappear");

    // and when it ends execute the following code.
    dataContainer.addEventListener("animationend", () => {
      dataContainer.classList.remove("disappear");

      // background set up for the new view, including switch statement
      dataContainer.style.opacity = 0;
      Utility.removeAllChildren(dataContainer);

      switch(selectedIndex) {
        case 0:
          dataContainer.className = "data-view today";
          this.#render1DayDataDisplay();
          break;
          case 1:
          dataContainer.className = "data-view three-day multiday";
          this.#renderNDaysDataDisplay(3);
          break;
        case 2:
          dataContainer.className = "data-view weekly multiday";
          this.#renderNDaysDataDisplay(7);
          break;
      }
      
      // and lastly show the elements coming from the top.
      dataContainer.classList.add("appear-from-bottom");
      dataContainer.style.opacity = 1;
    });
  }

  /**
   * Calculate the cardinal direction of the wind based on given degrees.
   * @param {number} degrees - The degrees of the wind direction.
   * @returns {string} - String direction.
   */
  #calculateWindDirection(degrees) {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    degrees += 22.5;
    degrees /= 2;

    if (degrees < 0) {
      degrees = 360 - Math.abs(degrees) % 360;
    } else {
      degrees = degrees % 360;
    }

    let index = parseInt(degrees / 45);
    return `${directions[index]}`;
  }

  /**
   * For displaying the current day's data.
   * This will create elements, and then populate them with data fetched from
   * OpenWeather.
   */
  #render1DayDataDisplay() {
    const city = component.p("City", "display-city");
    const country = component.p("Country", "display-country");
    const weatherContainer = component.div("weather-data");
    const weatherIcon = component.img("", "weather-icon");
    const temperature = component.p("--", "current-temp", "temperature");
    this.#dataDisplayContainer.append(city, country);
    weatherContainer.append(weatherIcon, temperature);

    const minMax = component.div("min-max-temp");
    const min = component.p("--", "min-temp", "temperature");
    const max = component.p("--", "max-temp", "temperature");
    minMax.append(min, max);
    weatherContainer.append(minMax);

    const wind = component.div("wind");
    const windLabel = component.p("Wind: ", "wind-label");
    const windSpeed = component.span("--", "wind-speed");
    const windDirection = component.span("--", "wind-dir");
    wind.append(windLabel, windSpeed, windDirection);
    weatherContainer.append(wind);

    const condition = component.p("Condition here.", "weather-description");
    weatherContainer.append(condition);

    this.#dataDisplayContainer.append(weatherContainer);

    city.textContent = this.#apiData.location.city;
    country.textContent = this.#apiData.location.country;
    weatherIcon.src = `http://openweathermap.org/img/wn/${this.#apiData.weatherData.current.weather[0].icon}@4x.png`;
    temperature.textContent = Math.round(this.#apiData.weatherData.current.temp);
    min.textContent = Math.round(this.#apiData.weatherData.daily[0].temp.min);
    max.textContent = Math.round(this.#apiData.weatherData.daily[0].temp.max);
    windSpeed.textContent = Math.round(this.#apiData.weatherData.current.wind_speed);
    windDirection.textContent =
      this.#calculateWindDirection(this.#apiData.weatherData.current.wind_deg);
    condition.textContent = Utility.toSentence(this.#apiData.weatherData.current.weather[0].description);
  }

  /**
   * For displaying the weather of the next N days.
   * @param {n} - The number of days to fetch data for.
   */
  #renderNDaysDataDisplay(n) {
    const daysContainer = component.div("days");

    const city = component.p("City", "display-city");
    const country = component.p("Country", "display-country");
    city.textContent = this.#apiData.location.city;
    country.textContent = this.#apiData.location.country;

    const today = new Date();

    for (let i = 0; i < n; i++) {
      const dayContainer = component.div("day");
      const dayLabel = component.p("", "day-of-week");
      const weatherIcon = component.img(null, "icon");
      const dayTemp = component.p("--", "day-temp", "temperature");
      const minMax = component.div("min-max-temp");
      const min = component.p("--", "min-temp", "temperature");
      const max = component.p("--", "max-temp", "temperature");
      
      dayLabel.textContent = format(addDays(today, i), "eee");
      weatherIcon.src = `http://openweathermap.org/img/wn/${this.#apiData.weatherData.daily[i].weather[0].icon}@4x.png`;
      dayTemp.textContent = Math.round(this.#apiData.weatherData.daily[i].temp.day);
      min.textContent = Math.round(this.#apiData.weatherData.daily[i].temp.min);
      max.textContent = Math.round(this.#apiData.weatherData.daily[i].temp.max);

      minMax.append(min, max);
      dayContainer.append(dayLabel, weatherIcon, dayTemp, minMax);

      daysContainer.append(dayContainer);
    }
    this.#dataDisplayContainer.append(city, country, daysContainer);
  }

  #initFooter() {
    const footer = Utility.createElement("footer", "widget-footer");
    
    const logo = component.div("logo");
    logo.append(component.p("Powered by OpenWeather.", "logo-text"));
    this.#widgetContainer.append(logo);
    
    const lastUpdate = component.p("Last update: ");
    const time = component.span("--:-- --", "update-time");
    lastUpdate.append(time);
    logo.prepend(lastUpdate);

    footer.append(logo, this.#initReloadButton());

    this.#widgetContainer.append(footer);
  }

  get widget() {
    return this.#widgetContainer;
  }

  saveLocationToStorage(){
    localStorage.setItem(this.#STORAGE_KEY, this.#locationQuery);
  }
}
