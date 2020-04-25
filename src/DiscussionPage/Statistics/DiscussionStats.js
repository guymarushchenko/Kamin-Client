import React, { Component } from 'react';
import { connect } from 'react-redux';

class DiscussionStats extends Component {
    constructor(props) {
        super(props);
        this.state = {
            participants: 0,
            comments: 0,
            repliedMost: "",
            receivedMost: ""
        }
    }

    UNSAFE_componentWillReceiveProps() {
        this.calcDiscussionStats();
    }

    calcDiscussionStats() {
        let nodes = this.props.getShownNodes();
        if (nodes.length === 0) return;
        nodes.sort(function (a, b) { return b.comments - a.comments; });
        let maxComments = nodes[0].id;
        nodes.sort(function (a, b) { return b.commentsReceived - a.commentsReceived; });
        let maxReceivedComments = nodes[0].id;
        this.setState({
            participants: this.props.getShownNodes().length,
            comments: this.props.getShownMessages().length,
            repliedMost: maxComments,
            receivedMost: maxReceivedComments
        });
    }

    getDiscussionStats() {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('load', () => {
            if (xhr.status === 401) {
                this.props.onLogOut();
            }
            else {
                let stats = JSON.parse(xhr.responseText)["discussion_statistics"];
                this.setState({
                    participants: stats.num_of_participants,
                    comments: stats.total_comments_num,
                    repliedMost: stats.max_commented_user,
                    receivedMost: stats.max_responded_user
                })
            }
        });
        xhr.open('POST', process.env.REACT_APP_API + '/api/getDiscussionStatistics');
        xhr.setRequestHeader("Authorization", "Basic " + btoa(this.props.token + ":"));
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify({ discussionId: this.props.discussionId }));
    }

    render() {
        return (
            <div className="card card-stats">
                <div className="card-header p-1">
                    <h4 className="Card-title">Discussion Statistics</h4>
                </div>
                <div className="card-body p-1">
                    <div className="container">
                        <div className="row xs-2">
                            <div className="col">Participants:</div>
                            <div className="col">{this.state.participants}</div>
                        </div>
                        <div className="row xs-2">
                            <div className="col">Comments:</div>
                            <div className="col">{this.state.comments}</div>
                        </div>
                        <div className="row xs-2">
                            <div className="col">Replied Most Comments:</div>
                            <div className="col">{this.state.repliedMost}</div>
                        </div>
                        <div className="row xs-2">
                            <div className="col">Received Most Comments:</div>
                            <div className="col">{this.state.receivedMost}</div>
                        </div>
                    </div>
                </div>
                {/* <CardFooter>
                    <div className="stats">
                        <i className="now-ui-icons ui-2_time-alarm" /> Last 7 days
                  </div>
                </CardFooter> */}
            </div>
        );
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        onLogOut: () => dispatch({ type: 'LOGOUT' })
    };
};

export default connect(null, mapDispatchToProps)(DiscussionStats);
