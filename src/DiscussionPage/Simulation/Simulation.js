import React, {Component} from 'react';
import {rgb} from "d3";
import {connect} from 'react-redux'
import io from 'socket.io-client';
import Switch from 'react-switch'
import './Simulation.css';
import ReactTooltip from "react-tooltip";


class Simulation extends Component {

    constructor(props) {
        super(props);
        this.nodesChildren = new Map();
        this.currentMessageIndex = 1;
        this.allMessages = [];
        this.allAlerts = [];
        this.shownMessages = [];
        this.shownNodes = [];
        this.shownLinks = [];
        this.messagesCounter = 0;
        this.socket = io(process.env.REACT_APP_API);
        this.state = {
            isChronological: false,
            order: 'Regular',
            switchOrder: 'Chronological'
        }
    }

    componentDidMount() {
        this.socket.on('join room', (response) => {
            this.getMessagesNodesLinks(response["tree"]);
            this.props.setTitle(response["discussion"]["title"]);
            this.shownMessages = this.allMessages.slice(0, 1);
            if (this.state.isChronological) {
                this.nodesChildren.set(this.shownMessages[0].id, []);
                this.allMessages.sort(function (a, b) {
                    return a.timestamp - b.timestamp;
                });
            }
            this.shownNodes.push({
                id: this.shownMessages[0].author,
                color: "#" + this.props.nodeColor(this.shownMessages[0].author),
                name: this.shownMessages[0].author,
                val: 0.5
            });
            this.props.messagesHandler(this.shownMessages, this.shownNodes, this.shownLinks);
        });
        const data = {
            discussion_id: this.props.discussionId,
            token: this.props.token
        };
        this.socket.emit('join', data);
        this.socket.on('user joined', (response) => console.log(response));
    }

    getMessagesNodesLinks = (node) => {
        if (node == null) return;
        if (node["node"]["isAlerted"])
            this.props.alertsHandler({"position": this.messagesCounter, "text": node["node"]["actions"][0]});
        this.messagesCounter++;
        Object.assign(node["node"], {color: "#" + this.props.nodeColor(node["node"]["author"])});
        this.allMessages.push(node["node"]);
        node["children"].forEach(child => {
            this.getMessagesNodesLinks(child);
        });
    };

    handleNextClick = () => {
        if (this.currentMessageIndex === this.allMessages.length) return;
        const nextMessage = this.allMessages[this.currentMessageIndex];
        const userName = nextMessage.author;
        const parentId = nextMessage.parentId;
        const parentUserName = this.shownMessages.find(message => message.id === parentId).author;
        this.state.isChronological ?
            this.nextByTimestamp(nextMessage)
            : this.shownMessages = this.allMessages.slice(0, this.currentMessageIndex + 1);

        this.updateLinksNext(userName, parentUserName);
        this.updateNodesNext(userName, parentUserName);
        this.update(1);
    };

    handleBackClick = () => {
        if (this.currentMessageIndex === 1) return;
        const messageIndex = this.currentMessageIndex - 1;
        let deletedMessage = this.allMessages[messageIndex];
        const userName = deletedMessage.author;
        const parentId = deletedMessage.parentId;
        const parentUserName = this.shownMessages.find(message => message.id === parentId).author;
        this.state.isChronological ?
            this.backByTimestamp(messageIndex)
            : this.shownMessages = this.allMessages.slice(0, this.currentMessageIndex - 1);
        this.updateLinksBack(userName, parentUserName);
        this.updateNodesBack(userName, parentUserName);
        this.update(-1);
    };

    /*
    nextMessage - the next message that will be presented in the chat.
    Each node has an array of the ids of its children.
    Once the user press next, the function add the message to the children array of the parent of the author,
    add new element of the node (author).
    If the parent there are no children yet, the node will be add directly to the array, otherwise, the function
    will look for the last child (message) of its parent and will add this child after it.
     */
    nextByTimestamp = (nextMessage) => {
        const parentId = nextMessage.parentId;
        const parentIndex = this.shownMessages.findIndex(message => message.id === parentId);
        let children = this.nodesChildren.get(parentId);
        if (children.length === 0)
            this.shownMessages.splice(parentIndex + 1, 0, nextMessage);
        else {
            const lastChildId = children[children.length - 1];
            let prevMessageIndex = this.shownMessages.findIndex(message => message.id === lastChildId);
            while (prevMessageIndex + 1 < this.shownMessages.length &&
            this.shownMessages[prevMessageIndex + 1].depth > nextMessage.depth) {
                prevMessageIndex++;
            }
            this.shownMessages.splice(prevMessageIndex + 1, 0, nextMessage);
        }
        children.push(nextMessage.id);
        this.nodesChildren.set(parentId, children);
        this.nodesChildren.set(nextMessage.id, []);
    };

    /*
    properties:
    name - represents the number of messages (used for the tooltip)
    width - represent the number of messages
    color - represents the updating of the last message
     */

    updateLinksNext = (userName, parentUserName) => {
        const idx = this.shownLinks.findIndex(currentLink =>
            currentLink.source.id === userName && currentLink.target.id === parentUserName);
        if (idx === -1) {
            this.shownLinks.push({
                source: userName,
                target: parentUserName,
                name: 1,
                width: 1,
                color: rgb(32, 32, 32, 1),
                curvature : 0.2,
            })
        } else {
            let newMessagesNumber = this.shownLinks[idx].name + 1;
            Object.assign(this.shownLinks[idx], {name: newMessagesNumber});
            let updatedLink = this.shownLinks.splice(this.shownLinks[idx], 1);
            this.shownLinks.unshift(updatedLink[0]);
        }
        this.updateOpacityAll();
        this.updateWidthAll();
    };

    updateLinksBack = (userName, parentUserName) => {
        const linkIndex = this.shownLinks.findIndex(
            currentLink => currentLink.source.id === userName && currentLink.target.id === parentUserName);
        let newMessagesNumber = this.shownLinks[linkIndex].name - 1;
        if (newMessagesNumber === 0)
            this.shownLinks.splice(linkIndex, 1);
        else
            Object.assign(this.shownLinks[linkIndex], {name: newMessagesNumber});
        this.updateWidthAll();
        this.updateOpacityAll();
    };

    updateNodesNext = (userName, parentUserName) => {
        const idx = this.shownNodes.findIndex(currentNode =>
            currentNode.id === userName);
        if (idx === -1) {
            this.shownNodes.push({
                id: userName,
                color: "#" + this.props.nodeColor(userName),
                name: userName,
                val: 0.5,
                children: []
            })
        }
        let parentNode = this.shownNodes.find(node => node.id === parentUserName);
        let newVal = parentNode.val + 0.05;
        Object.assign(parentNode, {val: newVal});
    };

    updateNodesBack = (userName, parentUserName) => {
        const nodeIndex = this.shownLinks.findIndex(link => link.source.id === userName || link.target.id === userName);
        if (nodeIndex === -1)
            this.shownNodes.splice(this.shownNodes.findIndex(node => node.id === userName), 1);
        else {
            let parentNode = this.shownNodes.find(node => node.id === parentUserName);
            let newVal = parentNode.val - 0.05;
            Object.assign(parentNode, {val: newVal});
        }
    };

    backByTimestamp = (messageIndex) => {
        this.nodesChildren.delete(this.allMessages[messageIndex].id);
        const parentId = this.allMessages[messageIndex].parentId;
        let children = this.nodesChildren.get(parentId);
        children.splice(children.length - 1, 1);
        this.nodesChildren.set(parentId, children);

        const indexToDelete = this.shownMessages.findIndex(node => node.id === this.allMessages[messageIndex].id);
        this.shownMessages.splice(indexToDelete, 1);
    };

    handleSimulateClick = async () => {
        while (this.currentMessageIndex + 1 < this.allMessages.length) {
            await this.handleNextClick();
            await (async () => {
                await sleep(1000);
            })();
        }
    };

    handleShowAllClick = async () => {
        while (this.currentMessageIndex < this.allMessages.length) {
            await this.handleNextClick();
            await sleep(1);
        }
        this.props.messagesHandler(this.shownMessages, this.shownNodes, this.shownLinks);
        console.log(this.shownLinks);
    };

    handleResetClick = () => {
        while (this.currentMessageIndex !== 1) {
            this.handleBackClick();
        }
        this.props.messagesHandler(this.shownMessages, this.shownNodes, this.shownLinks);
    };


    render() {
        return (
            <React.Fragment>
                <div className={"row"}>
                    <button type="button" className="btn btn-primary btn-sm"
                            onClick={this.handleResetClick}>Reset
                    </button>
                    <button type="button" className="btn btn-primary btn-sm"
                            onClick={this.handleBackClick}>Back
                    </button>
                    <button type="button" className="btn btn-primary btn-sm"
                            onClick={this.handleNextClick}>Next
                    </button>
                    <button type="button" className="btn btn-primary btn-sm"
                            onClick={this.handleShowAllClick}>All
                    </button>
                    <button type="button" className="btn btn-primary btn-sm"
                            onClick={this.handleSimulateClick}>Simulate
                    </button>
                    {this.props.userType === 'MODERATOR' || this.props.userType === 'ROOT' ?
                        <React.Fragment>
                            <div data-tip={'Press here to change to ' + this.state.switchOrder + ' order.'}>
                                <Switch className="commentsOrderToggle"
                                        onChange={this.handleOrderSettings}
                                        checked={this.state.isChronological}
                                        offColor="#FFA500"
                                        onColor="#FFA500"
                                />
                                <span><b>{this.state.order}</b></span>
                            </div>
                        </React.Fragment> : null}
                </div>
            </React.Fragment>
        );
    }

    handleOrderSettings = () => {
        let temp = this.state.order;
        if (window.confirm('This action will initialize the discussion. Are you sure?')) {
            this.handleResetClick();
            this.setState({
                isChronological: !this.state.isChronological,
                order: this.state.switchOrder,
                switchOrder: temp
            });
        }
    };

    update(dif) {
        this.currentMessageIndex = this.currentMessageIndex + dif;
        this.props.messagesHandler(this.shownMessages, this.shownNodes, this.shownLinks);
    }

    updateOpacityAll() {
        for (let index = 0; index < this.shownLinks.length; index++) {
            let newOpacity = (this.shownLinks.length - index) / this.shownLinks.length;
            this.shownLinks[index] = Object.assign(this.shownLinks[index], {color: rgb(32, 32, 32, newOpacity)});
        }
    }

    updateWidthAll() {
        const allMessagesNumber = this.shownLinks.map(link => link.name);
        const max = Math.max(...allMessagesNumber);
        for (let index = 0; index < this.shownLinks.length; index++) {
            const value = this.shownLinks[index].name;
            this.shownLinks[index] = Object.assign(this.shownLinks[index], {width: (2 * (value - 1) / max) + 1});
        }
    }
}

const sleep = m => new Promise(r => setTimeout(r, m));

const mapStateToProps = state => {
    return {
        currentUser: state.currentUser,
        token: state.token,
        userType: state.userType
    };
};

export default connect(mapStateToProps)(Simulation);
