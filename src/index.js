import './styles.css';

// API Configuration
const API_KEY = process.env.VITE_WEATHER_API_KEY;
const GIPHY_KEY = process.env.VITE_GIPHY_API_KEY;
const BASE_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';

// DOM Elements
const weatherForm = document.getElementById('weather-form');
const locationInput = document.getElementById('location-input');
const unitToggle = document.getElementById('unit-toggle');
const loadingElement = document.getElementById('loading');
const weatherDisplay = document.getElementById('weather-display');
const errorDisplay = document.getElementById('error-display');
const gifContainer = document.getElementById('gif-container');

const weatherIcons = {
  'clear-day': 'icons/clear-day.svg',
  'clear-night': 'icons/clear-night.svg',
  'rain': 'icons/rain.svg',
  'snow': 'icons/snow.svg',
  'sleet': 'icons/sleet.svg',
  'wind': 'icons/wind.svg',
  'fog': 'icons/fog.svg',
  'cloudy': 'icons/cloudy.svg',
  'partly-cloudy-day': 'icons/partly-cloudy-day.svg',
  'partly-cloudy-night': 'icons/partly-cloudy-night.svg',
  'thunderstorm': 'icons/thunderstorm.svg'
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  if (!API_KEY || !GIPHY_KEY) {
    console.error('API keys not loaded! Check your .env file');
    errorDisplay.textContent = 'Configuration error: API keys missing';
    errorDisplay.classList.remove('hidden');
  }
});

// Form submission
weatherForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const location = locationInput.value.trim();

  if (location) {
    try {
      showLoading();
      hideError();
      await fetchWeather(location);
    } catch (error) {
      showError();
      console.error('Error fetching weather:', error);
    } finally {
      hideLoading();
    }
  }
});

async function fetchWeatherGif(weatherDescription) {
  try {
    if (!GIPHY_KEY) throw new Error('Giphy API key missing');

    const response = await fetch(
      `https://api.giphy.com/v1/gifs/translate?api_key=${GIPHY_KEY}&s=${encodeURIComponent(weatherDescription)}`
    );

    if (!response.ok) throw new Error('Giphy API error');

    const gifData = await response.json();
    gifContainer.innerHTML = `
      <img src="${gifData.data.images.original.url}"
           alt="${weatherDescription} gif"
           class="weather-gif">
    `;
  } catch (error) {
    console.error('Error fetching GIF:', error);
    gifContainer.innerHTML = '<p>Weather animation unavailable</p>';
  }
}

async function fetchWeather(location) {
  if (!API_KEY) throw new Error('Weather API key missing');

  const unitGroup = unitToggle.checked ? 'us' : 'metric';
  const response = await fetch(
    `${BASE_URL}/${encodeURIComponent(location)}?unitGroup=${unitGroup}&key=${API_KEY}&contentType=json`
  );

  if (!response.ok) {
    throw new Error(`Weather data not available for ${location}`);
  }

  const data = await response.json();
  displayWeather(data);
  await fetchWeatherGif(data.currentConditions.conditions);
}

function displayWeather(data) {
  // Use datetimeEpoch for background calculation (in seconds)
  updateBackground(data.currentConditions.datetimeEpoch * 1000);

  document.getElementById('location-name').textContent = `${data.address}`;

  // Use datetimeEpoch for current date (convert seconds to milliseconds)
  document.getElementById('current-date').textContent = formatDate(data.currentConditions.datetimeEpoch * 1000);

  document.getElementById('current-temp').textContent = Math.round(data.currentConditions.temp);
  document.getElementById('weather-description').textContent = data.currentConditions.conditions;
  document.getElementById('humidity').textContent = data.currentConditions.humidity;
  document.getElementById('wind-speed').textContent = Math.round(data.currentConditions.windspeed);
  document.getElementById('wind-unit').textContent = unitToggle.checked ? 'mph' : 'km/h';

  const iconCode = data.currentConditions.icon;
  const iconElement = document.getElementById('weather-icon');
  iconElement.src = weatherIcons[iconCode] || weatherIcons['clear-day'];
  iconElement.onerror = () => {
    iconElement.src = weatherIcons['clear-day'];
  };

  displayForecast(data.days);
  weatherDisplay.classList.remove('hidden');
}

function displayForecast(days) {
  const forecastContainer = document.getElementById('forecast-container');
  forecastContainer.innerHTML = '';

  for (let i = 1; i <= 5; i++) {
    const day = days[i];
    const forecastDay = document.createElement('div');
    forecastDay.className = 'forecast-day';

    // Create date from YYYY-MM-DD string for forecast days
    const date = new Date(day.datetime + 'T00:00:00');

    forecastDay.innerHTML = `
      <p>${date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
      <img src="${weatherIcons[day.icon] || weatherIcons['clear-day']}" alt="${day.conditions}">
      <p>${Math.round(day.tempmax)}° / ${Math.round(day.tempmin)}°</p>
      <p>${day.conditions}</p>
    `;

    forecastContainer.appendChild(forecastDay);
  }
}

function formatDate(timestamp, short = false) {
  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    console.warn('Invalid timestamp received:', timestamp);
    return short ? '---' : 'Invalid date';
  }

  const options = short
    ? { weekday: 'short' }
    : { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

  return date.toLocaleDateString('en-US', options);
}

function updateBackground(timestamp) {
  const hour = new Date(timestamp).getHours();
  const isNight = hour < 6 || hour >= 18;
  document.body.classList.toggle('night-mode', isNight);
}

function showLoading() {
  loadingElement.classList.remove('hidden');
  weatherDisplay.classList.add('hidden');
}

function hideLoading() {
  loadingElement.classList.add('hidden');
}

function showError() {
  errorDisplay.classList.remove('hidden');
  weatherDisplay.classList.add('hidden');
}

function hideError() {
  errorDisplay.classList.add('hidden');
}

// Unit toggle event
unitToggle.addEventListener('change', () => {
  if (weatherDisplay && !weatherDisplay.classList.contains('hidden')) {
    const location = document.getElementById('location-name').textContent;
    fetchWeather(location);
  }
});
