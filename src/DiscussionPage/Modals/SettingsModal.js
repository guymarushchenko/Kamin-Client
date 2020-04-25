import React, { Component } from 'react';
import Modal from 'react-bootstrap4-modal';
import io from "socket.io-client";

class SettingsModal extends Component {
    constructor() {
        super();
        this.socket = io(process.env.REACT_APP_API);
    }

    updateVisibility = (isOpen) => {
        this.props.updateVisibility(isOpen);
    };

    render() {
        return (
            <Modal visible={this.props.isOpen} onClickBackdrop={this.modalBackdropClicked}>
                <div className="modal-header">
                    <h5 className="modal-title">Settings</h5>
                </div>
                <div className="modal-body">
                    <form onSubmit={this.createDiscussion}>
                        <p className={"title"}>Which screens would you like to present?</p>
                        <input className="graph" type="checkbox" checked="checked"/><span
                        className="container">Graph</span>
                        <input className="alerts" type="checkbox" checked="checked"/><span
                        className="container">Alerts</span>
                        <input className="statistics" type="checkbox" checked="checked"/><span className="container">User Statistics</span>
                        <p className={"title"}>Which message would you like as the default response will refer to?</p>
                        <div className={"defaultMessage"}>
                            <label className="container"><input className="first" type="radio" name="radio"/>First
                                message
                                <span className="checkmark"/>
                            </label>
                            <label className="container"><input className="last" type="radio" name="radio"/>Last message
                                <span className="checkmark"/>
                            </label>
                            <label className="container"><input className="none" type="radio" name="radio"/>None (only
                                by user choice)
                                <span className="checkmark"/>
                            </label>
                        </div>
                    </form>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-primary">OK
                    </button>
                </div>
            </Modal>
        );
    }
}

export default SettingsModal;
