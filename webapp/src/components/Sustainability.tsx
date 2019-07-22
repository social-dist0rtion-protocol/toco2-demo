import React from "react";
import { Col, Row } from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import "./Sustainability.css";
import { LeaderboardResponse, Country } from "../types";

type SustainabilityProps = {
  emissionsByCountry: LeaderboardResponse["emissionsByCountry"];
  treesByCountry: LeaderboardResponse["treesByCountry"];
  countries: { [countryId: string]: Country };
};

const Sustainability = (props: SustainabilityProps) => {
  const { countries, emissionsByCountry, treesByCountry } = props;

  const labels: string[] = [];
  const data: number[] = [];

  Object.entries(countries).forEach(([id, c]) => {
    labels.push(c.name);
    data.push(1 / Math.max(1, emissionsByCountry[id] - treesByCountry[id]));
  });

  return (
    <>
      <h4>Sustainibility</h4>
      <Row className="sustainability" noGutters>
        <Col>
          <Bar
            data={{
              labels,
              datasets: [
                {
                  label: "sustainability index",
                  data,
                  backgroundColor: "rgba(80, 200, 120, 0.9)"
                }
              ]
            }}
            options={{
              animation: { duration: 0 },
              scales: {
                xAxes: [{ barPercentage: 0.5, ticks: { fonSize: 24 } }],
                yAxes: [{ ticks: { suggestedMin: 0 } }]
              }
            }}
            width={200}
            height={400}
            redraw
          />
        </Col>
      </Row>
    </>
  );
};

export default React.memo(Sustainability);
