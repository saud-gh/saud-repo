let rawRssiData = [],
  filteredRssiData = [],
  receivedData = [],
  beaconId = 1,
  filtered = false;

const beaconIDs = [1];
const filteredDataCaptions = [
  "RSSI Readings from BLE module",
  "RSSI readings from smartphone",
];
//Get elements
const dataDiv = document.getElementById("rssi-data");
const maxDataSelect = document.getElementById("max-data-select");
const showDataSelect = document.getElementById("show-data-select");

const maxReadingValues = [50, 100, 200, 300, 500, 800, 1200, 1800, 2400, 3000];
// const maxReadingValues = [50, 100, 200, 300, 500, 800, 1200, 1800, 2400, 3000];
let max = maxReadingValues[0];

//Fill the max readings select element with options
maxReadingValues.forEach((val) => {
  const optionEl = document.createElement("option");
  optionEl.setAttribute("value", val);
  optionEl.innerText = val;

  maxDataSelect.appendChild(optionEl);
});
//Re-render the chart when the max number of reading changes
maxDataSelect.addEventListener("change", (event) => {
  max = parseInt(event.target.value, 10);

  //Remove previous chart
  while (dataDiv.firstChild) {
    dataDiv.removeChild(dataDiv.firstChild);
  }

  if (filtered) showFilteredData();
  else showUnfilteredData();
});

//Re-render the charts when
showDataSelect.addEventListener("change", (event) => {
  filtered = event.target.value == "filtered";
  //Remove previous chart
  while (dataDiv.firstChild) {
    dataDiv.removeChild(dataDiv.firstChild);
  }

  if (filtered) showFilteredData();
  else showUnfilteredData();
});

const showUnfilteredData = () => {
  plotChart({
    caption: "Raw RSSI vs Averaged RSSI",
    colors: ["blue"],
    data: receivedData,
  });
};
const showFilteredData = () => {
  const rawRSSI = receivedData[0];
  const averagedRSSI = getAveragedData(rawRSSI);
  //Raw data vs Averaged data
  plotChart({
    caption: "Raw RSSI vs Averaged RSSI",
    colors: ["red", "steelblue"],
    data: [rawRSSI, averagedRSSI],
  });
  //Raw data vs Filtered data
  plotChart({
    caption: "Raw RSSI vs Filtered RSSI (Kalman)",
    colors: ["red", "steelblue"],
    data: [rawRSSI, getFilteredData(rawRSSI)],
  });
  //Averaged data vs Filtered data
  plotChart({
    caption: "Averaged RSSI vs Filtered RSSI (Kalman)",
    colors: ["red", "steelblue", "green"],
    data: [rawRSSI, averagedRSSI, getFilteredData(averagedRSSI)],
  });

  console.log("Averaged =>> ", averagedRSSI);
  console.log("Raw =>> ", rawRSSI);
};

const plotChart = (options) => {
  const { data, caption, colors } = options;
  try {
    if (!data || data.length < 0) throw new Error("No data provided!");

    if (!colors || colors.length < 1) throw new Error("No colors provided!");

    if (!caption) throw new Error("No caption provided!");

    //Slice the data depending on the max
    const slicedData = data.map((dataArr) => {
      return dataArr.slice(0, max - 1);
    });
    // console.log(options);
    //Re-draw the chart
    dataDiv.appendChild(
      Plot.plot({
        height: 700,
        width: 1660,
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

  console.log("Received =>> ", receivedData);
  // console.log(receivedData);
  showUnfilteredData();
};

window.addEventListener("DOMContentLoaded", init);
