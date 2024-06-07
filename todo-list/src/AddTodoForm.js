import React from "react";

//add new todo form
export default class AddTodoForm extends React.Component{
    /**
     *
     */
    constructor(props) {
        super(props);
        this.state={
            todo:"",
            completed:false
        }
    }
    //handler for inputs change
    onChangeHandler = (event) => {
        const { name, value } = event.target;
        this.setState({ [name]: value });
    };
    //handler for form submit
    onSubmitHandler = (event) =>{
        event.preventDefault();
        this.props.onFormComplete(this.state.todo,this.state.completed)
    }
    render(){
        return(
            <div>
                <form onSubmit={this.onSubmitHandler} >
                    <label htmlFor="todo">Your task: </label>
                    <input type="text" id="todo" name="todo" onChange={this.onChangeHandler}></input><br></br>
                    <label htmlFor="completed">is completed: </label>
                    <input type="checkbox" id="completed" name="completed" onChange={this.onChangeHandler}></input>
                    <button type="submit">Add</button>
                </form>
            </div>
        );
    }
    
   
}