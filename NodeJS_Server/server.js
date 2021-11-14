const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const express = require("express");
const app = express();

require("dotenv").config();

const port = process.env.PORT || 8009;
const hostname = process.env.HOST || "localhost";

const openDB = () =>
  new sqlite3.Database("./ble_positioning.sql", (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Connected to the ble_positioning database.");
  });

//For request body parsing
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "index.html"));
});

const getLocationFromCamera = (beaconId) => {
  return {
    x: 0,
    y: 0,
  };
};

//TODO: Refactor, Refactor, Refacor
app.post("/send_rssi", (req, res) => {
  try {
    const { body } = req;

    if (!body) {
      throw new Error("Not enough data...");
    }
    // Open db
    const db = openDB();
    //Get beacon_id based on major and minor values
    db.get(
      "SELECT beacon_id FROM beacons WHERE minor=$min AND major=$maj",
      {
        $min: body.minor,
        $maj: body.major,
      },
      (err, row) => {
        if (err) {
          throw new Error(err.message);
        }

        if (!row) {
          throw new Error("Beacon id was not found!");
        }

        const { beacon_id } = row;

        //Get beacon location depending on beacon_id and timeframe
        const timeframe = 10 * 1000; //In milliseconds
        const currentTime = Date.now();
        //Earlier Timestamp
        const earierTimestamp = currentTime - timeframe;

        db.get(
          "SELECT * FROM beacon_locations WHERE beacon_id=$bid AND timestamp>$ts",
          {
            $bid: beacon_id,
            $ts: earierTimestamp,
          },
          (err, row) => {
            if (err) {
              throw new Error(err.message);
            }
            //Check if beacon location exists in db
            if (row) {
              //Get location id from db if it exists
              const { beacon_loc_id } = row;
              console.log("Location id exists", row);
              //Store rssi reading in db
              db.run(
                "INSERT INTO rssi_readings (beacon_loc_id, beacon_receiver_id, rssi) VALUES ($blid, $brid, $rssi)",
                {
                  $blid: beacon_loc_id,
                  $brid: body.beaconReceiverId,
                  $rssi: body.rssi,
                }
              );
            } else {
              //Get location from camera system if location id doesn't exist in db [Return 0 initially]
              const location = getLocationFromCamera(beacon_id);
              //Store location in db
              const timestamp = Date.now();
              console.log(
                "Location id not here, will create new one. This is timestamp -> ",
                timestamp
              );
              db.run(
                `
                  INSERT INTO beacon_locations (beacon_id, location_x, location_y, timestamp)
                  VALUES ($bid, $locx, $locy, $ts);
                  `,
                {
                  $bid: beacon_id,
                  $locx: location.x,
                  $locy: location.y,
                  $ts: timestamp,
                },
                (err) => {
                  if (err) {
                    throw new Error(err.message);
                  }

                  //Get location id
                  db.get(
                    "SELECT * FROM beacon_locations WHERE beacon_id=$bid AND timestamp=$ts",
                    {
                      $bid: beacon_id,
                      $ts: timestamp,
                    },
                    (err, row) => {
                      if (err) {
                        throw new Error(err.message);
                      }

                      // Store rssi reading in db
                      db.run(
                        "INSERT INTO rssi_readings (beacon_loc_id, beacon_receiver_id,rssi) VALUES ($blid, $brid, $rssi)",
                        {
                          $blid: row.beacon_loc_id,
                          $brid: body.beaconReceiverId,
                          $rssi: body.rssi,
                        }
                      );
                    }
                  );
                }
              );
            }
            //Close db
            db.close();
          }
        );
      }
    );

    res.status(200).json({
      data: {
        readingAdded: true,
      },
      message: "RSSI reading added",
    });
  } catch (error) {
    console.log(error.message);
    res.status(200).json({
      data: {
        readingAdded: true,
      },
      message: error.message,
    });
  }
});

app.listen(port, hostname, () => {
  console.log(`Running at http://${hostname}:${port}`);
});
