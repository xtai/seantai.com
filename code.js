const slider = document.getElementById('time-slider');
const body = document.body;
const latitude = 37.7749;
const longitude = -122.4194;

async function initialize() {
  // Fetch sunrise and sunset data for San Francisco
  const timings = await fetchSunriseSunsetTimes(latitude, longitude);
  console.debug('Fetched sunrise and sunset timings:', timings);
  const currentTime = getCurrentSanFranciscoTime();
  console.debug('Current San Francisco time in minutes since midnight:', currentTime);

  // Set the slider to the current time and update the sky accordingly
  updateSky(currentTime, timings);
  slider.value = currentTime;

  // Update sky color when slider value changes
  slider.addEventListener('input', () => {
    const time = Number(slider.value);
    updateSky(time, timings);
  });

  // Handle arrow key events to control the slider value
  body.addEventListener('keydown', (event) => {
    let time = Number(slider.value);
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      // Increment by 10 minutes and wrap around at 1440 (end of the day)
      time = (time + 10) % 1440;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      // Decrement by 10 minutes and wrap around at 0
      time = (time - 10 + 1440) % 1440;
    }
    slider.value = time;
    updateSky(time, timings);
  });
}

// Fetch sunrise and sunset times from the API
async function fetchSunriseSunsetTimes(lat, lng) {
  try {
    const response = await fetch(
      `https://api.sunrisesunset.io/json?lat=${lat}&lng=${lng}&timezone=America/Los_Angeles`
    );
    const data = await response.json();
    if (data.status === 'OK') {
      return {
        sunrise: parseTime(data.results.sunrise),
        sunset: parseTime(data.results.sunset),
        firstLight: parseTime(data.results.first_light),
        lastLight: parseTime(data.results.last_light),
        dawn: parseTime(data.results.dawn),
        dusk: parseTime(data.results.dusk),
        solarNoon: parseTime(data.results.solar_noon)
      };
    } else {
      console.error('Failed to fetch sunrise and sunset data');
      return null;
    }
  } catch (error) {
    console.error('Error fetching sunrise and sunset times:', error);
    return null;
  }
}

// Parse a time string (e.g., "06:00:00 AM") into minutes since midnight
function parseTime(timeStr) {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes, seconds] = time.split(':').map(Number);
  if (modifier === 'PM' && hours !== 12) {
    hours += 12;
  }
  if (modifier === 'AM' && hours === 12) {
    hours = 0;
  }
  const minutesSinceMidnight = hours * 60 + minutes;
  return minutesSinceMidnight;
}

// Get the current time in San Francisco in minutes since midnight
function getCurrentSanFranciscoTime() {
  const currentDate = new Date();
  const sanFranciscoTime = new Date(currentDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const minutesSinceMidnight = sanFranciscoTime.getHours() * 60 + sanFranciscoTime.getMinutes();
  return minutesSinceMidnight;
}

// Update the background gradient based on the time of day
function updateSky(time, timings) {
  if (!timings) {
    console.error('Timings data not available');
    return;
  }

  let skyGradient;
  // Define sky color transitions throughout the day
  const colors = [
    { time: 0, colors: ['#131731', '#2c407d'] }, // Midnight
    { time: timings.firstLight - 30, colors: ['#1a1f4a', '#3c518b'] }, // First light - 30
    { time: timings.firstLight, colors: ['#0c2e64', '#93b1d5'] }, // First light
    { time: timings.dawn, colors: ['#3c518b', '#ff9a76'] }, // Dawn
    { time: timings.sunrise, colors: ['#a8b7cc', '#ffa300'] }, // Sunrise
    { time: timings.sunrise + 30, colors: ['#4b70a7', '#e4d4c5'] }, // Sunrise + 30
    { time: timings.sunrise + 60, colors: ['#254a82', '#8cb3dd'] }, // Sunrise + 60
    { time: timings.solarNoon, colors: ['#034c8f', '#79ace4'] }, // Solar Noon
    { time: timings.sunset - 60, colors: ['#254a82', '#8cb3dd'] }, // Sunset - 60
    { time: timings.sunset - 30, colors: ['#4a71a8', '#e4d4c6'] }, // Sunset - 30
    { time: timings.sunset, colors: ['#a7b6cb', '#f3834c'] }, // Sunset
    { time: timings.dusk, colors: ['#6667a8', '#fc9179'] }, // Dusk
    { time: timings.lastLight, colors: ['#213e6e', '#bf808a'] }, // Last light
    { time: timings.lastLight + 30, colors: ['#1a204a', '#3d518b'] }, // Last light + 30
    { time: 1440, colors: ['#131731', '#2c407d'] } // Midnight
  ];

  // Find the appropriate colors based on the current time
  for (let i = 0; i < colors.length - 1; i++) {
    const current = colors[i];
    const next = colors[i + 1];
    if (time >= current.time && time < next.time) {
      // Calculate the interpolation factor between the two color sets
      const factor = (time - current.time) / (next.time - current.time);
      const startColor = interpolateColor(current.colors[0], next.colors[0], factor);
      const endColor = interpolateColor(current.colors[1], next.colors[1], factor);
      skyGradient = `linear-gradient(to top, ${endColor}, ${startColor})`;
      break;
    }
  }

  // Set the background gradient of the body element
  body.style.background = skyGradient;
}

// Interpolate between two colors based on a factor between 0 and 1
function interpolateColor(color1, color2, factor) {
  const c1 = parseColor(color1);
  const c2 = parseColor(color2);

  // Calculate the interpolated RGB values
  const r = Math.round(c1.r + factor * (c2.r - c1.r));
  const g = Math.round(c1.g + factor * (c2.g - c1.g));
  const b = Math.round(c1.b + factor * (c2.b - c1.b));

  const interpolatedColor = `rgb(${r}, ${g}, ${b})`;
  return interpolatedColor;
}

// Parse a hex color string into an object with r, g, b properties
function parseColor(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return { r, g, b };
}

initialize();
