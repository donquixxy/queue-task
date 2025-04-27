import {apiInstance} from "@/lib/api";

export interface BaseApiResponse<T> {
    message: string;
    data: T;
}

export interface FailedResponse {
    message:string
}


export interface Queue {
    id:string
    payload:string
    status:string
    created_at:Date
    processed_at?:Date
}

export interface PostQueue {
    payload:string
}

export interface FilterQueue {
    sorted_by:string
}

export interface RetryQueue {
    id:string
}


const postQueue = async (payload: PostQueue): Promise<BaseApiResponse<Queue>> => {
    try {
        const result = await apiInstance.post("/queue", payload);
        return result.data;
    } catch (error: any) {
        throw Error(error.response?.data.message);
    }
};

const getAllQueue = async (filter:FilterQueue):Promise<BaseApiResponse<Queue[]>> => {
   try {
       const result = await apiInstance.get("/queue", {
           params:{
               sorted_by:filter.sorted_by
           }
       })

       return result.data
   }catch (error:any) {
       throw Error(error.response?.data.message);
   }
}

const retryQueue = async (payload: RetryQueue) => {
    try {
        const result = await apiInstance.put(`/queue/${payload.id}/retry`);

        return result.data
    }catch (error:any) {
        throw Error(error.response?.data.message);
    }
};


export {postQueue, getAllQueue, retryQueue}