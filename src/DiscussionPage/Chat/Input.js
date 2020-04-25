import { Component } from "react";
import React from "react";

class Input extends Component {
    state = {
        text: ""
    };

    onChange(e) {
        this.setState({text: e.target.value});
    }

    onSubmit(e) {
        e.preventDefault();
        this.props.onSendMessage(this.state.text);
        this.setState({text: ""});
    }

    render() {
        return (
            <div className="input row input-group mb-3">
                <input className="text-box form-control" onChange={e => this.onChange(e)} type="text"
                       placeholder={this.props.placeHolder} value={this.state.text} autoFocus={true}/>
                <button type="button" className="btn btn-outline-primary waves-effect btn-sm"
                        onClick={this.onSubmit.bind(this)}>Send
                </button>
            </div>
        );
    }
}

export default Input;
