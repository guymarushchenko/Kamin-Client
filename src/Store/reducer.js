const initialState = {
    currentUser: localStorage.getItem('currentUser'),
    token: localStorage.getItem('token'),
    userType: localStorage.getItem('userType')
};

const reducer = (state = initialState, action) => {
    if (action.type === 'LOGIN') {
        localStorage.setItem('currentUser', action.payload["username"]);
        localStorage.setItem('token', action.payload["token"]);
        localStorage.setItem('userType', action.payload["userType"]);
        return {
            currentUser: action.payload["username"],
            token: action.payload["token"],
            userType: action.payload["userType"]
        }
    } else if (action.type === 'LOGOUT') {
        localStorage.setItem('currentUser', '');
        localStorage.setItem('token', '');
        localStorage.setItem('userType', '');
        return {
            currentUser: '',
            token: '',
            userType: ''
        }
    }
    return state;
};

export default reducer;
