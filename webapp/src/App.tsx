import React, { useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Leaderboard from "./components/Leaderboard";
import GlobalStats from "./components/GlobalStats";
import Sustainability from "./components/Sustainability";
import { useInterval } from "./effects";
import { getLeaderboard } from "./api";

export type Player = {
  avatar: string;
  name: string;
  event: string;
};

const App: React.FC = () => {
  const [players, setPlayers] = useState<{ [id: string]: Player }>({});
  const [balances, setBalances] = useState<Array<[string, number]>>([]);
  const [trees, setTrees] = useState<Array<[string, number]>>([]);
  const [emissions, setEmissions] = useState<Array<[string, number]>>([]);

  useInterval(async () => {
    const response = await getLeaderboard();
    setPlayers(response.players);
    setBalances(response.balances);
    setTrees(response.trees);
    setEmissions(response.emissions);
  }, 2000);

  return (
    <Container fluid>
      <Row>
        <Col>
          <Leaderboard
            players={players}
            balances={balances}
            trees={trees}
            emissions={emissions}
          />
        </Col>
        <Col xs={6}>
          <GlobalStats />
        </Col>
        <Col>
          <Sustainability />
        </Col>
      </Row>
    </Container>
  );
};

export default App;
