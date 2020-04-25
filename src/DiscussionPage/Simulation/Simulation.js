import React, { Component } from 'react';
import { rgb } from "d3";
import { connect } from 'react-redux'
import Switch from 'react-switch'
import './Simulation.css';


class Simulation extends Component {

    constructor(props) {
        super(props);
        this.nodesChildren = new Map();
        this.currentMessageIndex = 1;
        this.allMessages = [];
        this.regularMessages = [];
        this.chronologicMessages = [];
        this.allAlerts = [];
        this.shownMessages = [];
        this.shownNodes = [];
        this.shownLinks = [];
        this.messagesCounter = 0;
        this.socket = props.socket;
        this.state = {
            order: 'Regular',
            switchOrder: 'Chronological',
            isChronological: false
        }
    }

    componentDidMount() {
        this.socket.on('join room', (response) => {
            this.props.setTitle(response["discussion"]["title"]);
            this.getMessagesNodesLinks(response["tree"]);
            this.chronologicMessages.sort(function (a, b) {
                return a.timestamp - b.timestamp;
            });
            this.handleOrderSettings();
            this.shownMessages = this.allMessages.slice(0, 1);
            this.nodesChildren.set(this.shownMessages[0].id, []);
            this.shownNodes.push({
                id: this.shownMessages[0].author,
                color: "#" + this.props.nodeColor(this.shownMessages[0].author),
                name: this.shownMessages[0].author,
                val: 0.5,
                comments: 1,
                commentsReceived: 0
            });
            while (this.currentMessageIndex < response["currentIndex"]) {
                this.handleNextClick(false);
            }
            this.props.messagesHandler(this.shownMessages, this.shownNodes, this.shownLinks);
        });
        const data = {
            discussion_id: this.props.discussionId,
            token: this.props.token
        };

        this.socket.emit('join', data);
        this.handleModeratorActions();
        this.handleVisualizations();
    }

    getMessagesNodesLinks = (node) => {
        if (node == null) return;
        if (node["node"]["isAlerted"])
            this.props.alertsHandler({ "position": this.messagesCounter, "text": node["node"]["actions"][0] });
        this.messagesCounter++;
        node["node"].color = "#" + this.props.nodeColor(node["node"]["author"]);
        this.regularMessages.push(node["node"]);
        this.chronologicMessages.push(node["node"]);
        node["children"].forEach(child => {
            this.getMessagesNodesLinks(child);
        });
    };

    handleModeratorActions = () => {
        this.socket.on('next', () => { this.handleNextClick(true) });
        this.socket.on('back', () => { this.handleBackClick(true) });
        this.socket.on('reset', this.handleResetClick);
        this.socket.on('all', this.handleShowAllClick);
        this.socket.on('change_simulation_order', this.handleOrderSettings);
    };

    handleVisualizations = () => {
        this.socket.on('new configuration', (response) => { this.props.handleNewConfig(response) });
    };

    handleNavigationClickModerator = (type) => {
        if (this.props.userType === "MODERATOR" || this.props.userType === "ROOT") {
            const data = { "discussionId": this.props.discussionId };
            this.socket.emit(type, data);
        }
    };

    handleNextClick = (toUpdateState) => {
        if (this.currentMessageIndex === this.allMessages.length) return;
        const nextMessage = this.allMessages[this.currentMessageIndex];
        const userName = nextMessage.author;
        const parentId = nextMessage.parentId;
        const parentUserName = this.shownMessages.find(message => message.id === parentId).author;
        const selfMessage = (userName === parentUserName);
        this.state.isChronological ?
            this.nextByTimestamp(nextMessage, selfMessage)
            : this.shownMessages = this.allMessages.slice(0, this.currentMessageIndex + 1);
        if (selfMessage) { this.update(1, true); return; }
        this.updateNodesNext(userName, parentUserName);
        this.updateLinksNext(userName, parentUserName);
        this.update(1, toUpdateState);
    };

    handleBackClick = (toUpdateState) => {
        if (this.currentMessageIndex === 1) return;
        const messageIndex = this.currentMessageIndex - 1;
        let deletedMessage = this.allMessages[messageIndex];
        const userName = deletedMessage.author;
        const parentId = deletedMessage.parentId;
        const parentUserName = this.shownMessages.find(message => message.id === parentId).author;
        const selfMessage = (userName === parentUserName);
        this.state.isChronological ?
            this.backByTimestamp(messageIndex, selfMessage)
            : this.shownMessages = this.allMessages.slice(0, this.currentMessageIndex - 1);
        if (selfMessage) { this.update(-1, true); return; }
        this.updateLinksBack(userName, parentUserName);
        this.updateNodesBack(userName, parentUserName);
        this.update(-1, toUpdateState);
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
    name - represents the messages number (also the tooltip)
    width - represent the
    color - represents the updating of the last message
     */

    updateLinksNext = (userName, parentUserName) => {
        const idx = this.shownLinks.findIndex(currentLink =>
            currentLink.source.id === userName && currentLink.target.id === parentUserName);
        if (idx === -1) {
            this.shownLinks.push({
                source: this.shownNodes.filter(node => node.id === userName)[0],
                target: this.shownNodes.filter(node => node.id === parentUserName)[0],
                name: 1,
                width: 1,
                color: rgb(32, 32, 32, 1),
                curvature: 0.2,
            })
        } else {
            this.shownLinks[idx].name = this.shownLinks[idx].name + 1;
            let updatedLink = this.shownLinks.splice(this.shownLinks[idx], 1);
            this.shownLinks.unshift(updatedLink[0]);
        }
        this.updateOpacityAll();
        this.updateWidthAll();
    };

    updateLinksBack = (userName, parentUserName) => {
        const linkIndex = this.shownLinks.findIndex(
            currentLink => currentLink.source.id === userName && currentLink.target.id === parentUserName);
        this.shownLinks[linkIndex].name -= 1;
        if (this.shownLinks[linkIndex].name === 0)
            this.shownLinks.splice(linkIndex, 1);
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
                children: [],
                comments: 1,
                commentsReceived: 0

            })
        } else {
            this.shownNodes[idx].val += 0.05;
            this.shownNodes[idx].comments++;
        }
        const parentIdx = this.shownNodes.findIndex(currentNode =>
            currentNode.id === parentUserName);
        this.shownNodes[parentIdx].commentsReceived++;
    };

    updateNodesBack = (userName, parentUserName) => {
        const linkIndex = this.shownLinks.findIndex(link => link.source.id === userName || link.target.id === userName);
        if (linkIndex === -1 && this.shownNodes.length > 1)
            this.shownNodes.splice(this.shownNodes.findIndex(node => node.id === userName), 1);
        else {
            const nodeIndex = this.shownNodes.findIndex(node => node.id === userName);
            this.shownNodes[nodeIndex].val -= 0.05;
            this.shownNodes[nodeIndex].comments--;
        }
        const parentIdx = this.shownNodes.findIndex(currentNode =>
            currentNode.id === parentUserName);
        this.shownNodes[parentIdx].commentsReceived--;
    };

    backByTimestamp = (messageIndex, selfMessage) => {
        // this.nodesChildren.delete(this.allMessages[messageIndex].id);
        const parentId = this.allMessages[messageIndex].parentId;
        let children = this.nodesChildren.get(parentId);
        children.splice(children.length - 1, 1);
        this.nodesChildren.set(parentId, children);

        const indexToDelete = this.shownMessages.findIndex(node => node.id === this.allMessages[messageIndex].id);
        this.shownMessages.splice(indexToDelete, 1);
    };

    handleShowAllClick = () => {
        while (this.currentMessageIndex < this.allMessages.length) {
            this.handleNextClick(false);
        }
        this.props.messagesHandler(this.shownMessages, this.shownNodes, this.shownLinks);
    };

    handleResetClick = () => {
        while (this.currentMessageIndex !== 1) {
            this.handleBackClick(false);
        }
        this.props.messagesHandler(this.shownMessages, this.shownNodes, this.shownLinks);
    };

    handleOrderSettings = () => {
        let temp = this.state.order;
        this.setState((prevState) => ({
            isChronological: !prevState.isChronological
        }));

        this.handleResetClick();
        this.setState({
            order: this.state.switchOrder,
            switchOrder: temp
        });
        this.state.isChronological ?
            this.allMessages = this.chronologicMessages : this.allMessages = this.regularMessages;
    };

    update(dif, toUpdateState) {
        this.currentMessageIndex = this.currentMessageIndex + dif;
        if (toUpdateState) {
            this.props.messagesHandler(this.shownMessages, this.shownNodes, this.shownLinks, null);
        }
    };

    updateOpacityAll() {
        for (let index = 0; index < this.shownLinks.length; index++) {
            let newOpacity = Math.pow(index, 3) / Math.pow(this.shownLinks.length - 1, 3);
            if (newOpacity < 0.1) {
                newOpacity = 0.1
            }
            this.shownLinks[index].color = rgb(32, 32, 32, newOpacity);
        }
    };

    updateWidthAll() {
        const allMessagesNumber = this.shownLinks.map(link => link.name);
        const max = Math.max(...allMessagesNumber);
        for (let index = 0; index < this.shownLinks.length; index++) {
            const value = this.shownLinks[index].name;
            this.shownLinks[index].width = (2 * (value - 1) / max) + 1;
        }
    };

    render() {
        return (
            <React.Fragment>
                {(this.props.userType === "MODERATOR" || this.props.userType === "ROOT") &&
                    <div className={"row"}>
                        <button type="button" className="btn btn-primary btn-sm"
                            onClick={() => { this.handleNavigationClickModerator("reset") }}>Reset
                    </button>
                        <button type="button" className="btn btn-primary btn-sm"
                            onClick={() => { this.handleNavigationClickModerator("back") }}>Back
                    </button>
                        <button type="button" className="btn btn-primary btn-sm"
                            onClick={() => { this.handleNavigationClickModerator("next") }}>Next
                    </button>
                        <button type="button" className="btn btn-primary btn-sm"
                            onClick={() => { this.handleNavigationClickModerator("all") }}>All
                    </button>
                        <div data-tip={'Press here to change to ' + this.state.switchOrder + ' order.'}>
                            <Switch className="commentsOrderToggle"
                                onChange={() => { this.handleNavigationClickModerator("change_simulation_order") }}
                                checked={this.state.isChronological}
                                offColor="#4285f4"
                                onColor="#4285f4"
                            />
                            <span><b>{this.state.order}</b></span>
                        </div>
                    </div>
                }
            </React.Fragment>
        );
    };
}

const mapStateToProps = state => {
    return {
        currentUser: state.currentUser,
        userType: state.userType,
        token: state.token
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        onLogOut: () => dispatch({ type: 'LOGOUT' })
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Simulation);
