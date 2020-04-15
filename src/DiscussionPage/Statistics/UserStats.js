import React, { Component } from 'react';
import { connect } from 'react-redux'


class UserStats extends Component {
    constructor(props) {
        super(props);
        this.state = {
            commentsWritten: 0,
            usersResponded: 0,
            commentsReceived: 0,
            repliedUsers: 0,
            wordsWritten: 0,
        }
    }

    // componentDidMount() {
    //     this.getUserStats();
    // }

    UNSAFE_componentWillReceiveProps (){
        this.calcUserStats();
    }

    calcUserStats() {
        let commentsWritten = 0;
        let wordsNumber = 0;
        let usersResponded = 0;
        let commentsReceived = 0;
        let repliedUsers = 0;
        this.props.getShownLinks().forEach(link => {
            if (link.source.id === this.props.currentUser){
                usersResponded++;
            }
            if (link.target.id === this.props.currentUser){
                repliedUsers++;
                commentsReceived += link.name;
            }
        });
        this.props.getShownMessages().forEach(message => {
            if (message.author === this.props.currentUser){
                commentsWritten++;
                wordsNumber += message.text.split(' ').length;
            }
        });
        this.setState({
            commentsWritten: commentsWritten,
            usersResponded: usersResponded,
            commentsReceived: commentsReceived,
            repliedUsers: repliedUsers,
            wordsWritten: wordsNumber
        });
    };

    getUserStats() {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('load', (res) => {
            if (res.status === 400) {
                // this.alert.show("Create Discussion Failed! No title or description");
                console.log("Get User stats failed - status 400");
            }
            let stats = JSON.parse(xhr.responseText)["user_in_discussion_statistics"];
            this.setState({
                commentsWritten: stats.num_of_comments,
                usersResponded: stats.num_of_commented_users,
                commentsReceived: stats.num_of_responses,
                repliedUsers: stats.responded_users,
                wordsWritten: stats.total_words,
            })
        });
        xhr.addEventListener('error', (res) => console.log(res));
        // xhr.addEventListener('abort', (res)=> console.log(res));

        xhr.open('POST', process.env.REACT_APP_API + '/api/getUserStatisticsInDiscussion');
        xhr.setRequestHeader("Authorization", "Basic " + btoa(this.props.token + ":"));
        xhr.setRequestHeader("Content-Type", "application/json");
        if (this.props.currentUser) {
            xhr.send(JSON.stringify({username: this.props.currentUser, discussionId: this.props.discussionId}));
            this.setState({username: this.props.currentUser})
        } else {
            xhr.send(JSON.stringify({username: this.props.currentUser, discussionId: this.props.discussionId}));
            this.setState({username: this.props.currentUser})
        }
    }

    render() {
        return (
            <div className="card card-stats">
                <div className="card-header p-1">
                    <h4 className="Card-title">Statistics of {this.props.currentUser} </h4>
                </div>
                <div className="card-body p-1">
                    <div className="container">
                        <div className="row xs-2">
                            <div className="col-8">Comments Written:</div>
                            <div className="col">{this.state.commentsWritten}</div>
                        </div>
                        <div className="row xs-2">
                            <div className="col-8">Responded Users:</div>
                            <div className="col">{this.state.usersResponded}</div>
                        </div>
                        <div className="row xs-2">
                            <div className="col-8">Comments Received:</div>
                            <div className="col">{this.state.commentsReceived}</div>
                        </div>
                        <div className="row xs-2">
                            <div className="col-8">Users Replied:</div>
                            <div className="col">{this.state.repliedUsers}</div>
                        </div>
                        <div className="row xs-2">
                            <div className="col-8">Words Written:</div>
                            <div className="col">{this.state.wordsWritten}</div>
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

const mapStateToProps = state => {
    return {
        currentUser: state.currentUser,
        userType: state.userType
    };
};

export default connect(mapStateToProps)(UserStats);
