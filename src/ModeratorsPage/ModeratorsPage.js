import React, { Component } from 'react';
import { connect } from 'react-redux'

class Moderators extends Component {
    constructor(props) {
        super(props);
        this.state = {
            regularUsers: [],
            moderatorUsers: [],
            selectedRegularUser: null,
            selectedModeratorUser: null,
            submitted: false,
            statusMessage: '',
            messageType: ''
        };
    }

    handleChange = (event) => {
        const {name, value} = event.target;
        if (value !== "")
            this.setState({
                [name]: value
            });
    };

    componentDidMount() {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('load', () => {
            if (xhr.status === 401) {
                this.props.onLogOut();
            }
            else {
                this.setState({
                    regularUsers: JSON.parse(xhr.responseText)['users'],
                    moderatorUsers: JSON.parse(xhr.responseText)['moderators']
                })
            }
        });
        xhr.open('GET', process.env.REACT_APP_API + '/api/getUsers');
        xhr.setRequestHeader("Authorization", "Basic " + btoa(this.state.token));
        xhr.send();
    }

    handleSaveClick = () => {
        if (this.state.selectedRegularUser === null && this.state.selectedModeratorUser === null) {
            this.setState({
                statusMessage: 'At least one of the options must be selected!',
                messageType: 'text-danger',
                submitted: true
            })
        }
        const xhr = new XMLHttpRequest();
        if (this.state.selectedRegularUser !== null) {
            xhr.open('POST', process.env.REACT_APP_API + '/api/changeUserPermission');
            xhr.setRequestHeader("Authorization", "Basic " + btoa(this.props.token + ":"));
            xhr.send(JSON.stringify({
                username: this.state.selectedRegularUser,
                permission: 2
            }));
        }

        if (this.state.selectedModeratorUser !== null) {
            xhr.open('POST', process.env.REACT_APP_API + '/api/changeUserPermission');
            xhr.setRequestHeader("Authorization", "Basic " + btoa(this.props.token + ":"));
            xhr.send(JSON.stringify({
                username: this.state.selectedModeratorUser,
                permission: 1
            }));
        }
        xhr.addEventListener('load', () => {
            this.setState({
                statusMessage: 'The changes were saved successfully!',
                messageType: 'text-success',
                submitted: true
            });
            setTimeout(() => window.location.reload(), 1500);
        })
    };

    render() {
        return (
            <div className="container p-5 text-center">
                <h2 className="pb-5">Moderators Management</h2>
                <div className="input-group mb-3 w-50 mx-auto">
                    <label className="text-danger">Revoke moderation powers:</label>
                    <select className="custom-select w-25 mb-2" id="inputRevoke" name="selectedModeratorUser"
                            onChange={this.handleChange} defaultValue="">
                        <option value="">Choose...</option>
                        {this.state.moderatorUsers.map((user) =>
                            <option key={user} value={user}>{user}</option>)}
                    </select>
                    <label className="text-success">Give moderation powers:</label>
                    <select className="custom-select w-25" id="inputGrand" name="selectedRegularUser"
                            onChange={this.handleChange} defaultValue="">
                        <option value="">Choose...</option>
                        {this.state.regularUsers.map((user) =>
                            <option key={user} value={user}>{user}</option>)}
                    </select>
                </div>
                <button type="button mx-auto" className="btn btn-primary" onClick={this.handleSaveClick}>Save</button>
                {this.state.submitted ? <h3 className={"confirmMessage text-center " + this.state.messageType}>
                    <b>{this.state.statusMessage}</b></h3> : null}
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        currentUser: state.currentUser,
        token: state.token
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        onLogOut: () => dispatch({ type: 'LOGOUT' })
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Moderators);
