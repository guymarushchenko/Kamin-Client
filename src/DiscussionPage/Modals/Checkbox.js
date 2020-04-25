import React from 'react';
import './Checkbox.css';


const CheckBox = (props) => {
    return (
        <label className="configCheckBox">
            {props.text}
            <input type="checkbox" onChange={() => { props.changeHandler(props.text) }} checked={props.checked} />
            <span className="checkmark" />
        </label>
    );
}

export default CheckBox;