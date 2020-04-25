import React from 'react';
import Alert from "./Alert";
import "./Alerts.css";
import {
    Card, CardBody, CardTitle, CardHeader,
    Container
} from 'reactstrap';

const AlertList = (props) => {
    return (
        <Card className="card-stats alerts-window">
            <CardHeader className="p-1">
                <CardTitle tag="h4">Moderation Alerts</CardTitle>
            </CardHeader>
            <CardBody className="p-1">
                <Container>
                    <ul id="alerts-list" className="mt-2">
                        {props.alerts.map((a, i) => <Alert key={a.id} text={a.text}/>)}
                    </ul>
                </Container>
            </CardBody>
        </Card>
    );
};

export default AlertList;
