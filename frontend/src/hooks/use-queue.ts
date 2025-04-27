import {
    BaseApiResponse,
    FilterQueue,
    getAllQueue,
    postQueue,
    PostQueue,
    Queue,
    retryQueue,
    RetryQueue
} from "@/services/queue";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useState} from "react";

const useQueue = (param:FilterQueue) => {
    const {isLoading, data,refetch} = useQuery<BaseApiResponse<Queue[]>>({
        queryKey: ["queue", param],
        queryFn: () => getAllQueue(param),
    })

    return {isLoading, data,refetch}
}

const useQueueMutation = () => {
    const queryClient = useQueryClient();
    const [errorMsg, setErrorMsg] = useState<string|null>(null)
    const {isPending, mutate} = useMutation({
        mutationFn: async (payload:PostQueue) => {
            return await postQueue(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["queue"]})
            setErrorMsg(null)
        },
        onError: (err:any) => {
            setErrorMsg(err.message);
        }
    })

    return {isPending, mutate,errorMsg}
}

const useRetryMutation = () => {
    const queryClient = useQueryClient();

    const {isPending, mutate, isError} = useMutation({
        mutationFn: (payload:RetryQueue) => {
            return retryQueue(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["queue"]})
        },
        onError: (err) => {
            console.log(`Error mutate retry queue ${err}`)
        }
    })

    return {isError, isPending, mutate}
}


export {useQueue, useQueueMutation, useRetryMutation}