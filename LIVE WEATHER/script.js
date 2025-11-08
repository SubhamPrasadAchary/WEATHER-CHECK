document.addEventListener('DOMContentLoaded', function() {
    const API_KEY = window.API_KEY;
    const API_URL = 'https://api.openweathermap.org/data/2.5/weather';
    const CITY_LIST_URL = 'https://api.openweathermap.org/geo/1.0/direct';

    // DOM Elements
    const cityElement = document.getElementById('city');
    const countryElement = document.getElementById('country');
    const temperatureElement = document.getElementById('temperature');
    const descriptionElement = document.getElementById('description');
    const humidityElement = document.getElementById('humidity');
    const windSpeedElement = document.getElementById('wind-speed');
    const weatherIconElement = document.getElementById('weather-icon');
    const refreshBtn = document.getElementById('refresh-btn');
    const locationInput = document.getElementById('location-input');
    const searchBtn = document.getElementById('search-btn');
    const suggestions = document.getElementById('suggestions');

    getLocation();

    // Function to get user's location
    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    getWeatherData(latitude, longitude);
                },
                (error) => {
                    console.error('Error getting location:', error);
                    alert('Unable to get your location. Please allow location access.');
                },
                { 
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0 
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    }

    // Function to search weather by city name
    async function searchWeatherByCity(cityName) {
        try {
            // First get the city coordinates
            const geoResponse = await fetch(`${CITY_LIST_URL}?q=${encodeURIComponent(cityName)}&appid=${API_KEY}`);
            const cities = await geoResponse.json();
            
            if (cities.length === 0) {
                throw new Error('City not found');
            }
            
            const city = cities[0];
            // Then get the weather using coordinates
            const weatherResponse = await fetch(`${API_URL}?lat=${city.lat}&lon=${city.lon}&appid=${API_KEY}&units=metric`);
            const weatherData = await weatherResponse.json();
            
            updateWeatherDisplay(weatherData);
        } catch (error) {
            console.error('Error searching weather:', error);
            alert('City not found or error occurred. Please try again.');
            locationInput.value = '';
        }
    }

    // Function to get city suggestions
    async function getCitySuggestions(query) {
        try {
            const response = await fetch(`${CITY_LIST_URL}?q=${query}&limit=10&appid=${API_KEY}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching city suggestions:', error);
            return [];
        }
    }

    // Function to display suggestions
    function displaySuggestions(cities) {
        if (cities.length === 0) {
            suggestions.style.display = 'none';
            return;
        }

        suggestions.style.display = 'block';
        suggestions.innerHTML = '';
        
        const ul = document.createElement('ul');
        cities.forEach(city => {
            const li = document.createElement('li');
            li.textContent = `${city.name}, ${city.country}`;
            li.addEventListener('click', () => {
                locationInput.value = `${city.name}, ${city.country}`;
                searchWeatherByCity({
                    name: city.name,
                    lat: city.lat,
                    lon: city.lon
                });
                suggestions.style.display = 'none';
            });
            ul.appendChild(li);
        });
        suggestions.appendChild(ul);
    }

    // Function to fetch weather data
    async function getWeatherData(lat, lon) {
        try {
            const response = await fetch(`${API_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
            const data = await response.json();
            
            updateWeatherDisplay(data);
        } catch (error) {
            console.error('Error fetching weather data:', error);
            alert('Error fetching weather data. Please try again.');
        }
    }

    // Function to update the weather display
    function updateWeatherDisplay(data) {
        cityElement.textContent = data.name;
        countryElement.textContent = data.sys.country;
        temperatureElement.textContent = `${Math.round(data.main.temp)}°C`;
        descriptionElement.textContent = data.weather[0].description;
        humidityElement.textContent = data.main.humidity;
        windSpeedElement.textContent = Math.round(data.wind.speed * 3.6); // Convert m/s to km/h
        
        // Get weather icon
        const iconCode = data.weather[0].icon;
        weatherIconElement.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    }

    // Event listeners
    refreshBtn.addEventListener('click', getLocation);

    // Add event listener for location input
    locationInput.addEventListener('input', async (e) => {
        const query = e.target.value;
        if (query.length >= 2) {
            const suggestions = await getCitySuggestions(query);
            displaySuggestions(suggestions);
        } else {
            suggestions.style.display = 'none';
        }
    });
    document.addEventListener('click', (e) => {
        if (!suggestions.contains(e.target) && !locationInput.contains(e.target)) {
            suggestions.style.display = 'none';
        }
    });
    searchBtn.addEventListener('click', () => {
        const query = locationInput.value.trim();
        if (query) {
            searchWeatherByCity(query);
        }
    });

    // Allow pressing Enter to search
    locationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
});
