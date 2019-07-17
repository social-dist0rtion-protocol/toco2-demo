import React from "react";
import { Col, Row } from "react-bootstrap";
import "./GlobalStats.css";

const GlobalStats = () => (
  <>
    <h4>Global stuff</h4>
    <Row className="global-stats" noGutters>
      <Col>
        <Row>
          <Col>hi there, I'm a graph</Col>
        </Row>
        <Row>
          <Col>hi there, I'm another graph</Col>
        </Row>
      </Col>
    </Row>
  </>
);

export default React.memo(GlobalStats);
