export type RESTAPI_PARAMS = {
    method: RequestMethod,
    baseURL: string,
    path: string,
    body?: object | undefined,
    queryParams?: Map<string, any>
}

export enum RequestMethod {
    GET = "GET",
    POST = "POST",
}

export type FetchOption = {
    body?: any,
    method: string,
    headers: any
}

const getFetchOptions = (method: string) => {
    return {
        method,
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        }
    }
}

export function restAPI(params: RESTAPI_PARAMS): Promise<any | void> {
    return new Promise(async (resolve, reject) => {
        const fetchOptions: FetchOption = getFetchOptions(params.method);
        if(params.method === RequestMethod.POST) {
            fetchOptions.body = JSON.stringify(params.body);
        }
        const queryParamsArray = [];
        let queryParamString = "";
        if(params.queryParams) {
            for (const [key, value] of params.queryParams) {
                queryParamsArray.push(key+"="+value);
            }
            queryParamString = queryParamsArray.join("&");
        }
        fetch(`${params.baseURL}${params.path}?${queryParamString}`, fetchOptions)
            .then(response => response.json())
            .then((response) => {
                resolve(response);
            })
            .catch((error) => {
                reject(error);
            });
    });
}
