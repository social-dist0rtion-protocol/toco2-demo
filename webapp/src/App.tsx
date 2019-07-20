import React, { useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Leaderboard from "./components/Leaderboard";
import GlobalStats from "./components/GlobalStats";
import Sustainability from "./components/Sustainability";
import { useInterval } from "./effects";
import { getLeaderboard, countries } from "./api";
import { LeaderboardResponse } from "./types";

const App: React.FC = () => {
  const [players, setPlayers] = useState<LeaderboardResponse["players"]>({});
  const [trees, setTrees] = useState<LeaderboardResponse["trees"]>([]);
  const [emissions, setEmissions] = useState<LeaderboardResponse["emissions"]>(
    []
  );
  const [emissionsByCountry, setEmissionsByCountry] = useState<
    LeaderboardResponse["emissionsByCountry"]
  >({});
  const [treesByCountry, setTreesByCountry] = useState<
    LeaderboardResponse["treesByCountry"]
  >({});

  useInterval(async () => {
    const response = await getLeaderboard();
    setPlayers(response.players);
    setTrees(response.trees);
    setEmissions(response.emissions);
    setTreesByCountry(response.treesByCountry);
    setEmissionsByCountry(response.emissionsByCountry);
  }, 5000);

  return (
    <Container fluid>
      <Row>
        <Col>
          <Leaderboard players={players} trees={trees} emissions={emissions} />
        </Col>
        <Col xs={6}>
          <GlobalStats
            countries={countries}
            emissionsByCountry={emissionsByCountry}
            treesByCountry={treesByCountry}
          />
        </Col>
        <Col>
          <Sustainability />
        </Col>
      </Row>
    </Container>
  );
};

export default App;
