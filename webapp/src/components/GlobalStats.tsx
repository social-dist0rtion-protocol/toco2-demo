import React, { useState, useEffect } from "react";
import { Col, Row } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import { LeaderboardResponse, Country } from "../types";
import "./GlobalStats.css";
import "chartjs-plugin-annotation";

type GlobalStatsProps = {
  emissionsByCountry: LeaderboardResponse["emissionsByCountry"];
  treesByCountry: LeaderboardResponse["treesByCountry"];
  countries: { [countryId: string]: Country };
};

const byCountryToGlobal = (byCountry: { [countryId: string]: number }) =>
  Object.values(byCountry).reduce((prev, current) => prev + current, 0);

const GlobalStats = (props: GlobalStatsProps) => {
  const [localStorageLoaded, setLocalStorageLoaded] = useState(false);
  const [co2, setCo2] = useState<{ times: Date[]; values: number[] }>({
    times: [],
    values: []
  });
  const [trees, setTrees] = useState<{ x: Date; y: number }[]>([]);

  // fetch previous data on startup, if we had any
  useEffect(() => {
    console.log("co2: ", localStorage.getItem("co2"));
    console.log(
      "after parsing: ",
      JSON.parse(localStorage.getItem("co2") || '{"times":[],"values":[]}')
    );
    setCo2(
      JSON.parse(localStorage.getItem("co2") || '{"times":[],"values":[]}')
    );
    setTrees(JSON.parse(localStorage.getItem("trees") || "[]"));
    setLocalStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (localStorageLoaded) {
      const globalCO2 = byCountryToGlobal(props.emissionsByCountry);
      const newCO2 = {
        ...co2,
        times: [...co2.times, new Date()],
        values: [...co2.values, globalCO2]
      };
      setCo2(newCO2);
      localStorage.setItem("co2", JSON.stringify(newCO2));
    }
  }, [props.emissionsByCountry]);

  useEffect(() => {
    if (localStorageLoaded) {
      const globalTrees = byCountryToGlobal(props.treesByCountry);
      const newTrees = [...trees, { x: new Date(), y: globalTrees }];
      setTrees(newTrees);
      localStorage.setItem("trees", JSON.stringify(newTrees));
    }
  }, [props.treesByCountry]);

  return (
    <>
      <h4>Global emissions</h4>
      <Row className="global-stats" noGutters>
        <Col>
          <Row>
            <Col>
              <Line
                data={{
                  labels: co2.times,
                  datasets: [
                    { label: "CO2 (Mt)", data: co2.values, pointBorderWidth: 0 }
                  ]
                }}
                options={{
                  animation: { duration: 0 },
                  scales: {
                    xAxes: [
                      {
                        id: "time-axis",
                        type: "time",
                        display: true,
                        gridLines: { display: false },
                        ticks: {
                          source: "data",
                          beginAtZero: false,
                          autoSkip: true
                        },
                        time: { unit: "second", round: "second" }
                      }
                    ],
                    yAxes: [
                      {
                        id: "value-axis",
                        type: "linear",
                        ticks: {
                          suggestedMax: 1300000,
                          suggestedMin: 0,
                          beginAtZero: true
                        }
                      }
                    ]
                  },
                  annotation: {
                    drawTime: "afterDraw",
                    annotations: [
                      {
                        type: "line",
                        mode: "horizontal",
                        scaleID: "value-axis",
                        value: 420000,
                        borderColor: "rgba(253, 106, 2, 0.3)",
                        borderWidth: 2,
                        label: {
                          content: "Warning",
                          enabled: true
                        }
                      },
                      {
                        type: "line",
                        mode: "horizontal",
                        scaleID: "value-axis",
                        value: 1170000,
                        borderColor: "red",
                        borderWidth: 1,
                        label: {
                          content: "OMG",
                          enabled: true
                        }
                      }
                    ]
                  }
                }}
                width={300}
                height={300}
                redraw
              />
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  );
};

export default React.memo(GlobalStats);
