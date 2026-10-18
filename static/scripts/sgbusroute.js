let data1 = [];
let busStopData = [];
let stopCodeNameMatch = {};

async function loadFile(fileName1, fileName2) {
  try {
    const Fetched1 = await fetch(fileName1);
    const Fetched2 = await fetch(fileName2);
    data1 = await Fetched1.json();
    busStopData = await Fetched2.json();
    stopCodeNameMatch = Object.assign({}, ...busStopData.map((a) => ({[a.BusStopCode]: a})));

    renderBarseServe();
  } catch (e) {
    console.error("Error loading:", e);
  }
}

function mapStopCodeToName(code) {
  /**
   * maps bus stop code to corresponding bus stop name in data2
   */
  if (!Number(code)) {
    return code;
  };
  if (stopCodeNameMatch.hasOwnProperty(code)) {
    return stopCodeNameMatch[code].Description;
  } else {
    return code;
  };
  //return mapStopCodeToName(code);
}

function titleCase(s) {
    return s.toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
}

function renderBarseServe() {
  const grid = document.getElementById('bus-list');
  grid.style.display = 'none';
  grid.innerHTML = '';

  const bus_data = data1
    .map(a => ({...a, OriginStopName: mapStopCodeToName(a.OriginCode), DestinationStopName: mapStopCodeToName(a.DestinationCode)}))
    .sort((a, b) => {
      const numA = parseInt(a.ServiceNo, 10) || 1000;
      const numB = parseInt(b.ServiceNo, 10) || 1000;

      return numA - numB;
    });

  bus_data.forEach((bus_datum, index) => {
    //console.log(parseInt(bus_datum.ServiceNo))

    const bus_service = document.createElement('a');
    bus_service.className = `bus-route p ${bus_datum.Operator} ${bus_datum.Category} bus${bus_datum.ServiceNo} dir${bus_datum.Direction}`;
    bus_service.setAttribute('href', `../services/?service=${bus_datum.ServiceNo}`);
    if (bus_datum.LoopDesc == "") {
      bus_service.innerHTML = `
      <div class="serviceTitle" style="${index}">
        <div class="serviceNo">
          Bus ${bus_datum.ServiceNo}
        </div>
        <div class="busOperator">
          ${bus_datum.Operator}
        </div>
      </div>
      <div class="serviceStats">
        <div class="busCat ${bus_datum.Category}">
          ${titleCase(bus_datum.Category.replace('_', ' '))}
        </div>
        <div class="bus_start">
          ${bus_datum.OriginCode} ${bus_datum.OriginStopName}
        </div>
        <div class="bus_dest">
          — ${bus_datum.DestinationCode} ${bus_datum.DestinationStopName}
        </div>
      </div>`;
    } else if (bus_datum.OriginCode === bus_datum.DestinationCode) {
      bus_service.innerHTML = `
      <div class="serviceTitle">
        <div class="serviceNo">
          Bus ${bus_datum.ServiceNo}
        </div>
        <div class="busOperator">
          ${bus_datum.Operator}
        </div>
      </div>
      <div class="serviceStats">
        <div class="busCat ${bus_datum.Category}">
          ${titleCase(bus_datum.Category)}
        </div>
        <div class="bus_start">
          ${bus_datum.OriginCode} ${bus_datum.OriginStopName}
        </div>
        <div class="bus_dest bus_loop">
          ↺ ${bus_datum.LoopDesc}
        </div>
      </div>`;
    } else {
      bus_service.innerHTML = `
      <div class="serviceTitle">
        <div class="serviceNo">
          Bus ${bus_datum.ServiceNo}
        </div>
        <div class="busOperator">
          ${bus_datum.Operator}
        </div>
      </div>
      <div class="serviceStats">
        <div class="busCat ${bus_datum.Category}">
          ${titleCase(bus_datum.Category)}
        </div>
        <div class="bus_start">
          ${bus_datum.OriginCode} ${bus_datum.OriginStopName}
        </div>
        <div class="bus_dest bus_loop">
          ↺ ${bus_datum.LoopDesc}
        </div>
        <div class="bus_dest">
          — ${bus_datum.DestinationCode} ${bus_datum.DestinationStopName}
        </div>
      </div>`;
    }
    grid.appendChild(bus_service);
    
  });
  grid.style.removeProperty('display');
}
//console.log("Hi");
loadFile('../../../static/db/sgbusroute.json', '../../../static/db/sgbusstops.json');


//      <div class="">
//        ${bus_datum.AM_Peak_Freq}
//      </div>
//      <div class="">
//        ${bus_datum.AM_Offpeak_Freq}
//      </div>
//      <div class="">
//        ${bus_datum.PM_Peak_Freq}
//      </div>
//      <div class="">
//        ${bus_datum.PM_Offpeak_Freq}
//      </div>
