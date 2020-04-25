import React, { Component } from 'react';
import { connect } from 'react-redux'
import Modal from 'react-bootstrap4-modal';
import "./CreateDiscussionModal.css"
import CheckBox from './Checkbox';


class CreateDiscussionModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            description: '',
            title: '',
            submitted: false,
            replyPosition: "None",
            graphChecked: true,
            statsChecked: true,
            alertsChecked: true,
        };
        this.configuration = { default_config: { "graph": true, "alerts": true, "statistics": true }, replyPosition: "None" }
    }

    handleChange = (e) => {
        const { name, value } = e.target;
        this.setState({ [name]: value });
    };

    vizConfigChange = (type) => {
        this.configuration.default_config[type] = !this.configuration.default_config[type];
        if (type === "graph") {
            this.setState({ graphChecked: this.configuration.default_config[type] })
        }
        if (type === "statistics") {
            this.setState({ statsChecked: this.configuration.default_config[type] })
        }
        if (type === "alerts") {
            this.setState({ alertsChecked: this.configuration.default_config[type] })
        }
    };

    replyConfigChange = (type) => {
        this.setState({ replyPosition: type });
        this.configuration.replyPosition = type;
    };

    changePath = (path) => {
        this.props.path.push(path);
    };

    createDiscussion = () => {
        this.setState({ submitted: true });
        const { description, title } = this.state;
        if (description && title) {
            const xhr = new XMLHttpRequest();
            xhr.addEventListener('load', () => {
                if (xhr.status === 401) {
                    this.props.onLogOut();
                }
                else {
                    let discussion_id = JSON.parse(xhr.responseText)["discussion_id"];
                    this.changePath('/Discussion/false/' + discussion_id);
                    this.updateVisibility(false)
                }
            });
            xhr.open('POST', process.env.REACT_APP_API + '/api/createDiscussion');
            xhr.setRequestHeader("Authorization", "Basic " + btoa(this.props.token + ":"));
            xhr.setRequestHeader("Content-Type", "application/json");
            const comment = {
                "author": this.props.currentUser,
                "text": description,
                "parentId": null,
                "discussionId": "",
                "extra_data": null,
                "timestamp": null,
                "depth": 0
            };
            xhr.send(JSON.stringify({ title: title, categories: [], root_comment_dict: comment, configuration: this.configuration }));
        }
    };


    updateVisibility = (isOpen) => {
        this.props.updateVisibility(isOpen);
    };

    render() {
        const { description, title, submitted } = this.state;
        return (
            <Modal visible={this.props.isOpen}>

                {/* onClickBackdrop={this.modalBackdropClicked}> */}
                <div className="modal-header">
                    <h5 className="modal-title">Create New Discussion</h5>
                </div>
                <div className="modal-body">
                    <div>
                        <p className="title">Title:</p>
                        <input type="text" className="title-input" value={this.state.title} name="title"
                            placeholder="Enter Title" onChange={this.handleChange.bind(this)} />
                        {submitted && !title &&
                            <div className="help-block text-danger">Title is required</div>
                        }
                    </div>
                    <div>
                        <p className="description">Description:</p>
                        <textarea className="description-input" name="description" value={this.state.description}
                            placeholder={"Write Something"} onChange={this.handleChange.bind(this)}
                        />
                        {submitted && !description &&
                            <div className="help-block text-danger">Description is required</div>
                        }
                    </div>
                    <div>
                        <label className="config">Visualization Config:</label>
                        <CheckBox changeHandler={this.vizConfigChange} text="graph" checked={this.state.graphChecked} />
                        <CheckBox changeHandler={this.vizConfigChange} text="statistics" checked={this.state.statsChecked} />
                        <CheckBox changeHandler={this.vizConfigChange} text="alerts" checked={this.state.alertsChecked} />
                        <div className="dropdown">
                            <label>Default reply position: </label>
                            <button className="btn btn-sm btn-primary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                {this.state.replyPosition}
                            </button>
                            <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                <a href='/#' onClick={() => { this.replyConfigChange("None") }} className="dropdown-item">None</a>
                                <a href='/#' onClick={() => { this.replyConfigChange("Root") }} className="dropdown-item">Root</a>
                                <a href='/#' onClick={() => { this.replyConfigChange("Last") }} className="dropdown-item">Last</a>
                            </div>
                        </div>
                    </div>


                </div>
                <div className="modal-footer">
                    <button type="button" onClick={() => this.updateVisibility(false)} className="btn btn-grey">Cancel
                    </button>
                    <button className="btn btn-info" onClick={() => this.createDiscussion(description, title)}>Create
                    </button>
                </div>
            </Modal>
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

export default connect(mapStateToProps, mapDispatchToProps)(CreateDiscussionModal);
