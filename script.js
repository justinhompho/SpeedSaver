

// Geo location demo //////////////////////////////////////
let longitude;
let latitude;


function geoFindMe() {
  const status = document.querySelector("#status");
  const mapLink = document.querySelector("#map-link");

  mapLink.href = "";
  mapLink.textContent = "";

  function success(position) {
    // Set global variables
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;

    status.textContent = "";
    mapLink.href = `https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`;
    mapLink.textContent = `Latitude: ${latitude} °, Longitude: ${longitude} °`;
  }

  function error() {
    status.textContent = "Unable to retrieve your location";
  }

  if (!navigator.geolocation) {
    status.textContent = "Geolocation is not supported by your browser";
  } else {
    status.textContent = "Locating…";
    navigator.geolocation.getCurrentPosition(success, error);
  }
}

// Call the function to set global variables
geoFindMe();

// Example usage: Access the global variables after they are set
setTimeout(() => {
  console.log("Longitude:", longitude);
  console.log("Latitude:", latitude);
}, 2000); // Delay to ensure geolocation callback has time to complete

document.querySelector("#find-me").addEventListener("click", geoFindMe);

async function getMaxspeed(lat, lon) {
  // Construct Overpass QL query to find roads with maxspeed near the coordinates
  const query = `
    [out:json];
    way(around:50, ${lat}, ${lon})["maxspeed"];
    out tags;`;

  // requrest
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Check if there are any roads with maxspeed found
    if (data.elements.length > 0) {
      // Extract maxspeed values from the response
      const maxspeeds = data.elements.map(element => element.tags.maxspeed);

      // The api stres speed in an array
      return maxspeeds[0];
    } else {
      console.log("No roads with maxspeed found near the given coordinates.");
      return null;
    }
  } catch (error) {
    console.error("Error querying Overpass API:", error);
    return null;
  }
}

// Example usage: Get maxspeed for coordinates (latitude, longitude)
async function displayMaxspeed() {
  const maxSpeed = document.querySelector('#testy');
  // const speed = await getMaxspeed(52.5200, 13.4050);
  // maxSpeed.textContent = speed !== null ? `Maxspeed: ${speed}` : "No maxspeed found";
  maxSpeed.textContent = latitude
}
displayMaxspeed();


////////////////////////////////////////////////////////

function calculateSpeed() {

  resetTable();
  var speedLimit = Number(document.querySelector('.js-speed-limit').value);
  var mpg = Number(document.querySelector('.js-mpg').value);
  var distance = Number(document.querySelector('.js-distance').value);
  var gasPrice = Number(document.querySelector('.js-gas-price').value);

  //placeholder values
  if (!speedLimit)
    speedLimit = 60;
  if (!mpg)
    mpg = 30;
  if (!distance)
    distance = 100;
  if (!gasPrice)
    gasPrice = 4;

  const table = document.querySelector('.js-calculator-output');
  const header = table.insertRow(-1);
  header.className = 'table-header';

  const tspeed = header.insertCell(0);
  const ttime = header.insertCell(1);
  const tmpg = header.insertCell(2);
  const tcost = header.insertCell(3);

  tspeed.innerHTML = 'Speed';
  ttime.innerHTML = 'Travel Time';
  tmpg.innerHTML = 'Estimate MPG';
  tcost.innerHTML = 'Cost';


  for (let speed = speedLimit - 10; speed <= (speedLimit + 20); speed += 5) {
    var row = table.insertRow(-1);
    var newSpeed = row.insertCell(0);
    var newTime = row.insertCell(1);
    var newMPG = row.insertCell(2);
    var newCost = row.insertCell(3);

    newSpeed.innerHTML = speed;
    newTime.innerHTML = hoursToMins(distance / speed);
    newMPG.innerHTML = trunc(calculateMPG(mpg, speed));
    newCost.innerHTML = '$' + trunc(gasPrice * (distance / calculateMPG(mpg, speed)));
  }

}

function resetTable() {
  const table = document.querySelector('.js-calculator-output');

  if (table.rows[1] != null) {
    while (table.rows[1] != null)
      var row = table.deleteRow(-1);
  }
}

//hopefully able to be replaced with a graph/better equation eventually
function calculateMPG(mpg, speed) {
  if (speed === 0)
    return 0;
  else if (speed === 5)
    return mpg * (1 - .66)
  else if (speed === 10)
    return mpg * (1 - .50)
  else if (speed === 15)
    return mpg * (1 - .33)
  else if (speed === 20)
    return mpg * (1 - .17)
  else if (speed === 25)
    return mpg * (1 - .10)
  else if (speed === 30)
    return mpg * (1 - .05)
  else if (speed >= 35 && speed < 60)
    return mpg;
  else if (speed === 60)
    return mpg * (1 - .03);
  else if (speed === 65)
    return mpg * (1 - .08);
  else if (speed === 70)
    return mpg * (1 - .17);
  else if (speed === 75)
    return mpg * (1 - .23);
  else if (speed === 80)
    return mpg * (1 - .28);
  else if (speed === 85)
    return mpg * (1 - .33);
  else if (speed === 90)
    return mpg * (1 - .38);
}

function trunc(num) {
  return Math.round(num * 100) / 100;
}

function hoursToMins(hours) {
  const minutes = hours * 60;
  const hoursResult = Math.floor(minutes / 60);
  const minutesResult = Math.round(minutes % 60);
  return `${hoursResult}h ${minutesResult}m`;
}