import React, { Component } from 'react';
import { connect } from 'react-redux'

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: '',
            submitted: false,
            loginMessage: '',
            messageType: ''
        };
    }

    handleChange = (e) => {
        const {name, value} = e.target;
        this.setState({[name]: value});
    };

    handleSubmit = (e) => {
        e.preventDefault();
        this.setState({submitted: true});
        const {username, password} = this.state;
        if (username && password) {
            const xhr = new XMLHttpRequest();
            xhr.addEventListener('load', () => {
                let token = JSON.parse(xhr.responseText)['token'];
                let userType;
                switch (JSON.parse(xhr.responseText)['permission']) {
                    case 1:
                        userType = 'USER';
                        break;
                    case 2:
                        userType = 'MODERATOR';
                        break;
                    case 3:
                        userType = 'ROOT';
                        break;
                    default:
                        userType = 'USER';
                }
                this.props.onLogin(username, token, userType);
                setTimeout(() => this.props.history.push('/'), 1500);
                this.setState({
                    loginMessage: 'Login successfully! Redirecting to the homepage.',
                    messageType: 'text-success'
                })
            });
            xhr.addEventListener('progress', () => {
                this.setState({
                    loginMessage: 'Incorrect username or password.',
                    messageType: 'text-danger'
                })
            });
            xhr.open('GET', process.env.REACT_APP_API + '/api/login');
            xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
            xhr.send();
        }
    };

    render() {
        const {username, password, submitted} = this.state;
        return (
            <React.Fragment>
                <div className="container col-md-2 p-5">
                    <h2>Login</h2>
                    <form name="form" onSubmit={this.handleSubmit}>
                        <div>
                            <label htmlFor="username">Username</label>
                            <input type="text" className="form-control" name="username" value={username}
                                   onChange={this.handleChange}/>
                            {submitted && !username &&
                            <div className="help-block text-danger">Username is required</div>
                            }
                        </div>
                        <div>
                            <label htmlFor="password">Password</label>
                            <input type="password" className="form-control" name="password" value={password}
                                   onChange={this.handleChange}/>
                            {submitted && !password &&
                            <div className="help-block text-danger">Password is required</div>
                            }
                        </div>
                        <div className="form-group">
                            <button className="btn btn-primary">Login</button>
                        </div>
                    </form>
                </div>
                {submitted ? <h3 className={"confirmMessage text-center " + this.state.messageType}>
                    <b>{this.state.loginMessage}</b></h3> : null}
            </React.Fragment>
        );
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        onLogin: (username, token, userType) => dispatch({
            type: 'LOGIN',
            payload: {username: username, token: token, userType: userType}
        })
    };
};

export default connect(null, mapDispatchToProps)(Login);
