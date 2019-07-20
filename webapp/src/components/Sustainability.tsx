import React from "react";
import { Col, Row } from "react-bootstrap";
import "./Sustainability.css";
import { Player } from "../types";

type SustainabilityProps = {
  players: Player[];
};

const Sustainability = () => (
  <>
    <h4>Sustainibility, yo</h4>
    <Row className="sustainability" noGutters>
      <Col>hi there, I'm a graph</Col>
    </Row>
  </>
);

export default React.memo(Sustainability);
