import axios from "axios";

axios.defaults.baseURL = "https://jsonplaceholder.typicode.com";
axios.defaults.headers.post["Content-Type"] = "application/json";

export const request = (method, url, data) => {
    let headers = {};

    return axios({
        method:method,
        headers:headers,
        url:url,
        data:data
    });
}