import React from "react";
import Message from './Message';


const Messages = (props) => {
    return (
        <ul className="Messages-list">
            {props.messages.map((m) =>
                <Message key={m.id} username={m.author} color={m.color} text={m.text} timestamp={m.timestamp}
                    depth={m.depth} id={m.id} isSimulation={props.isSimulation}
                    newMessageHandler={props.newMessageHandler} newAlertHandler={props.newAlertHandler} />)}
        </ul>
    );
}

export default Messages;