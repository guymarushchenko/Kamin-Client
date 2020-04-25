import React, { Component } from 'react';
import './Discussion.css';
import Chat from "./Chat/Chat";
import Simulation from './Simulation/Simulation';
import Graph from "./Graph/Graph";
import AlertList from "./Alert/AlertsList";
import UserStats from "./Statistics/UserStats";
import DiscussionStats from "./Statistics/DiscussionStats";
import ReactTooltip from 'react-tooltip'
import { connect } from 'react-redux'
import io from 'socket.io-client';
import VisualizationsModal from "./Modals/VisualizationsConfigModal";

class Discussion extends Component {
    constructor(props) {
        super(props);
        this.socket = io(process.env.REACT_APP_API);
        this.lastMessage = {};
        this.state = {
            shownMessages: [],
            shownNodes: [],
            shownLinks: [],
            shownAlerts: [],
            allAlerts: [],
            discussionId: this.props.simulationCode,
            showVisualizationSettingsModal: false,
            title: '',
            selectedUser: "",
            lastMessage: {},
            showGraph: true,
            showAlerts: true,
            showStat: true
        };
    }

    componentDidMount() {
        this.socket.on('unauthorized', () => {
            this.props.onLogOut();
            this.props.history.push('/');
        });

        this.socket.on('end_session', () => {
            this.props.history.push('/');
        });

        this.socket.on('error', (response) => {
            console.log({ response })
        });

    }

    updateLastMessage = (message) => {
        this.lastMessage = message;
    };

    updateMessagesHandler(newMessages, newNodes, newLinks, lastMessage) {
        const newAlerts = [];
        this.state.allAlerts.forEach((a) => {
            if (a.position <= newMessages.length - 1) {
                newAlerts.push(a);
            }
        });
        this.setState({
            shownMessages: newMessages,
            shownNodes: newNodes,
            shownLinks: newLinks,
            shownAlerts: newAlerts,
            lastMessage: lastMessage
        });
    };

    updateAlertsHandler(newAlert) {
        this.state.allAlerts.push(newAlert);
    };

    updateSelectedUserHandler(username) {
        this.setState({ selectedUser: username });
    }

    setTitle = (title) => {
        this.setState({
            title: title
        });
    };

    handleShareClick = () => {
        let dummy = document.createElement("input");
        document.body.appendChild(dummy);
        dummy.setAttribute('value', this.state.discussionId);
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
    };

    getSelectedUser() {
        return this.state.selectedUser;
    }

    getShownMessages() {
        return this.state.shownMessages;
    };

    getShownLinks() {
        return this.state.shownLinks;
    };

    getShownNodes() {
        return this.state.shownNodes;
    };

    updateModalHandler = (isOpen) => {
        this.setState({
            showVisualizationSettingsModal: isOpen
        });
    };

    handleVisualizationSettings = (settings) => {
        this.setState({
            showGraph: settings.graph,
            showAlerts: settings.alerts,
            showStat: settings.stat
        })
    };

    handleEndSession = () => {
        const data = {
            "token": this.props.token,
            "discussionId": this.state.discussionId
        };
        this.socket.emit('end_session', data);
    };

    getLastMessage = () => {
        return this.lastMessage;
    };

    handleNewConfig = (response) => {
        let settingsAll = response['all'];
        for (let settingAll in settingsAll){
            this.setState({ [settingAll]: settingsAll[settingAll] });
        };
        let userSettings = response[this.props.currentUser];
        for (let setting in userSettings){
            this.setState({ [setting]: userSettings[setting] });
        };
    };


    render() {
        return (
            <div className="App">
                <div className="row text-center">
                    <span className="col-4" >
                        {this.props.isSimulation === 'true' && <button type="button" className="btn btn-danger btn-sm"
                            onClick={this.handleEndSession}>End Session
                    </button>}
                    </span>
                    <span className="col-4">
                        <h3><b>{this.state.title}</b>
                            <i className="fas fa-share-square text-primary pl-2 cursor-pointer"
                               data-tip="Copied!" data-event="click"/>
                               <i className="fas fa-cog cursor-pointer"
                                  onClick={() => this.updateModalHandler(true)}/></h3>
                        <ReactTooltip eventOff="mousemove" afterShow={this.handleShareClick}/>
                        {this.props.userType === 'MODERATOR' || this.props.userType === 'ROOT' ?
                            <VisualizationsModal isOpen={this.state.showVisualizationSettingsModal}
                                                 discussionId={this.state.discussionId}
                                                 updateVisibility={this.updateModalHandler.bind(this)}
                                                 isSimulation={this.state.isSimulation}
                                                lastMessage = {this.state.lastMessage}
                            />
                            : null}
                    </span>
                    <span className="col-4">
                        {this.props.isSimulation === 'true' ?
                            <Simulation messagesHandler={this.updateMessagesHandler.bind(this)}
                                alertsHandler={this.updateAlertsHandler.bind(this)}
                                discussionId={this.props.simulationCode}
                                setTitle={this.setTitle}
                                messagesOrder={'chronological'}
                                nodeColor={intToRGB}
                                socket={this.socket}
                                        updateLastMessage={this.updateLastMessage.bind(this)}
                                        handleNewConfig={this.handleNewConfig.bind(this)}
                            /> : null}
                    </span>
                </div>
                <hr />
                <div className="row content mr-3 ml-1">
                    <div className="discussion-col col-lg-6 col-md-12 px-1">
                        <Chat messages={this.state.shownMessages} isSimulation={this.props.isSimulation === 'true'}
                            messagesHandler={this.updateMessagesHandler.bind(this)}
                            alertsHandler={this.updateAlertsHandler.bind(this)}
                            discussionId={this.props.simulationCode}
                            updateSelectedUser={this.updateSelectedUserHandler.bind(this)}
                            setTitle={this.setTitle}
                            nodeColor={intToRGB} socket={this.socket}
                              handleNewConfig={this.handleNewConfig.bind(this)}
                        />
                    </div>
                    <div className="discussion-col col-lg-6 col-md-12">
                        <div className={(this.state.showGraph ? 'show' : '') +
                        " collapse graph row blue-border mb-1"}>
                            {this.state.shownMessages.length > 0 &&
                            <Graph nodes={this.state.shownNodes} links={this.state.shownLinks}
                                   currentUser={this.props.currentUser}
                                   updateSelectedUser={this.updateSelectedUserHandler.bind(this)}
                                   rootId={this.state.shownMessages[0]['author']} />}
                        </div>
                        <div className="row insights">
                            <div className={(this.state.showStat ? 'show' : '') +
                            " collapse col-lg-4 col-md-12 p-0 blue-border mr-1"}>
                                <UserStats className="stats"
                                    getSelectedUser={this.getSelectedUser.bind(this)}
                                    discussionId={this.state.discussionId}
                                    getShownMessages={this.getShownMessages.bind(this)}
                                    getShownLinks={this.getShownLinks.bind(this)}
                                    getShownNodes={this.getShownNodes.bind(this)}
                                />
                                <DiscussionStats className="stats h-50"
                                    discussionId={this.state.discussionId}
                                    getShownMessages={this.getShownMessages.bind(this)}
                                    getShownLinks={this.getShownLinks.bind(this)}
                                    getShownNodes={this.getShownNodes.bind(this)} />
                            </div>
                            <div className={(this.state.showAlerts ? 'show' : '') + " collapse col p-0 blue-border"}>
                                <AlertList alerts={this.state.shownAlerts}/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

function intToRGB(i) {
    const c = (hashCode(i) & 0x00FFFFFF).toString(16).toUpperCase();
    return "00000".substring(0, 6 - c.length) + c;
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

export default connect(mapStateToProps, mapDispatchToProps)(Discussion);
