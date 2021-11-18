let rawRssiData = [],
  filteredRssiData = [],
  receivedData = [],
  beaconId = 1,
  filtered = false,
  time = 20000;

const beaconIDs = [1];

//Get elements
const dataDiv = document.getElementById("rssi-data");
const timeRange = document.getElementById("time-range");
const timeValue = document.getElementById("time-value");

timeValue.innerText = time + "ms";
//Re-draw charts when time is changes
timeRange.addEventListener("input", (event) => {
  time = event.target.value;

  timeValue.innerText = time + "ms";
  showFilteredData();
});

const showFilteredData = () => {
  const rawRSSI = receivedData[0];
  const averagedRSSI = getAveragedData(rawRSSI);
  //Remove previous charts
  while (dataDiv.firstChild) {
    dataDiv.removeChild(dataDiv.firstChild);
  }
  //Raw Data vs Averaged Data
  plotChart({
    caption: "Raw RSSI vs Averaged RSSI",
    colors: ["red", "steelblue"],
    data: [rawRSSI, averagedRSSI],
  });
  //Raw Data vs Filtered Data
  plotChart({
    caption: "Raw RSSI vs Filtered RSSI (Kalman)",
    colors: ["red", "steelblue"],
    data: [rawRSSI, getFilteredData(rawRSSI)],
  });
  //Averaged Data vs Filtered Data
  plotChart({
    caption: "Averaged RSSI vs Filtered RSSI (Kalman)",
    colors: ["red", "steelblue", "green"],
    data: [rawRSSI, averagedRSSI, getFilteredData(averagedRSSI)],
  });

  // console.log("Averaged =>> ", averagedRSSI);
  // console.log("Raw =>> ", rawRSSI);
};

const plotChart = (options) => {
  const { data, caption, colors } = options;
  try {
    if (!data || data.length < 0) throw new Error("No data provided!");

    if (!colors || colors.length < 1) throw new Error("No colors provided!");

    if (!caption) throw new Error("No caption provided!");

    //Slice the data depending on the time
    const slicedData = data.map((dataArr) => {
      return dataArr.filter((dPoint) => dPoint.time <= time);
    });
    //Re-draw the chart
    dataDiv.appendChild(
      Plot.plot({
        height: 700,
        width: 1660,
        grid: true,
        y: { label: "RSSI (dB)" },
        x: { label: "Time (ms)" },
        caption: caption,
        marks: slicedData.map((lineData, i) =>
          Plot.line(lineData, {
            x: (d) => d.time,
            y: (d) => d.rssi,
            stroke: colors[i],
          })
        ),
      })
    );
  } catch (error) {
    console.log(error.message);
  }
};

const getDataFromDB = async (beaconId) => {
  const url = "http://localhost:8009";
  try {
    const { data } = await (await fetch(url + "/get_rssi/" + beaconId)).json();

    if (!data?.rows) {
      throw new Error("No data available...");
    }

    return data.rows;
  } catch (error) {
    console.log(error.message);
    return null;
  }
};

const getTime = (dataArray) => {
  return dataArray.map(({ timestamp, ...rest }, i) => {
    if (i === 0) {
      return {
        ...rest,
        time: 100,
      };
    } else {
      return {
        ...rest,
        time: 100 * i,
      };
    }
  });
};

const init = async () => {
  //Get data for both beacon and phone
  receivedData = (
    await Promise.all(beaconIDs.map(async (id) => await getDataFromDB(id)))
  ).map((dataArr) => getTime(dataArr));

  showFilteredData();
};

window.addEventListener("DOMContentLoaded", init);
