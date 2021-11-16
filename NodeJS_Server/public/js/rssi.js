let rawRssiData = [],
  filteredRssiData = [],
  receivedData = [],
  beaconId = 1,
  filtered = false;

const beaconIDs = [1, 2];
const filteredDataCaptions = [
  "RSSI Readings from BLE module",
  "RSSI readings from smartphone",
];
//Get elements
const dataDiv = document.getElementById("rssi-data");
const maxDataSelect = document.getElementById("max-data-select");
const showDataSelect = document.getElementById("show-data-select");

const totalReadingValues = [
  50, 100, 200, 300, 500, 800, 1200, 1800, 2400, 3000,
];
let total = totalReadingValues[0];

//Fill the max readings select element with options
totalReadingValues.forEach((val) => {
  const optionEl = document.createElement("option");
  optionEl.setAttribute("value", val);
  optionEl.innerText = val;

  maxDataSelect.appendChild(optionEl);
});
//Re-render the chart when the total number of reading changes
maxDataSelect.addEventListener("change", (event) => {
  total = parseInt(event.target.value, 10);

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
  plotChart({ data: receivedData });
};
const showFilteredData = () => {
  receivedData.forEach((dataArr) => {
    plotChart({
      captions: filteredDataCaptions,
      data: [dataArr, getFilteredData(dataArr)],
    });
  });
};
const getFilteredData = (data) => {
  //Define variables
  const R = 0.008; //Low process noise, we assume that noise is caused by measurement
  const Q = 15;

  const kf = new KalmanFilter({ R, Q });

  const filteredData = data.map((val) => ({
    rssi_reading_id: val.rssi_reading_id,
    rssi: kf.filter(val.rssi),
  }));

  return filteredData;
};
const plotChart = (options) => {
  const { data, captions } = options;
  const slicedData = data.map((dataArr) => {
    return dataArr.slice(0, total - 1);
  });
  console.log(options);
  //Re-draw the chart
  dataDiv.appendChild(
    Plot.plot({
      height: 700,
      width: 1660,
      y: { label: "RSSI" },
      x: { label: "Reading" },
      marks: slicedData.map((lineData, i) =>
        Plot.line(lineData, {
          x: (d, ind) => ind + 1,
          y: (d) => d.rssi,
          stroke: i % 2 == 0 ? "red" : "steelblue",
          caption: captions ? captions[i] : null,
        })
      ),
    })
  );
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

const init = async () => {
  //Get data for both beacon and phone
  receivedData = await Promise.all(
    beaconIDs.map(async (id) => await getDataFromDB(id))
  );

  console.log(receivedData);
  showUnfilteredData();
};

window.addEventListener("DOMContentLoaded", init);
