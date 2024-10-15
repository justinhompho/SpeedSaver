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

async function getMaxspeed(lat, lon) {
  //create query
  const query = `
    [out:json];
    way(around:500, ${lat}, ${lon})["maxspeed"];
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

let maxSpeedFound;
// Example usage: Get maxspeed for coordinates (latitude, longitude)
async function displayMaxspeed() {
  const maxSpeed = document.querySelector('#testy');
  const speed = await getMaxspeed(latitude, longitude);
  maxSpeed.textContent = speed !== null ? `Maxspeed: ${speed}` : "No maxspeed found";
  maxSpeedFound = speed;
  console.log("Maxspeed of nearest road:", maxSpeedFound);
}

setTimeout(() => {
  displayMaxspeed();
}, 2000);

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
      console.log(`State: ${state[0]}`);
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

setTimeout(() => {
  const state = getState(latitude, longitude);
}, 2500);

async function getGasPrice(state) {

}

async function getGasPrice(stateAbbreviation) {
  const API_KEY = 'SBL8FuySMGmemcSEhDHsluy0ywwSqIjNFKWwYc1U';  // Replace with your actual EIA API key
  const stateCodes = {
    'AL': 'ALA',
    'AK': 'ALA',
    'AZ': 'ARIZ',
    'AR': 'ARK',
    'CA': 'CAL',
    'CO': 'COL',
    'CT': 'CON',
    'DE': 'DEL',
    'FL': 'FLA',
    'GA': 'GEOR',
    'HI': 'HAWA',
    'ID': 'IDAH',
    'IL': 'ILL',
    'IN': 'IND',
    'IA': 'IOWA',
    'KS': 'KAN',
    'KY': 'KY',
    'LA': 'LA',
    'ME': 'MAIN',
    'MD': 'MD',
    'MA': 'MAS',
    'MI': 'MICH',
    'MN': 'MIN',
    'MS': 'MISS',
    'MO': 'MO',
    'MT': 'MONT',
    'NE': 'NEB',
    'NV': 'NEV',
    'NH': 'NHA',
    'NJ': 'NJA',
    'NM': 'NMA',
    'NY': 'NY',
    'NC': 'NCA',
    'ND': 'NDA',
    'OH': 'OHI',
    'OK': 'OK',
    'OR': 'ORE',
    'PA': 'PENN',
    'RI': 'RHOD',
    'SC': 'SCA',
    'SD': 'SDA',
    'TN': 'TEN',
    'TX': 'TEX',
    'UT': 'UTA',
    'VT': 'VERM',
    'VA': 'VIRG',
    'WA': 'WASH',
    'WV': 'WVA',
    'WI': 'WIS',
    'WY': 'WYO',
  };

  // Get the EIA series ID for the state
  const seriesId = `PET.EMM_EPM0D_PTE_${stateCodes[stateAbbreviation] || 'NUS'}_DMC`;
  const url = `https://api.eia.gov/v2/electricity/retail-sales/data?api_key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.series && data.series.length > 0) {
      const latestData = data.series[0].data[0];  // Get the latest data point
      console.log(latestData);
      return {
        date: latestData[0],
        price: latestData[1]
      };
    } else {
      throw new Error('No data found for the specified state.');
    }
  } catch (error) {
    console.error('Error fetching gas prices:', error);
    return null;
  }
}

// Example usage:
getGasPrice('IL').then(gasPrice => {
  if (gasPrice) {
    console.log(`Gas price in California on ${gasPrice.date}: $${gasPrice.price}`);
  }
});




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