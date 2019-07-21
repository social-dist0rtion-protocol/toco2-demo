import React, { useState, useEffect } from "react";
import { Col, Row } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import { LeaderboardResponse } from "../types";
import "./GlobalStats.css";
import "chartjs-plugin-annotation";

type GlobalStatsProps = {
  emissionsByCountry: LeaderboardResponse["emissionsByCountry"];
  treesByCountry: LeaderboardResponse["treesByCountry"];
};

type TimeSeries = {
  times: Date[];
  values: number[];
};

const COMPACT_INTERVAL_SECONDS = 60;

const byCountryToGlobal = (byCountry: { [countryId: string]: number }) =>
  Object.values(byCountry).reduce((prev, current) => prev + current, 0);

const GlobalStats = (props: GlobalStatsProps) => {
  const [localStorageLoaded, setLocalStorageLoaded] = useState(false);
  const [co2, setCO2] = useState<TimeSeries>({ times: [], values: [] });
  const [trees, setTrees] = useState<TimeSeries>({ times: [], values: [] });
  const [netCO2, setNetCO2] = useState<TimeSeries>({ times: [], values: [] });
  const [lastCompacted, setLastCompacted] = useState(new Date(0));

  const computeNetCO2 = (co2Points: TimeSeries, treePoints: TimeSeries) => {
    const initialNetCO2: TimeSeries = { times: [], values: [] };

    maybeCompactPoints(co2Points, treePoints);

    for (
      let i = 0;
      i < Math.min(co2Points.values.length, treePoints.values.length);
      i++
    ) {
      initialNetCO2.times.push(co2.times[i]);
      initialNetCO2.values.push(co2.values[i] - trees.values[i]);
    }

    setNetCO2(initialNetCO2);
  };

  const maybeCompactPoints = (
    co2Points: TimeSeries,
    treePoints: TimeSeries
  ) => {
    // TODO instead of doing this, always compare the latest values
    // with the previous ones, and only keep the latest point
    // in case values didn't change
    if (
      !co2Points.values.length ||
      !treePoints.values.length ||
      new Date().getTime() - lastCompacted.getTime() <=
        COMPACT_INTERVAL_SECONDS * 1000
    )
      return;

    const newCO2: TimeSeries = { times: [], values: [] };
    const newTrees: TimeSeries = { times: [], values: [] };

    let lastCO2 = -666;
    let lastTrees = -666;

    for (
      let i = 0;
      i < Math.min(co2Points.values.length, treePoints.values.length) - 1;
      i++
    ) {
      const co2Value = co2Points.values[i];
      const treesValue = treePoints.values[i];

      if (co2Value !== lastCO2 || treesValue !== lastTrees) {
        newCO2.times.push(co2Points.times[i]);
        newTrees.times.push(treePoints.times[i]);
        newCO2.values.push(co2Value);
        newTrees.values.push(treesValue);
        lastCO2 = co2Value;
        lastTrees = treesValue;
      }
    }

    newCO2.times.push(co2Points.times[co2Points.times.length - 1]);
    newTrees.times.push(treePoints.times[treePoints.times.length - 1]);
    newCO2.values.push(co2Points.values[co2Points.values.length - 1]);
    newTrees.values.push(treePoints.values[treePoints.values.length - 1]);

    setLastCompacted(new Date());
    setCO2(newCO2);
    setTrees(newTrees);
  };

  // fetch previous data on startup, if we had any
  useEffect(() => {
    const co2: TimeSeries = JSON.parse(
      localStorage.getItem("co2") || '{"times":[],"values":[]}'
    );
    const trees: TimeSeries = JSON.parse(
      localStorage.getItem("trees") || '{"times":[],"values":[]}'
    );

    maybeCompactPoints(co2, trees);
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
      setCO2(newCO2);
      localStorage.setItem("co2", JSON.stringify(newCO2));
      if (co2.values.length === trees.values.length) computeNetCO2(co2, trees);
    }
  }, [props.emissionsByCountry]);

  useEffect(() => {
    if (localStorageLoaded) {
      const globalTrees = byCountryToGlobal(props.treesByCountry);
      const newTrees = {
        ...trees,
        times: [...trees.times, new Date()],
        values: [...trees.values, globalTrees]
      };
      setTrees(newTrees);
      localStorage.setItem("trees", JSON.stringify(newTrees));
      if (co2.values.length === trees.values.length) computeNetCO2(co2, trees);
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
                  labels: netCO2.times,
                  datasets: [
                    {
                      label: "CO₂ (Mt)",
                      data: netCO2.values,
                      pointBorderWidth: 0
                    }
                  ]
                }}
                options={{
                  animation: { duration: 0 },
                  showLine: true,
                  cubicInterpolationMode: "monotone",
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
                          content: "+1.5°C",
                          enabled: true,
                          backgroundColor: "rgba(253, 106, 2, 0.7)"
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
                          content: "+2°C",
                          enabled: true,
                          backgroundColor: "rgba(255, 0, 0, 0.7)"
                        }
                      }
                    ]
                  }
                }}
                width={300}
                height={258}
                redraw
              />
            </Col>
          </Row>
          <Row className="current">
            <Col>
              Current CO₂ levels:{" "}
              <span className="bold">
                {netCO2.values.length
                  ? netCO2.values[netCO2.values.length - 1]
                  : 0}
              </span>{" "}
              Mt
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  );
};

export default React.memo(GlobalStats);
