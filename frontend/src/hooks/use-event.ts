"use client"

import {useState,useEffect} from "react";

export const useEvent = () => {
    const [eventMsg, setEventMsg] = useState<string | null>(null)
    useEffect(() => {
        const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_API_BASE_URL}/queue/events`);

        eventSource.onmessage = (e) => {
            setEventMsg(e.data);
        };

        eventSource.onerror = (e) => {
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);

    return {eventMsg}
}