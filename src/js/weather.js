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

    this.#initializeSearch();
  }

  #initializeSearch() {
    this.#widgetContainer.append(component.geosearch());
  }

  get widget() {
    return this.#widgetContainer;
  }
}
