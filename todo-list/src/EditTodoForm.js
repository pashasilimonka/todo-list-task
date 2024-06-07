import React from "react";
//edit todo form
export default class EditTodoForm extends React.Component{
    constructor(props) {
        super(props);
        this.state={
            todo: this.props.todo,
            completed: this.props.completed
        }
    }
    //hadler for saving changed inputs
    onChangeHandler = (event) => {
        const { name, value, checked } = event.target;
        const newValue = name === 'completed' ? checked : value;
        this.setState({ [name]: newValue });
    };
    //handler for form submit
    onSubmitHandler = (event) =>{
        event.preventDefault();
        this.props.onEditFormComplete(this.props.id, this.state.todo, this.state.completed);
    }

    render(){
        return(
            <td className="edit-form">
                <form onSubmit={this.onSubmitHandler}>
                    <input type="text" id="todo" name="todo" value={this.state.todo} onChange={this.onChangeHandler}></input>
                    <input type="checkbox" id="completed" name="completed" checked={this.state.completed} onChange={this.onChangeHandler}></input>
                    <button  type="submit">Save</button>
                </form>
            </td>
        );
    }  
}