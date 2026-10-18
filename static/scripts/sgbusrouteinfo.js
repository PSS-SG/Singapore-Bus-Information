let data1 = [];
let busStopData = [];
let busStopSequence = [];
let stopCodeNameMatch = {};
const urlParams = new URLSearchParams(window.location.search);
let serviceInfoNo = ''

async function loadFile(fileName1, fileName2, fileName3) {
  try {
    const Fetched1 = await fetch(fileName1);
    const Fetched2 = await fetch(fileName2);
    const Fetched3 = await fetch(fileName3);
    data1 = await Fetched1.json();
    busStopData = await Fetched2.json();
    busStopSequence = await Fetched3.json();
    stopCodeNameMatch = Object.assign({}, ...busStopData.map((a) => ({[a.BusStopCode]: a})));

    renderBusServiceRoute();
  } catch (e) {
    console.error("Error loading:", e);
  }
};

function mapStopCodeToName(code, param='Description') {
  /**
   * maps bus stop code to corresponding bus stop name in data2
   */
  if (!Number(code)) {
    return code;
  };
  if (stopCodeNameMatch.hasOwnProperty(code)) {
    let match = stopCodeNameMatch[code];
    if (match.hasOwnProperty(param)) {
      return stopCodeNameMatch[code][param];
    } else {return code;}
  } else {
    return code;
  };
  //return mapStopCodeToName(code);
}

function busStopRender(busStop, include = null) {
  const busStopHTML = document.createElement('a');
  const roadName = document.createElement('b');
  const busStopCode = document.createElement('b');
  const busStopName = document.createElement('b');
  const busStopDist = document.createElement('p');
  busStopHTML.setAttribute('href', `../busstop?busstopcode=${busStop.BusStopCode}`);
  busStopHTML.setAttribute('title', `${busStop.BusStopCode} ${busStop.RoadName}`);
  busStopHTML.classList.add('stop');
  roadName.innerHTML = `${busStop.RoadName}`;
  busStopCode.innerHTML = `${busStop.BusStopCode}`;
  busStopName.innerHTML = `${busStop.Description}`;
  busStopDist.innerHTML = `${busStop.Distance} km`;
  busStopHTML.setAttribute('--distance', `${busStop.Distance}`);
  roadName.classList.add('roadname');
  busStopCode.classList.add('busstopcode');
  busStopName.classList.add('busstopname');
  busStopHTML.appendChild(roadName);
  busStopHTML.appendChild(busStopCode);
  busStopHTML.appendChild(busStopName);
  busStopHTML.appendChild(busStopDist);
  return busStopHTML
}

function renderBusServiceRoute() {
  const busInfo = document.getElementById('bus-info');
  const serviceTitle = document.getElementById('bus-service-title');
  const stopList = document.getElementById('bus-stops-list');
  const serviceSummary = data1
    .map(a => ({...a, OriginStopName: mapStopCodeToName(a.OriginCode), DestinationStopName: mapStopCodeToName(a.DestinationCode)}))
    .filter(a => {return a.ServiceNo.toUpperCase() === serviceInfoNo.toUpperCase()});
  if (serviceSummary.length === 0) {
    serviceTitle.innerHTML = 'Invalid Service Selected';
    return;
  }
  serviceInfoNo = serviceSummary[0].ServiceNo;
  serviceTitle.innerHTML = `Bus Service ${serviceInfoNo}`;
  stopList.style.display = 'none';

  let bus_stop_data_dir1 = busStopSequence
    .map(a => ({...a, Description: mapStopCodeToName(a.BusStopCode), RoadName: mapStopCodeToName(a.BusStopCode, 'RoadName')}))
    .sort((a, b) => a.Distance - b.Distance)
    .filter(a => a.ServiceNo === serviceInfoNo && a.Direction === 1);
  
  let bus_stop_data_dir2 = busStopSequence
    .map(a => ({...a, Description: mapStopCodeToName(a.BusStopCode), RoadName: mapStopCodeToName(a.BusStopCode, 'RoadName')}))
    .sort((a, b) => a.Distance - b.Distance)
    .filter(a => a.ServiceNo === serviceInfoNo && a.Direction === 2);

  //Standard Looping Service
  if (bus_stop_data_dir2.length === 0 && ((serviceSummary[0].LoopDesc !== '' && serviceSummary[0].LoopDesc !== bus_stop_data_dir1[bus_stop_data_dir1.length - 1].RoadName) || bus_stop_data_dir1[bus_stop_data_dir1.length - 1].BusStopCode.slice(0, -1) === bus_stop_data_dir1[0].BusStopCode.slice(0, -1))) {
    let theLoop = bus_stop_data_dir1.filter(a => mapStopCodeToName(a.BusStopCode, 'RoadName') === serviceSummary[0].LoopDesc);
    let bus_stop_data_dir3;
    if (theLoop.length !== 0 && (theLoop[theLoop.length -1].StopSequence - theLoop[0].StopSequence + 1) === theLoop.length) {
      bus_stop_data_dir2 = bus_stop_data_dir1.filter(a => a.StopSequence > theLoop[theLoop.length -1].StopSequence);
      bus_stop_data_dir3 = bus_stop_data_dir1.filter(a => a.StopSequence < theLoop[0].StopSequence);
    } else {
      theLoop = [];
      bus_stop_data_dir2 = bus_stop_data_dir1.slice(bus_stop_data_dir1.length / 2);
      bus_stop_data_dir3 = bus_stop_data_dir1.slice(0, bus_stop_data_dir1.length / 2);
    }
    let dir2i;
    let dir3i;
    if (bus_stop_data_dir1[0].BusStopCode === bus_stop_data_dir1[bus_stop_data_dir1.length - 1].BusStopCode) {
      let origin_stop = bus_stop_data_dir1[0];
      const row = document.createElement('tr');
      const origin_cell = document.createElement('td');
      origin_cell.classList.add('stop');
      origin_cell.classList.add('originStop');
      origin_cell.setAttribute('colspan', '3');
      origin_cell.appendChild(busStopRender(origin_stop));
      row.appendChild(origin_cell);
      stopList.appendChild(row);

      dir2i = bus_stop_data_dir2.length - 2;
      dir3i = 1;
    } else {
      dir2i = bus_stop_data_dir2.length - 1;
      dir3i = 0;
    }
    while (dir2i !== -1 && dir3i !== bus_stop_data_dir3.length) {
      const row = document.createElement('tr');
      const returnBS = bus_stop_data_dir2[dir2i];
      const leaveBS = bus_stop_data_dir3[dir3i];
      const returnStopEl = document.createElement('td');
      const equalsEl = document.createElement('td');
      const leaveStopEl = document.createElement('td');
      equalsEl.innerHTML = `opposite bus_stops`;
      if (returnBS.BusStopCode.slice(0, -1) === leaveBS.BusStopCode.slice(0, -1)) {
        returnStopEl.appendChild(busStopRender(returnBS));
        leaveStopEl.appendChild(busStopRender(leaveBS));
        returnStopEl.classList.add('stop');
        leaveStopEl.classList.add('stop');
        equalsEl.classList.add((returnBS.BusStopCode === leaveBS.BusStopCode) ? 'equal' : 'opposite');
        if (dir3i === 0) {leaveStopEl.classList.add('start');}
        if (dir2i === bus_stop_data_dir2.length -1) {returnStopEl.classList.add('start');}
        row.appendChild(returnStopEl);
        row.appendChild(equalsEl);
        row.appendChild(leaveStopEl);
      } else {
        let returnLeave = bus_stop_data_dir3.slice(dir3i).filter(a => a.BusStopCode.slice(0, -1) === returnBS.BusStopCode.slice(0, -1)); //checks if leave in returnList
        let leaveReturn = bus_stop_data_dir2.slice(0, dir2i).filter(a => a.BusStopCode.slice(0, -1) === leaveBS.BusStopCode.slice(0, -1)); //checks if return in leaveList
        if (returnLeave.length === 0 && leaveReturn.length !== 0) {
          returnStopEl.appendChild(busStopRender(returnBS));
          returnStopEl.classList.add('stop');
          if (dir3i === 0) {leaveStopEl.classList.add('none');}
          if (dir2i === bus_stop_data_dir2.length -1) {returnStopEl.classList.add('start');}
          row.appendChild(returnStopEl);
          row.appendChild(equalsEl);
          row.appendChild(leaveStopEl);
          stopList.appendChild(row);
          dir2i -= 1;
          continue;
        } else if (returnLeave.length !== 0 && leaveReturn.length === 0) {
          leaveStopEl.appendChild(busStopRender(leaveBS));
          leaveStopEl.classList.add('stop');
          if (dir3i === 0) {leaveStopEl.classList.add('start');}
          if (dir2i === bus_stop_data_dir2.length -1) {returnStopEl.classList.add('none');}
          row.appendChild(returnStopEl);
          row.appendChild(equalsEl);
          row.appendChild(leaveStopEl);
          stopList.appendChild(row);
          dir3i += 1;
          continue;
        } else {
          returnStopEl.appendChild(busStopRender(returnBS));
          leaveStopEl.appendChild(busStopRender(leaveBS));
          returnStopEl.classList.add('stop');
          leaveStopEl.classList.add('stop');
          if (dir3i === 0) {leaveStopEl.classList.add('start');}
          if (dir2i === bus_stop_data_dir2.length -1) {returnStopEl.classList.add('start');}
          row.appendChild(returnStopEl);
          row.appendChild(equalsEl);
          row.appendChild(leaveStopEl);
        }
      }
      stopList.appendChild(row);
      dir2i -= 1;
      dir3i += 1;
    }
    let daLoopPoint = bus_stop_data_dir3.slice(dir3i).concat(theLoop, bus_stop_data_dir2.slice(0, dir2i+1));
    let daLoopLower = 0;
    let daLoopUpper = daLoopPoint.length - 1;
    while (daLoopUpper > daLoopLower) {
      const row = document.createElement('tr');
      const returnBS = daLoopPoint[daLoopUpper];
      const leaveBS = daLoopPoint[daLoopLower];
      const returnStopEl = document.createElement('td');
      const equalsEl = document.createElement('td');
      equalsEl.innerHTML = `opposite bus_stops`;
      const leaveStopEl = document.createElement('td');
      if (returnBS.BusStopCode.slice(0, -1) === leaveBS.BusStopCode.slice(0, -1)) {
        returnStopEl.appendChild(busStopRender(returnBS));
        leaveStopEl.appendChild(busStopRender(leaveBS));
        returnStopEl.classList.add('stop');
        leaveStopEl.classList.add('stop');
        equalsEl.classList.add((returnBS.BusStopCode === leaveBS.BusStopCode) ? 'equal' : 'opposite');
        if (dir3i === bus_stop_data_dir3.length -1) {leaveStopEl.classList.add('fin');}
        if (dir2i === 0) {returnStopEl.classList.add('fin');}
        if (dir3i === 0) {leaveStopEl.classList.add('start');}
        if (dir2i === bus_stop_data_dir2.length -1) {returnStopEl.classList.add('start');}
        row.appendChild(returnStopEl);
        row.appendChild(equalsEl);
        row.appendChild(leaveStopEl);
      } else {
        let returnLeave = daLoopPoint.slice(daLoopLower, daLoopUpper).filter(a => a.BusStopCode.slice(0, -1) === returnBS.BusStopCode.slice(0, -1)); //checks if leave in returnList
        let leaveReturn = daLoopPoint.slice(daLoopLower +1, daLoopUpper).filter(a => a.BusStopCode.slice(0, -1) === leaveBS.BusStopCode.slice(0, -1)); //checks if return in leaveList
        if (returnLeave.length === 0 && leaveReturn.length !== 0) {
          returnStopEl.appendChild(busStopRender(returnBS));
          returnStopEl.classList.add('stop');
          row.appendChild(returnStopEl);
          row.appendChild(equalsEl);
          row.appendChild(leaveStopEl);
          stopList.appendChild(row);
          daLoopUpper -= 1;
          continue;
        } else if (returnLeave.length !== 0 && leaveReturn.length === 0) {
          leaveStopEl.appendChild(busStopRender(leaveBS));
          leaveStopEl.classList.add('stop');
          row.appendChild(returnStopEl);
          row.appendChild(equalsEl);
          row.appendChild(leaveStopEl);
          stopList.appendChild(row);
          daLoopLower += 1;
          continue;
        } else {
          returnStopEl.appendChild(busStopRender(returnBS));
          leaveStopEl.appendChild(busStopRender(leaveBS));
          returnStopEl.classList.add('stop');
          leaveStopEl.classList.add('stop');
          row.appendChild(returnStopEl);
          row.appendChild(equalsEl);
          row.appendChild(leaveStopEl);
        }
      }
      stopList.appendChild(row);
      daLoopUpper -= 1;
      daLoopLower += 1;
    }
    if (daLoopLower === daLoopUpper) {
      const finalBS = daLoopPoint[daLoopUpper];
      let row;
      if (finalBS.RoadName === serviceSummary[0].LoopDesc) {
        row = document.createElement('tr');
        const desto_cell = document.createElement('td');
        desto_cell.classList.add('destoStop');
        desto_cell.classList.add('stop');
        desto_cell.setAttribute('colspan', '3');
        desto_cell.appendChild(busStopRender(finalBS));
        row.appendChild(desto_cell);
        stopList.appendChild(row);
      } else {
        row = document.createElement('tr');
        const returnStopEl = document.createElement('td');
        const equalsEl = document.createElement('td');
        equalsEl.innerHTML = `opposite bus_stops`;
        const leaveStopEl = document.createElement('td');
        leaveStopEl.appendChild(busStopRender(finalBS));
        leaveStopEl.classList.add('stop');
        row.appendChild(returnStopEl);
        row.appendChild(equalsEl);
        row.appendChild(leaveStopEl);
        stopList.appendChild(row);
        const lastRow = document.createElement('tr');
        lastRow.innerHTML = `<td colspan='3' class='destoStop'></td>`
        stopList.appendChild(lastRow);
      }
    } else {
      const lastRow = document.createElement('tr');
      lastRow.innerHTML = `<td colspan='3' class='destoStop'></td>`;
      stopList.appendChild(lastRow);
    }
    stopList.style.display = '';
    return;
  }

  // Unidirectional Service
  if (bus_stop_data_dir2.length === 0 && bus_stop_data_dir1[bus_stop_data_dir1.length - 1].BusStopCode.slice(0, -1) !== bus_stop_data_dir1[0].BusStopCode.slice(0, -1)) {
    const uniBusStopList = document.createElement('ul');
    const stopList = document.getElementById('bus-stops-list');
    uniBusStopList.id = stopList.id;
    stopList.remove();
    bus_stop_data_dir1.forEach(leaveBS => {
      const uniBusyStop = document.createElement('li');
      uniBusyStop.appendChild(busStopRender(leaveBS));
      uniBusyStop.classList.add('stop');
      uniBusStopList.appendChild(uniBusyStop);
    })
    busInfo.appendChild(uniBusStopList);
    stopList.style.display = '';
    return;
  }

  //Typical Bi-Directional Service
  if (bus_stop_data_dir2.length !== 0) {
    let dir1i = 0;
    let dir2i = bus_stop_data_dir2.length - 1;
    let dir1l = bus_stop_data_dir1.length;
    let dir2l = -1
    if (bus_stop_data_dir1[0].BusStopCode === bus_stop_data_dir2[bus_stop_data_dir2.length - 1].BusStopCode) {
      let origin_stop = bus_stop_data_dir1[0];
      const row = document.createElement('tr');
      const origin_cell = document.createElement('td');
      origin_cell.classList.add('stop');
      origin_cell.classList.add('originStop');
      origin_cell.setAttribute('colspan', '3');
      origin_cell.appendChild(busStopRender(origin_stop));
      row.appendChild(origin_cell);
      stopList.appendChild(row);

      dir2i -= 1;
      dir1i += 1;
    }
    let destoRow;
    if (bus_stop_data_dir2[0].BusStopCode === bus_stop_data_dir1[bus_stop_data_dir1.length - 1].BusStopCode) {
      let desto_stop = bus_stop_data_dir2[0];
      destoRow = document.createElement('tr');
      const desto_cell = document.createElement('td');
      desto_cell.classList.add('destoStop');
      desto_cell.classList.add('stop');
      desto_cell.setAttribute('colspan', '3');
      desto_cell.appendChild(busStopRender(desto_stop));
      destoRow.appendChild(desto_cell);

      dir1l -= 1;
      dir2l += 1;
    }
    while (dir2i !== dir2l && dir1i !== dir1l) {
      const row = document.createElement('tr');
      const returnBS = bus_stop_data_dir2[dir2i];
      const leaveBS = bus_stop_data_dir1[dir1i];
      const returnStopEl = document.createElement('td');
      const equalsEl = document.createElement('td');
      const leaveStopEl = document.createElement('td');
      equalsEl.innerHTML = `opposite bus_stops`;
      if (returnBS.BusStopCode.slice(0, -1) === leaveBS.BusStopCode.slice(0, -1)) {
        returnStopEl.appendChild(busStopRender(returnBS));
        leaveStopEl.appendChild(busStopRender(leaveBS));
        returnStopEl.classList.add('stop');
        leaveStopEl.classList.add('stop');
        equalsEl.classList.add((returnBS.BusStopCode === leaveBS.BusStopCode) ? 'equal' : 'opposite');
        if (dir1i === bus_stop_data_dir1.length -1) {leaveStopEl.classList.add('fin');}
        if (dir2i === 0) {returnStopEl.classList.add('fin');}
        if (dir1i === 0) {leaveStopEl.classList.add('start');}
        if (dir2i === bus_stop_data_dir2.length -1) {returnStopEl.classList.add('start');}
        row.appendChild(returnStopEl);
        row.appendChild(equalsEl);
        row.appendChild(leaveStopEl);
      } else {
        let returnLeave = bus_stop_data_dir1.slice(dir1i).filter(a => a.BusStopCode.slice(0, -1) === returnBS.BusStopCode.slice(0, -1)); //checks if leave in returnList
        let leaveReturn = bus_stop_data_dir2.slice(0, dir2i).filter(a => a.BusStopCode.slice(0, -1) === leaveBS.BusStopCode.slice(0, -1)); //checks if return in leaveList
        if (returnLeave.length === 0 && leaveReturn.length !== 0) {
          returnStopEl.appendChild(busStopRender(returnBS));
          returnStopEl.classList.add('stop');
          if (dir1i === 0) {leaveStopEl.classList.add('none');}
          if (dir2i === bus_stop_data_dir2.length -1) {returnStopEl.classList.add('start');}
          row.appendChild(returnStopEl);
          row.appendChild(equalsEl);
          row.appendChild(leaveStopEl);
          stopList.appendChild(row);
          dir2i -= 1;
          continue;
        } else if (returnLeave.length !== 0 && leaveReturn.length === 0) {
          leaveStopEl.appendChild(busStopRender(leaveBS));
          leaveStopEl.classList.add('stop');
          if (dir1i === 0) {leaveStopEl.classList.add('start');}
          if (dir2i === bus_stop_data_dir2.length -1) {returnStopEl.classList.add('none');}
          row.appendChild(returnStopEl);
          row.appendChild(equalsEl);
          row.appendChild(leaveStopEl);
          stopList.appendChild(row);
          dir1i += 1;
          continue;
        } else {
          returnStopEl.appendChild(busStopRender(returnBS));
          leaveStopEl.appendChild(busStopRender(leaveBS));
          if (dir1i === bus_stop_data_dir1.length -1) {leaveStopEl.classList.add('fin');}
          if (dir2i === 0) {returnStopEl.classList.add('fin');}
          if (dir1i === 0) {leaveStopEl.classList.add('start');}
          if (dir2i === bus_stop_data_dir2.length - 1) {returnStopEl.classList.add('start');}
          returnStopEl.classList.add('stop');
          leaveStopEl.classList.add('stop');
          row.appendChild(returnStopEl);
          row.appendChild(equalsEl);
          row.appendChild(leaveStopEl);
        }
      }
      stopList.appendChild(row);
      dir2i -= 1;
      dir1i += 1;
    }
    if (dir2i === dir2l) {
      while (dir1i !== dir1l) {
        const leaveBS = bus_stop_data_dir1[dir1i];
        const returnStopEl = document.createElement('td');
        const equalsEl = document.createElement('td');
        const row = document.createElement('tr');
        const leaveStopEl = document.createElement('td');
        equalsEl.innerHTML = `opposite bus_stops`;
        if (destoRow === undefined) {returnStopEl.classList.add('none');}
        leaveStopEl.appendChild(busStopRender(leaveBS));
        if (dir1i === bus_stop_data_dir1.length -1) {
          leaveStopEl.classList.add('fin');
        }
        leaveStopEl.classList.add('stop');
        row.appendChild(returnStopEl);
        row.appendChild(equalsEl);
        row.appendChild(leaveStopEl);
        stopList.appendChild(row);
        dir1i += 1;
      }
    } else if (dir1i === dir1l) {
      while (dir2i !== dir2l) {
        const returnBS = bus_stop_data_dir2[dir2i];
        const equalsEl = document.createElement('td');
        const leaveStopEl = document.createElement('td');
        const row = document.createElement('tr');
        const returnStopEl = document.createElement('td');
        equalsEl.innerHTML = `opposite bus_stops`;
        if (destoRow === undefined) {leaveStopEl.classList.add('none');}
        returnStopEl.appendChild(busStopRender(returnBS));
        if (dir2i === 0) {
          returnStopEl.classList.add('fin');
        }
        returnStopEl.classList.add('stop');
        row.appendChild(returnStopEl);
        row.appendChild(equalsEl);
        row.appendChild(leaveStopEl);
        stopList.appendChild(row);
        dir2i -= 1;
      }
    }
    if (destoRow !== undefined) {
      stopList.appendChild(destoRow);
    }
    stopList.style.display = '';
    return;
  }

  //Final Fallback?
  if (bus_stop_data_dir2[bus_stop_data_dir2.length - 1].BusStopCode === bus_stop_data_dir1[0].BusStopCode) {
    let origin_stop = bus_stop_data_dir1[0];
    bus_stop_data_dir1.splice(start = 1);
    bus_stop_data_dir2.splice(end = bus_stop_data_dir2.length - 1);
    const row = document.createElement('tr');
    const origin_cell = document.createElement('td');
    origin_cell.classList.add('stop');
    origin_cell.classList.add('originStop');
    origin_cell.setAttribute('colspan', '3');
    origin_cell.appendChild(busStopRender(origin_stop));
    row.appendChild(origin_cell);
    stopList.appendChild(row);
  }

  if (bus_stop_data_dir2.length === 0) {
    bus_stop_data_dir1.slice(1, -2).forEach(bus_stop_datum => {
      const row = document.createElement('tr');
      stopList.appendChild(row);
    })
  }
  stopList.style.display = '';
}

if (urlParams.has('service')) {
  serviceInfoNo = urlParams.get('service');
} else {
  window.location.href = '../list';
}

loadFile('../../../static/db/sgbusroute.json', '../../../static/db/sgbusstops.json', '../../../static/db/sgbusstopsequence.json');