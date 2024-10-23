let longitude;
let latitude;

function getCoords() {
  function success(position) {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
    console.log(`Latitude: ${latitude} °, Longitude: ${longitude} °`)
    console.log(`https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`);
  }

  function error() {
    console.log("Unable to retrieve your location");
  }

  if (!navigator.geolocation)
    console.log("Geolocation is not supported by your browser");

  navigator.geolocation.getCurrentPosition(success, error);
}
// Call the function to set global variables
getCoords();

// Uses the OverPassAPI
let localMaxSpeed;
async function getMaxSpeed(lat, lon) {
  const query = `
    [out:json];
    way(around:1000, ${lat}, ${lon})["maxspeed"];
    out tags;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    //query creates a list of nodes that contain "maxspeed", then shows the information of each nodes
    if (data.elements.length > 0) {
      // Extract maxspeed values from the response
      const maxspeeds = data.elements.map(element => element.tags.maxspeed);
      //return closest road's speed
      return parseInt(maxspeeds[0]);
    } else {
      console.log("No roads with maxspeed found near the given coordinates.");
      return null;
    }
  } catch (error) {
    console.error("Error querying Overpass API:", error);
    return null;
  }
}

setTimeout(async () => {
  localMaxSpeed = await getMaxSpeed(latitude, longitude);
  console.log(`Nearest Max Speed: ${localMaxSpeed} mph`);
}, 1000);

// Uses the OverPassAPI
let localState;
async function getState() {
  const query = `
  [out:json];
  is_in(${latitude}, ${longitude}); 
  rel(pivot)["admin_level"="4"]; // admin_level=4 corresponds to states/provinces
  out tags;
  `
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.elements.length > 0) {
      // const maxspeeds = data.elements.map(element => element.tags.maxspeed);
      // return parseInt(maxspeeds[0]);

      const state = data.elements.map(element => element.tags.ref);
      // console.log(`State: ${state[0]}`);
      return state;
    } else {
      console.log("No State found near the given coordinates.");
      return null;
    }
  }
  catch (error) {
    console.error("Error querying Overpass API:", error);
    return null;
  }
}
setTimeout(async () => {
  localState = await getState(latitude, longitude);
}, 1000);

// Uses Webscraping method and scraperAPI.com's free proxy to access AAA's HTML
let localGasPrice;
async function getGasPrice(state) {
  const apiKey = "d96bde3b6bd8b607b197f7f92d562377"
  const targetUrl = `https://gasprices.aaa.com/?state=${state}`;
  const proxyUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}`;

  try {
    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const data = await response.text();
    // console.log(data);
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, "text/html");
    const table = doc.querySelector(".table-mob");

    if (!table) {
      throw new Error('Table with ID "table-mob" not found.');
    }
    const tbody = table.querySelector('tbody');
    if (!tbody) {
      throw new Error('No <tbody> found inside the table.');
    }
    const firstRow = tbody.querySelector('tr');
    if (!firstRow) {
      throw new Error('No rows found in the <tbody>.');
    }
    const cell2 = firstRow.querySelectorAll('td')[1];
    if (!cell2) {
      throw new Error('Cell 2 not found in the first row.');
    }
    // console.log(cell2.textContent);
    return cell2.textContent;

  } catch (error) {
    console.error('Error fetching gas prices:', error);
  }
}
setTimeout(async () => {
  localGasPrice = await getGasPrice('IL');
  console.log(`Gas Price in IL: ${localGasPrice}`);
}, 1000);

////////////////////////////////////////////////////////

function manualCalculateSpeed() {
  let ManualSpeedLimit = Number(document.querySelector('.js-speed-limit').value);
  let ManualMpg = Number(document.querySelector('.js-mpg').value);
  let ManualDistance = Number(document.querySelector('.js-distance').value);
  let ManualGasPrice = Number(document.querySelector('.js-gas-price').value);
  calculateSpeed(ManualSpeedLimit, ManualMpg, ManualDistance, ManualGasPrice);
}

function localCalculateSpeed() {
  let ManualMpg = Number(document.querySelector('.js-mpg').value);
  let ManualDistance = Number(document.querySelector('.js-distance').value);

  setTimeout(async () => { ///////////////left off here 10/22
    localMaxSpeed = getMaxSpeed(latitude, longitude)
    localState = await getState(latitude, longitude);
    localGasPrice = getGasPrice(localState);
  }, 1000);
  calculateSpeed(localMaxSpeed, ManualMpg, ManualDistance, localGasPrice);
}
function calculateSpeed(speedLimit, mpg, distance, gasPrice) {
  resetTable();

  //placeholder values
  if (!speedLimit)
    speedLimit = 60;
  if (!mpg)
    mpg = 24;
  if (!distance)
    distance = 50;
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

    console.log("hello"); //////////////////////////////LEFT OFF HERE 10/22
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