
export const getLS = (key: string) => {
    if(localStorage !== undefined){
        return localStorage.getItem(key);
    }
    return null;
  }

  export const setLS = (key: string, value: string) => {
    if(localStorage !== undefined){
        localStorage.setItem(key, value);
    }
  }
