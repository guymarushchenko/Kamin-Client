import React, { Component } from 'react';
import Modal from 'react-bootstrap4-modal';
import io from 'socket.io-client';
import { connect } from "react-redux";
import './VisualizationsConfigModal.css'

class VisualizationsModal extends Component {
    constructor() {
        super();
        this.socket = io(process.env.REACT_APP_API);
        this.allSettings = {};
        this.state = {
            configType: '',
            regularUsers: [],
            error: ''
        }
    }

    componentDidMount() {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('load', (response) => {
            const allUsers = JSON.parse(xhr.responseText)['active_users'];
            allUsers.unshift('all');
            this.setState({
                regularUsers: allUsers,
                selectedUser: ''
            });
        });
        xhr.open('GET', process.env.REACT_APP_API + '/api/getActiveDiscussionUsers/' + this.props.discussionId);
        xhr.send();
    }

    updateVisibility = (isOpen) => {
        this.props.updateVisibility(isOpen);
    };

    updateUserVisualizations = (event) => {
        const username = this.allSettings[event.target.name];
        const elementToUpdate = event.target.className;
        if (event.target.name === 'all')
            this.handleConfigAll(event);
        else if (username === undefined) {
            if (this.allSettings['all'] !== undefined){
                this.allSettings[event.target.name] = {};
                this.handleConfigAll(event);
            }
            else {
                this.allSettings[event.target.name] = {
                    showGraph: this.state.regularUsers[event.target.name]['showGraph'],
                    showAlerts: this.state.regularUsers[event.target.name]['showAlerts'],
                    showStat: this.state.regularUsers[event.target.name]['showStat'],
                };
                this.allSettings[event.target.name][elementToUpdate] = event.target.checked;
                this.state.regularUsers[event.target.name][elementToUpdate] = event.target.checked;
            }
        }
        console.log(this.allSettings);
    };

    handleConfigAll = (event) => {
        if (Object.keys(this.allSettings).length > 1) {
            this.state.regularUsers.forEach(user => {
                if (this.allSettings[user] === undefined || this.allSettings[user] === {})
                    this.allSettings[user] = this.state.regularUsers[user];
                this.allSettings[user][event.target.className] = event.target.checked;
                this.state.regularUsers[event.target.name][event.target.className] = event.target.checked;
            });
        }
        else {
            if (this.allSettings['all'] === undefined)
                this.allSettings['all'] = {};
            this.allSettings['all'][event.target.className] = event.target.checked;
            this.state.regularUsers[event.target.name][event.target.className] = event.target.checked;
        }
    };

    updateConfig = () => {
        let type = 'all';
        if (this.allSettings['all'] === undefined || Object.keys(this.allSettings).length > 1)
            type = 'list';
        const configComment = JSON.stringify({
            'author': this.props.currentUser,
            'text': 'config',
            'parentId': this.props.lastMessage.parentId,
            'depth': this.props.lastMessage.depth,
            'discussionId': this.props.discussionId,
            'extra_data': {Recipients_type: type, users_list: this.allSettings}
        });
        this.socket.emit('change configuration', configComment);
        this.updateVisibility(false);
    };

    render() {
        return (
            <form onSubmit={this.updateConfig}>
                <Modal className="visualModal align-items-start" visible={this.props.isOpen}>
                    <div className="modal-header">
                        <h5 className="modal-title">Visualization Management</h5>
                    </div>
                    <div className="modal-body">
                        <table className="table">
                            <thead>
                            <tr>
                                <th>username</th>
                                <th>Graph</th>
                                <th>Statistics</th>
                                <th>Alerts</th>
                                <th/>
                            </tr>
                            </thead>
                            <tbody>
                            {Object.keys(this.state.regularUsers).map((id) =>
                                <tr id={this.state.regularUsers[id]} key={this.state.regularUsers[id]}>
                                    <td>{this.state.regularUsers[id]}</td>
                                    <td className="showGraph1">
                                        <input name={this.state.regularUsers[id]} type="checkbox"
                                               id={this.state.regularUsers[id] + " showGraph"}
                                               className="showGraph"
                                               onChange={(event) => this.updateUserVisualizations(event)}
                                        />
                                        <label htmlFor={this.state.regularUsers[id] + " showGraph"}/>
                                    </td>
                                    <td className="showStat1">
                                        <input name={this.state.regularUsers[id]} type="checkbox"
                                               id={this.state.regularUsers[id] + " showStat"}
                                               className="showStat"
                                               onChange={(event) => this.updateUserVisualizations(event)}
                                        />
                                        <label htmlFor={this.state.regularUsers[id] + " showStat"}/>
                                    </td>
                                    <td className="showAlerts1">
                                        <input name={this.state.regularUsers[id]} type="checkbox"
                                               id={this.state.regularUsers[id] + " showAlerts"}
                                               className="showAlerts"
                                               onChange={(event) => this.updateUserVisualizations(event)}
                                        />
                                        <label htmlFor={this.state.regularUsers[id] + " showAlerts"}/>
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-grey"
                                onClick={() => this.updateVisibility(false)}>Cancel
                        </button>
                        <button className="btn btn-info">OK</button>
                    </div>
                </Modal>
            </form>
        );
    }
}

const mapStateToProps = state => {
    return {
        currentUser: state.currentUser,
        token: state.token,
        userType: state.userType
    };
};

export default connect(mapStateToProps)(VisualizationsModal);
