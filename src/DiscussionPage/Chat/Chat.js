import React, { Component } from 'react';
import { connect } from 'react-redux'
import Messages from "./Messages"
import "./Chat.css"
import { rgb } from "d3";

class Chat extends Component {

    constructor(props) {
        super(props);
        this.shownMessages = [];
        this.shownNodes = [];
        this.shownLinks = [];
        this.timestampMessages = [];
        this.linksMap = new Map();
        this.nodesMap = new Map();
        this.messagesCounter = 0;
        this.state = {
            root: null
        };
        this.socket = props.socket;
    }

    componentDidMount() {
        if (!this.props.isSimulation) {
            this.socket.on('join room', (response) => {
                this.reloadChat();
                this.setState(
                    {
                        root: response["tree"],
                    }
                );
                this.props.setTitle(response["discussion"]["title"]);
                this.loadDiscussion(this.state.root);
                this.updateGraph();
                this.timestampMessages.sort(function (a, b) {
                    return b.timestamp - a.timestamp;
                });
                this.props.messagesHandler(this.shownMessages, this.shownNodes, this.shownLinks, this.timestampMessages[0]);
            });
            const data = {
                discussion_id: this.props.discussionId,
                token: this.props.token
            };
            this.socket.emit('join', data);
            this.socket.on('message', (res) => {
                this.addComment(res.comment);
            });
            this.socket.on('alert', (res) => {
                this.props.alertsHandler(res.comment);
            });
        }
        this.handleVisualizations();
    };

    handleVisualizations = () => {
        this.socket.on('new configuration', (response) => { this.props.handleNewConfig(response) });
    };

    updateGraph() {
        this.shownLinks = Array.from(this.linksMap.values());
        this.shownNodes = Array.from(this.nodesMap.values());
        this.shownLinks.sort(function (a, b) {
            return b.timestamp - a.timestamp;
        });
        this.updateLinksOpacity();
        this.updateLinksWidth();
    }

    reloadChat() {
        this.linksMap = new Map();
        this.nodesMap = new Map();
        this.shownMessages = [];
        this.shownNodes = [];
        this.shownLinks = [];
        this.loadDiscussion(this.state.root);
        this.updateGraph();
    }

    sendComment(targetId, author, message, depth) {
        const comment = JSON.stringify({
            "author": this.props.currentUser,
            "text": message,
            "parentId": targetId,
            "discussionId": this.props.discussionId,
            "depth": depth
        });
        this.socket.emit('add comment', comment)
    };

    sendAlert(targetId, message, depth) {
        const comment = JSON.stringify({
            "author": this.props.currentUser,
            "text": message,
            "parentId": targetId,
            "discussionId": this.props.discussionId,
            "depth": depth
        });
        this.socket.emit('add alert', comment);
    };

    addComment(message) {
        this.addMessageHelper(this.state.root, message.parentId, message.author, message.text, message.depth, message.id, message.timestamp);
        this.reloadChat();
        this.props.messagesHandler(this.shownMessages, this.shownNodes, this.shownLinks, message);
    };

    updateLinksOpacity() {
        this.shownLinks.forEach(link => {
            const index = this.shownLinks.indexOf(link);
            let newOpacity = Math.pow(index, 3) / Math.pow(this.shownLinks.length - 1, 3);
            if (newOpacity < 0.1) {
                newOpacity = 0.1
            }
            link.updateOpacity([32, 32, 32, newOpacity]);
        });
    }

    updateLinksWidth() {
        const allMessagesNumber = this.shownLinks.map(link => link.name);
        const max = Math.max(...allMessagesNumber);
        this.shownLinks.forEach(link => {
            const value = link.name;
            link.updateWidth((2 * (value - 1) / max) + 1);
        });
    }

    addMessageHelper(currentNode, targetId, author, message, depth, messageId, timestamp) {
        if (currentNode == null) return;
        if (currentNode["node"]["id"] === targetId) {
            currentNode["children"].push({
                node: {
                    author: author,
                    depth: depth,
                    id: messageId,
                    text: message,
                    timestamp: timestamp,
                    children: []
                },
                children: []
            });
            return;
        }
        currentNode["children"].forEach(child => {
            this.addMessageHelper(child, targetId, author, message, depth, messageId, timestamp);
        });
    };

    loadDiscussion = (commentNode) => {
        if (commentNode == null) return;
        if (commentNode["node"]["isAlerted"]) {
            this.props.alertsHandler({ "position": this.messagesCounter, "text": commentNode["node"]["actions"][0] })
        }
        this.messagesCounter++;
        this.shownMessages.push({
            author: commentNode["node"]["author"],
            id: commentNode["node"]["id"],
            color: "#" + this.props.nodeColor(commentNode["node"]["author"]),
            text: commentNode["node"]["text"],
            depth: commentNode["node"]["depth"],
            timestamp: commentNode["node"]["timestamp"]
        });
        this.timestampMessages.push({
            parentId: commentNode["node"]["parentId"],
            depth: commentNode["node"]["depth"],
            timestamp: commentNode["node"]["timestamp"]
        });
        if (!this.nodesMap.has(commentNode["node"]["author"])) {
            let node = {
                id: commentNode["node"]["author"],
                color: "#" + this.props.nodeColor(commentNode["node"]["author"]),
                name: commentNode["node"]["author"],
                timestamp: commentNode["node"]["timestamp"],
                val: 0.5,
                updateVal: function (value) {
                    this.val += value;
                },
            };
            this.nodesMap.set(commentNode["node"]["author"], node)
        }
        commentNode["children"].forEach(childComment => {
            if (childComment["node"]["author"] !== commentNode["node"]["author"]) {
                const key = childComment["node"]["author"] + " -> " + commentNode["node"]["author"];
                if (!this.linksMap.has(key)) {
                    const link = {
                        source: childComment["node"]["author"],
                        target: commentNode["node"]["author"],
                        timestamp: childComment["node"]["timestamp"],
                        name: 1,
                        width: 1,
                        curvature: 0.2,
                        color: rgb(32, 32, 32, 1),
                        updateWidth: function (value) {
                            this.width = value;
                        },
                        updateOpacity: function (value) {
                            this.color = rgb(value[0], value[1], value[2], value[3]);
                        },
                    };
                    this.linksMap.set(key, link);
                } else {
                    const link = this.linksMap.get(key);
                    link.timestamp = childComment["node"]["timestamp"];
                    link.name += 1;
                    this.nodesMap.get(link.source).updateVal(0.05);
                }
            }
            this.loadDiscussion(childComment);
        });
    };


    render() {
        return (
            <div className="chat blue-border">
                <Messages
                    messages={this.props.messages} isSimulation={this.props.isSimulation}
                    newMessageHandler={this.sendComment.bind(this)} newAlertHandler={this.sendAlert.bind(this)}
                />
            </div>);
    }
}

const mapStateToProps = state => {
    return {
        currentUser: state.currentUser,
        token: state.token
    };
};


export default connect(mapStateToProps)(Chat);
