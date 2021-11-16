let rawRssiData = [],
  filteredRssiData = [],
  receivedData = [],
  beaconId = 1;

const dataDiv = document.getElementById("rssi-data");
const maxDataSelect = document.getElementById("max-data-select");

const totalReadingValues = [
  50, 100, 200, 300, 500, 800, 1200, 1800, 2400, 3000,
];
let total = totalReadingValues[0];

//Fill the select element with options
totalReadingValues.forEach((val) => {
  const optionEl = document.createElement("option");
  optionEl.setAttribute("value", val);
  optionEl.innerText = val;

  maxDataSelect.appendChild(optionEl);
});
//Re-render the chart when the total number of reading changes
maxDataSelect.addEventListener("change", (event) => {
  total = parseInt(event.target.value, 10);
  plotChart(receivedData);
});

const getFilteredData = (data) => {
  //Define variables
  const R = 0.008; //Low process noise, we assume that noise is cause by measurement
  const Q = 150;
  //
  const kf = new KalmanFilter({ R, Q });

  const filteredData = data.map((val) => {
    return {
      rssi_reading_id: val.rssi_reading_id,
      rssi: kf.filter(val.rssi),
    };
  });

  return filteredData;
};
const plotChart = (data) => {
  const slicedData = data.map((dataArr) => {
    return dataArr.slice(0, total - 1);
  });
  // rawRssiData = data.slice(0, total - 1);
  // filteredRssiData = getFilteredData(rawRssiData);
  //Remove previous chart
  while (dataDiv.firstChild) {
    dataDiv.removeChild(dataDiv.firstChild);
  }
  //Re-draw the chart
  dataDiv.appendChild(
    Plot.plot({
      height: 700,
      width: 1660,
      y: { label: "RSSI" },
      x: { label: "Reading ID" },
      marks: slicedData.map((lineData, i) =>
        Plot.line(lineData, {
          x: (d, ind) => ind + 1,
          y: (d) => d.rssi,
          stroke: i % 2 == 0 ? "red" : "steelblue",
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
  const beaconIDs = [1, 2];
  receivedData = await Promise.all(
    beaconIDs.map(async (id) => await getDataFromDB(id))
  );

  console.log(receivedData);
  plotChart(receivedData);
};

window.addEventListener("DOMContentLoaded", init);
