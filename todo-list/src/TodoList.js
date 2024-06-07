import "./App.css";
import React from "react";
import { request } from "./axios-helper";
import AddTodoForm from "./AddTodoForm";
import EditTodoForm from "./EditTodoForm";

//main component 
export default class TodoList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            total:0,
            pages: [],
            showForm: false,
            editTodoId:0
        };
    }
    //Component loading function
    componentDidMount() {
        window.addEventListener('beforeunload', this.clearLocalStorage);
        const currentPage = JSON.parse(localStorage.getItem("currentPage")) || 0;
        this.fetchData();
        this.spliceOnPages(currentPage);
    }
    componentWillUnmount() {
        window.removeEventListener('beforeunload', this.clearLocalStorage);
    }

    clearLocalStorage = () => {
        localStorage.clear();
    };
    //Setting list of pages 
    setPages = (totalCount) => {
        let pages = [];
        for (let i = 0; i <= Math.ceil(totalCount / 10) - 1; i++) {
            pages.push(i);
        }
        return pages;
    }
    //slicing function for pagination
    spliceOnPages = (currentPage) => {
        //If sliced page already loaded, just change state
        const cachedData = localStorage.getItem(`todos_page_${currentPage}`);
        if (cachedData) {
            this.setState({
                data: JSON.parse(cachedData)
            });
        } else {
            //else i load all list of todos to slice it
            const allTodos = JSON.parse(localStorage.getItem("todos"));
            if (allTodos) { 
                //counting start and stop indexes
                const lastIndex = (currentPage + 1) * 10;
                const firstIndex = lastIndex - 10;

                const pagedTodos = allTodos.slice(firstIndex, lastIndex); //slice whole list, get a list for page and save it in state
                this.setState({ data: pagedTodos });
                localStorage.setItem(`todos_page_${currentPage}`, JSON.stringify(pagedTodos)); // save it in local storage so it could be just loaded
            } else {
                console.error("Todos not found or is not an array");
            }
        }
    }

    fetchData = () => {
        //Checking if list is already loaded and just change state if it is
        const cachedData = localStorage.getItem("todos");
        if (cachedData) {
            const totalTodos = JSON.parse(cachedData).length;
            this.setState({
                pages: this.setPages(totalTodos),
                total: totalTodos
            });
        } else {
            request("GET", `/todos`, {})
                .then((response) => {
                    const totalTodos = response.data.length;
                    this.setState({
                        pages: this.setPages(totalTodos),
                        total: totalTodos
                    });// if it is not loaded i make a request to API to load it
                    localStorage.setItem("todos", JSON.stringify(response.data));
                    localStorage.setItem("pages", JSON.stringify(this.setPages(totalTodos))); // save pages and list to local storage
                })
                .catch((error) => {
                    console.log(`An error occurred: ${error}`);
                    this.setState({ data: [] });
                });
        }
    }

    updateData = (data) => {
        //save new todo in the whole list, so it could be loaded from it
        const allTodos = JSON.parse(localStorage.getItem("todos")) || [];
        allTodos.push(data);
        localStorage.setItem("todos", JSON.stringify(allTodos));
        //getting the last page of list to add it in the last page
        const lastPage = Math.ceil(allTodos.length / 10) - 1;
        let fetchedData = JSON.parse(localStorage.getItem(`todos_page_${lastPage}`));

        if (!fetchedData) {
            fetchedData = [];
        }
        // if the last page is not full, i add new todo into it
        if (fetchedData.length < 10) {
            fetchedData.push(data);
            this.setState((prevState) => ({
                data: fetchedData,
                total: prevState.total + 1,
                pages: this.setPages(prevState.total + 1)
            }));
            localStorage.setItem(`todos_page_${lastPage}`, JSON.stringify(fetchedData));
        } else {
            //if the last page is full, i make a new page and add new todo into it
            const newFetchedData = [data];
            localStorage.setItem(`todos_page_${lastPage + 1}`, JSON.stringify(newFetchedData));
            this.setState((prevState) => ({
                data: newFetchedData,
                pages: this.setPages(prevState.total + 1),
                total: prevState.total + 1
            }));
        }

        localStorage.setItem("pages", JSON.stringify(this.setPages(allTodos.length)));
    }
    //this function works when you go to the next page
    onPageChange = (nextPage) => {
        if (this.state.currentPage !== nextPage) {
            localStorage.setItem("currentPage", JSON.stringify(nextPage));
            this.setState({ currentPage: nextPage }, () => {
                this.spliceOnPages(nextPage);
            });
        }
    }
    // this function shows/hides AddNewTodoForm
    onShowFormClick = () => {
        this.setState({ showForm: !this.state.showForm });
    }
    //This function submits new todo
    onFormComplete = (todo, complete) => {
        const newTodo = {
            id: this.state.total + 1,
            title: todo,
            completed: complete
        };
        //make a POST request to API
        request("POST", "/todos", JSON.stringify(newTodo))
            .then((response) => {
                console.log(response);
                this.updateData(newTodo); //because API only fakes POST request, i save all changes to local storage
                this.setState({ showForm: !this.state.showForm });
            })
            .catch((error) => {
                console.log(`An error occurred: ${error}`);
            });
    }
    //this function submits an edited todo
    onEditFormComplete = (id, todo, completed) =>{
        //make a PUT request to API
        request(
            "PUT",
            `/todos/${id}`,
            {
                id:id,
                title:todo,
                completed:completed
            }
        ).then((response) =>{ // because API only fakes a PUT request, i save all changes to local storage
            const cachedTodos = JSON.parse(localStorage.getItem("todos"));
            if(cachedTodos){
                const index = cachedTodos.findIndex(item => item.id === response.data.id); //find index of edited todo
                if(index!==-1){
                    const newData = [...cachedTodos];
                    newData[index] = response.data; // change old todo with a new one
                    localStorage.setItem("todos", JSON.stringify(newData)); // save all changes to local storage
                    const currentPage = JSON.parse(localStorage.getItem("currentPage")) || 0;
                    Object.keys(localStorage).forEach((key) => {
                    if (key.startsWith('todos_page_')) {
                        localStorage.removeItem(key); // deleted saved pages because the whole list was changed
                    }
                    });
                    this.spliceOnPages(currentPage); // remake page 
                    this.setState({editTodoId:0}); // hide edit form
                }
            }
        }).catch((error) =>{
            console.log(`An error occurred: ${error}`);
        })
    }
    onDeleteTodo = (id) => {
        //make a DELETE request to API
        request(
            "DELETE",
            `todos/${id}`,
            {}
        ).then(() => { // because API fakes DELETE request, i have to save theese changes to local storage
            const cachedTodos = JSON.parse(localStorage.getItem("todos"));
            if (cachedTodos) {
                const newTodos = cachedTodos.filter(function (value) {
                    return value.id !== id; //filter whole list into new one without deleted todo
                });
                localStorage.setItem("todos", JSON.stringify(newTodos)); //save new list
                const currentPage = JSON.parse(localStorage.getItem("currentPage")) || 0;
                Object.keys(localStorage).forEach((key) => {
                    if (key.startsWith('todos_page_')) {
                        localStorage.removeItem(key); // remove all pages
                    }
                });
                this.setState((prevState)=>({
                    pages: this.setPages(newTodos.length),
                    total: prevState.total-1
                }));
                localStorage.setItem("pages", JSON.stringify(this.setPages(newTodos.length)));
                this.spliceOnPages(currentPage); // refresh current page data
               
            }
        }).catch((error) => {
            console.log(`An error occurred: ${error}`);
        });
    }
    render() {
        return (
            <div className="App">
                <div className="todo-list">
                    <h1>Todo List app by Pavlo Sylymonka</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>№</th>
                                <th>Task</th>
                                <th>Completed</th>
                                <th></th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.data && this.state.data.length > 0 ? (
                                this.state.data.map((todo) => (
                                    <tr>
                                        <td>{todo.id}</td>
                                        <td>{todo.title}</td>
                                        <td><input type="checkbox" readOnly={true} checked={todo.completed}></input></td>
                                        <td>
                                            {this.state.editTodoId === todo.id ? (
                                                <EditTodoForm todo={todo.title} completed={todo.completed} id={todo.id} onEditFormComplete={this.onEditFormComplete} ></EditTodoForm>
                                            ) : (
                                                <button onClick={() => this.setState({ editTodoId: todo.id })}>Edit</button>
                                            )}
                                        </td>
                                        <td>
                                            {
                                                this.state.editTodoId === todo.id?(
                                                    <button onClick={() =>{this.setState({editTodoId: 0})}}>Hide</button>
                                                ):(
                                                <button onClick={() =>{this.onDeleteTodo(todo.id)}}>Delete</button>
                                            ) }
                                            
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5">No todos available</td>
                                </tr>
                            )}
                            <tr>
                                <td colSpan={5}>
                                    <div>
                                        {this.state.pages.map((page) => (
                                            <button key={page} onClick={() => this.onPageChange(page)}>{page + 1}</button>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <button onClick={this.onShowFormClick}>{!this.state.showForm ? "New todo" : "Hide form"}</button>
                    {this.state.showForm && <AddTodoForm onFormComplete={this.onFormComplete} />}
                </div>
            </div>
        );
    }
}

