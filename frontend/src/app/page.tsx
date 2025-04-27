"use client"
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";
import {SiteHeader} from "@/components/site-header";
import {AppSidebar} from "@/components/app-sidebar";
import Card from "@/components/ui/card";
import {DataTable} from "@/components/data-table";
import {queueColumn} from "@/app/column";
import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent, DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {useQueue, useQueueMutation} from "@/hooks/use-queue";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useEvent} from "@/hooks/use-event";
import {toast} from "sonner";


export default function HomePage () {
    const [payload, setPayload] = useState("")
    const [isOpenDialog, setIsOpenDialog] = useState(false)
    const [errMsg, setErrMsg] = useState<string|null> (null)

    const {data, isLoading,refetch} = useQueue({
        sorted_by: "desc",
    })

    const {eventMsg} = useEvent()

    useEffect(() => {
        toast.custom((_) => (
            <div className="p-4 bg-white rounded-md shadow text-black text-sm">
                <div className="font-bold mb-1">Queue has been Processed</div>
                <div>{eventMsg}</div>
            </div>
        ))
        refetch()
    }, [eventMsg]);

    const useCounter = useMemo(()=> {
        const counter = {
            success:0,
            failed:0,
            unprocessed:0,
            processing:0
        }

        if (data && data.data && data.data.length > 0) {
            for (const val of data.data) {
                if (val.status == "success") {
                    counter.success++
                }

                if (val.status == "failed") {
                    counter.failed++
                }

                if (val.status == "unprocessed") {
                    counter.unprocessed++
                }

                if (val.status == "processing") {
                    counter.processing++
                }
            }
        }

        return counter
    },[data])



        const {mutate,errorMsg, isPending} = useQueueMutation()

    const handleSubmit = async () => {
        mutate({
            payload:payload
        }, {
            onSuccess: () => {
                setIsOpenDialog((val)=>!val)
                setErrMsg(null)
            },
            onError: (err:any) => {
                setErrMsg(err.message)
            }
        })
    }

    const handleCloseDialog = (val:boolean) => {
        setIsOpenDialog(val)
        setErrMsg(null)
    }


  return (
      <div className="[--header-height:calc(theme(spacing.14))]">
          <SidebarProvider className="flex flex-col">
              <SiteHeader/>
              <div className="flex">
                  <AppSidebar/>
                  <SidebarInset className={"p-8"}>
                      <div className="grid auto-rows-min gap-3 md:grid-cols-4">
                          <Card color="bg-green-100 text-green-800" title="Success" count={useCounter.success}/>
                          <Card color="bg-red-100 text-red-800" title="Failed" count={useCounter.failed}/>
                          <Card color="bg-yellow-100 text-yellow-800" title="Unprocessed" count={useCounter.unprocessed}/>
                          <Card color="bg-blue-100 text-blue-800" title="Processing" count={useCounter.processing}/>
                      </div>


                      <div className={"h-screen mt-4"}>
                          <div className={"flex justify-end items-end my-3"}>
                            <Dialog open={isOpenDialog} onOpenChange={handleCloseDialog}>
                                <DialogTrigger asChild>
                                    <Button onClick={()=>{
                                        setIsOpenDialog(!isOpenDialog)
                                    }} className={"hover:bg-purple cursor-pointer bg-purple"}>
                                        Create New
                                    </Button>
                                </DialogTrigger>
                                <DialogContent onInteractOutside={(e)=>e.preventDefault()} onEscapeKeyDown={(e)=>e.preventDefault()} className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Publish New Queue</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-2">
                                        <Label htmlFor="payload">
                                            Payload:
                                        </Label>
                                        <Textarea onChange={(val)=>setPayload(val.target.value)} placeholder='{"message": "ok"}' className="w-full"/>
                                        {errMsg && <p className={"text-red-400 text-sm"}>{errMsg}</p>}
                                    </div>
                                    <DialogFooter>
                                        <Button disabled={isPending} onClick={handleSubmit} className={"bg-purple hover:bg-purple cursor-pointer"} type="submit">Submit</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                          </div>
                          <DataTable loading={isLoading} columns={queueColumn} data={data?.data || []}></DataTable>
                      </div>
                  </SidebarInset>
              </div>
          </SidebarProvider>
      </div>
  )
}