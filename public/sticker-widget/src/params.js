const userQuery = window.location.search;
const urlParam = new URLSearchParams(userQuery);
export const user = urlParam.get('user')
console.log(user);