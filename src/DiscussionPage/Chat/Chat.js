import React, { Component } from 'react';
import Messages from "./MessagesList"
import "./Chat.css"
import { rgb } from "d3";
import io from 'socket.io-client';


class Chat extends Component {

    constructor(props) {
        super(props);
        this.shownMessages = [];
        this.shownNodes = [];
        this.shownLinks = [];
        this.linksMap = new Map();
        this.nodesMap = new Map();
        this.messagesCounter = 0;
        this.currentMessageIndex = 1;
        this.messagesCounter = 0;
        this.state = {
            root: null
        };
        this.socket = io('http://localhost:5000/');
        this.discussionId = "";
    }

    componentDidMount() {
        if (!this.props.isSimulation) {
            // const xhr = new XMLHttpRequest();
            // xhr.addEventListener('load', () => {
            //     let response = JSON.parse(xhr.responseText);
            //     this.setState(
            //         {
            //             root: response["tree"]
            //         }
            //     );
            //     this.loadDiscussion(this.state.root);
            //     this.updateGraph();

            //     this.props.messagesHandler(this.shownMessages, this.shownNodes, this.shownLinks);
            // });
            // xhr.open('GET', 'http://localhost:5000/api/getDiscussion/' + this.props.discussionId);
            // xhr.send();

            const data = {
                'room': this.props.discussionId,
                'username': 'ron'
            };

            this.socket.on('join', (response) => {
                this.setState(
                    {
                        root: response["tree"]
                    }
                );
                this.loadDiscussion(this.state.root);
                this.updateGraph();

                this.props.messagesHandler(this.shownMessages, this.shownNodes, this.shownLinks);

            });

            this.socket.emit('join', data);


            this.socket.on('add comment', (res) => {
                this.addComment(res.comment);
            });
        }
    };

    updateGraph() {
        this.shownLinks = Array.from(this.linksMap.values());
        this.shownNodes = Array.from(this.nodesMap.values());
        this.shownLinks.sort(function (a, b) { return b.timestamp - a.timestamp; });
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
            "author": "Sap",
            "text": message,
            "parentId": targetId,
            "discussionId": this.discussionId,
            "extra_data": null,
            "time_stamp": 0,
            "depth": depth
        });
        this.socket.emit('add comment', comment)
    };

    addComment(message) {
        console.log(message.depth);
        this.addMessageHelper(this.state.root, message.parentId, message.author, message.text, message.depth, message.id, message.timestamp);
        this.reloadChat();

        this.props.messagesHandler(this.shownMessages, this.shownNodes, this.shownLinks);
    };

    updateLinksOpacity() {
        this.shownLinks.forEach(link => {
            const index = this.shownLinks.indexOf(link);
            let newOpacity = (this.shownLinks.length - index) / this.shownLinks.length;
            link.updateOpacity([32, 32, 32, newOpacity]);
        });
    }

    updateLinksWidth() {
        const allMessagesNumber = this.shownLinks.map(link => link.messagesNumber);
        const max = Math.max(...allMessagesNumber);
        this.shownLinks.forEach(link => {
            const value = link.messagesNumber;
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
            this.addMessageHelper(child, targetId, author, message, depth, messageId);
        });
    };

    loadDiscussion = (commentNode) => {
        if (commentNode == null) return;
        if (commentNode["node"]["isAlerted"]) {
            this.props.alertsHandler({ "position": this.messagesCounter, "text": commentNode["node"]["actions"][0] })
        }
        this.messagesCounter++;
        this.shownMessages.push({
            member: {
                username: commentNode["node"]["author"],
                id: commentNode["node"]["id"],
                color: "#" + intToRGB(hashCode(commentNode["node"]["author"])),
            },
            text: commentNode["node"]["text"],
            depth: commentNode["node"]["depth"]
        });
        if (!this.nodesMap.has(commentNode["node"]["author"])) {
            let node = {
                id: commentNode["node"]["author"],
                color: "#" + intToRGB(hashCode(commentNode["node"]["author"])),
                name: commentNode["node"]["author"],
                val: 0.5,
                updateVal: function (value) { this.val += value; },
            }
            this.nodesMap.set(commentNode["node"]["author"], node)
        }

        commentNode["children"].forEach(childComment => {
            const key = childComment["node"]["author"] + " -> " + commentNode["node"]["author"];
            if (!this.linksMap.has(key)) {
                const link = {
                    source: childComment["node"]["author"],
                    target: commentNode["node"]["author"],
                    timestamp: childComment["node"]["timestamp"],
                    messagesNumber: 1,
                    width: 1,
                    color: rgb(32, 32, 32, 1),
                    updateWidth: function (value) { this.width = value; },
                    updateMessagesNumber: function (value) { this.messagesNumber += value; },
                    updateOpacity: function (value) { this.color = rgb(value[0], value[1], value[2], value[3]); },
                };
                this.linksMap.set(key, link);
            }
            else {
                const link = this.linksMap.get(key);
                link.timestamp = childComment["node"]["timestamp"];
                link.messagesNumber += 1;
                this.nodesMap.get(link.source).updateVal(0.02);
            }
            this.loadDiscussion(childComment);
        });
    };


    render() {
        return (
            <div className="chat">
                <Messages
                    messages={this.props.messages} isSimulation={this.props.isSimulation} newMessageHandler={this.sendComment.bind(this)}
                />
            </div>);
    }

};

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

function intToRGB(i) {
    const c = (i & 0x00FFFFFF).toString(16).toUpperCase();
    return "00000".substring(0, 6 - c.length) + c;
}

export default Chat;
