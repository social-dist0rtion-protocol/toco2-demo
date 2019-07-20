import React from "react";
import { Col, Row } from "react-bootstrap";
import "./Leaderboard.css";
import { Player } from "../types";

type LeaderboardProps = {
  players: { [id: string]: Player };
  trees: Array<[string, number]>;
  emissions: Array<[string, number]>;
};

const Leader = ({ player, balance }: { player: Player; balance: number }) => (
  <Row noGutters>
    <Col xs={6}>{player.name}</Col>
    <Col>{balance}</Col>
    <Col>{player.event}</Col>
  </Row>
);

const Leaderboard = (props: LeaderboardProps) => (
  <div className="leaderboard">
    <h4>Tree huggerz</h4>
    <Row className="tree-huggers" noGutters>
      <Col>
        <Row className="headers" noGutters>
          <Col xs={6}>name</Col>
          <Col>trees</Col>
          <Col>event</Col>
        </Row>
        {props.trees.map(t => (
          <Leader key={t[0]} player={props.players[t[0]]} balance={t[1]} />
        ))}
      </Col>
    </Row>
    <h4>Polluters</h4>
    <Row className="polluters" noGutters>
      <Col>
        <Row className="headers" noGutters>
          <Col xs={6}>name</Col>
          <Col>CO₂</Col>
          <Col>event</Col>
        </Row>
        {props.emissions.map(e => (
          <Leader key={e[0]} player={props.players[e[0]]} balance={e[1]} />
        ))}
      </Col>
    </Row>
  </div>
);

export default React.memo(Leaderboard);
