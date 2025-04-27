"use client"

import { ColumnDef } from "@tanstack/react-table"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {RotateCcw} from "lucide-react";
import {Queue} from "@/services/queue";
import {useRetryMutation} from "@/hooks/use-queue";
import { format } from 'date-fns';



export const queueColumn: ColumnDef<Queue>[] = [
    {
        header: "No.",
        cell: ({row}:any)=> (
            <div>{row.index+1}</div>
        )
    },
    {
        accessorKey: "payload",
        header: "Payload"
    },
    {
        accessorKey: "status",
        header: "Status"
    },
    {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({row}:any) => {
            const data = row.original as Queue
            const fmtDate = format(data.created_at, "yyyy-MM-dd HH:mm")
            return (
                <div>
                    {fmtDate}
                </div>
            )
        }
    },
    {
        id: "Actions",
        header: () => (
            <div className={"flex justify-end mr-4"}>Actions</div>
        ),
        cell: ({row}:any) => {
            const data = row.original as Queue
            const disabled = data.status !== "failed"
            const {mutate} = useRetryMutation()

            return (
                <div className="flex justify-end gap-2 mr-4">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <RotateCcw
                                    className={`w-5 h-5 ${disabled ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer text-purple'}`}
                                    aria-disabled={disabled}
                                    onClick={() => {

                                        if (!disabled) {
                                            mutate({
                                                id:data.id
                                            })
                                        }

                                    }}
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Retry</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )
        }
    }
]