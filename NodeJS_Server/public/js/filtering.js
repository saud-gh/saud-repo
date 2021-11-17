const getAveragedData = (data) => {
  let recentReadings = [],
    filteredData = [];

  data.forEach((dPoint, i) => {
    if (recentReadings.length == 10) {
      //Calculate the mean, rssiMean
      const sum = recentReadings.reduce((acc, { rssi }) => acc + rssi, 0);
      const rssiMean = sum / 10;
      //Calculate the standard deviation, rssiStd
      const devs = recentReadings.map(({ rssi }) => rssi - rssiMean); //Deviations
      const sqrDevs = devs.map((dev) => dev * dev); //Squared deviations
      const sumOfSqrDev = sqrDevs.reduce((acc, val) => acc + val, 0); //Sum of squared deviations
      const rssiStd = Math.sqrt(sumOfSqrDev / 9);
      //Remove readings below (rssiMean - 2 x rssiStd)
      const shouldRemove = (rssi) => rssi < rssiMean - 2 * rssiStd;
      const filteredRecentReadings = recentReadings.filter(
        ({ rssi }) => !shouldRemove(rssi)
      );
      //   console.log("Recent Readings", recentReadings);
      //   console.log("STD", rssiStd);
      //   console.log("Mean", rssiMean);
      //   console.log("Filtered", filteredRecentReadings);
      //   console.log("---------------------------------------------------------");
      //   console.log(dPoint.time);
      //Re-calculate the RSSI average for the remaining readings
      const rssiAverage =
        filteredRecentReadings.reduce((acc, { rssi }) => acc + rssi, 0) / 10;
      //Push the RSSI value to filteredData
      filteredData.push({ rssi: rssiAverage, time: dPoint.time });
      //Empty the recent readings
      recentReadings = [];
    }
    recentReadings.push(dPoint);
  });

  return filteredData;
};
const getFilteredData = (data) => {
  //Define variables
  const R = 0.008; //Low process noise, we assume that noise is caused by measurement
  const Q = 15;

  const kf = new KalmanFilter({ R, Q });

  const filteredData = data.map((val) => ({
    rssi_reading_id: val.rssi_reading_id,
    rssi: kf.filter(val.rssi),
    time: val.time,
  }));

  return filteredData;
};
